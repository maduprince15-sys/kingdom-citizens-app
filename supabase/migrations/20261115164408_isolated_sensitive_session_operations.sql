-- ISOLATED ONLY. Intentional narrow privileged bridge to private auth.sessions:
-- no auth table grants or general SQL execution are exposed to app roles.
DO $$ BEGIN
 IF current_setting('app.kingdom_isolated_fixture',true) IS DISTINCT FROM 'synthetic-only' THEN RAISE EXCEPTION 'BLOCKED: isolated synthetic fixture required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.citizen_key_challenges'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'BLOCKED: challenge RLS required'; END IF;
 PERFORM id,user_id,not_after FROM auth.sessions LIMIT 0;
 PERFORM cancelled_at FROM public.citizen_key_challenges LIMIT 0;
END $$;
CREATE TABLE public.citizen_pairing_approvals(
 challenge_id uuid PRIMARY KEY REFERENCES public.citizen_key_challenges(id) ON DELETE CASCADE,
 citizen_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 session_id uuid NOT NULL, approved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 step_up_at bigint NOT NULL, token_expires_at bigint NOT NULL
);
ALTER TABLE public.citizen_pairing_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.citizen_pairing_approvals FROM PUBLIC,anon,authenticated,service_role;
-- This SECURITY DEFINER entry point intentionally provides only fixed,
-- service-only operations, including row locks held through key mutations.
-- Owner must be a trusted migration role able to read/lock auth.sessions.
CREATE FUNCTION public.kc_sensitive_key_operation(p_actor uuid,p_session uuid,p_step_up_at bigint,p_token_expires_at bigint,p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s record; c public.citizen_key_challenges; a public.citizen_pairing_approvals; result jsonb; now_epoch bigint;
BEGIN
 SELECT id,user_id,not_after INTO s FROM auth.sessions WHERE id=p_session AND user_id=p_actor FOR SHARE;
 now_epoch:=extract(epoch FROM clock_timestamp())::bigint;
 IF NOT FOUND OR (s.not_after IS NOT NULL AND s.not_after<=clock_timestamp()) OR p_token_expires_at<=now_epoch OR p_step_up_at<now_epoch-300 OR p_step_up_at>now_epoch+30 OR p_step_up_at IS NULL OR p_token_expires_at IS NULL THEN RAISE EXCEPTION 'Sensitive session denied' USING ERRCODE='28000'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_actor) THEN RAISE EXCEPTION 'Citizen unavailable' USING ERRCODE='28000'; END IF;
 IF p_action='check' THEN RETURN 'true'::jsonb; END IF;
 IF p_action='challenge' THEN
  INSERT INTO public.citizen_key_challenges(id,citizen_id,device_id,expected_revision,public_spki,fingerprint,proof_hash,prior_fingerprint,prior_proof_hash,expires_at)
  VALUES((p_payload->>'id')::uuid,p_actor,(p_payload->>'device_id')::uuid,(p_payload->>'expected_revision')::integer,p_payload->>'public_spki',p_payload->>'fingerprint',p_payload->>'proof_hash',p_payload->>'prior_fingerprint',p_payload->>'prior_proof_hash',(p_payload->>'expires_at')::timestamptz);
  result:='true'::jsonb;
 ELSIF p_action='revoke' THEN
  result:=public.kc_revoke_recipient_key(p_actor,(p_payload->>'expected_revision')::integer);
 ELSE
 SELECT * INTO c FROM public.citizen_key_challenges WHERE id=(p_payload->>'challenge_id')::uuid AND citizen_id=p_actor FOR UPDATE;
 IF NOT FOUND OR c.used_at IS NOT NULL OR c.cancelled_at IS NOT NULL OR c.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Challenge unavailable'; END IF;
 IF p_action='cancel' THEN
  UPDATE public.citizen_key_challenges SET cancelled_at=clock_timestamp() WHERE id=c.id;
  result:='true'::jsonb;
 ELSIF p_action='approve' THEN
  IF c.prior_proof_hash IS NULL OR c.prior_proof_hash IS DISTINCT FROM encode(sha256(convert_to(p_payload->>'prior_proof','UTF8')),'hex') THEN RAISE EXCEPTION 'Trusted proof required'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.citizen_key_heads h JOIN public.citizen_recipient_keys k ON k.citizen_id=h.citizen_id AND k.version=h.active_version WHERE h.citizen_id=p_actor AND h.revision=c.expected_revision AND k.fingerprint=c.prior_fingerprint AND k.revoked_at IS NULL) THEN RAISE EXCEPTION 'Trusted device changed'; END IF;
  INSERT INTO public.citizen_pairing_approvals(challenge_id,citizen_id,session_id,step_up_at,token_expires_at) VALUES(c.id,p_actor,p_session,p_step_up_at,p_token_expires_at);
  result:='true'::jsonb;
 ELSIF p_action='complete' THEN
  IF c.expected_revision>0 THEN
   SELECT * INTO a FROM public.citizen_pairing_approvals WHERE challenge_id=c.id AND citizen_id=p_actor;
   IF NOT FOUND OR a.step_up_at<now_epoch-300 OR a.token_expires_at<=now_epoch THEN RAISE EXCEPTION 'Authenticated trusted approval required'; END IF;
   PERFORM id FROM auth.sessions WHERE id=a.session_id AND user_id=p_actor AND (not_after IS NULL OR not_after>clock_timestamp()) FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Approval session revoked' USING ERRCODE='28000'; END IF;
  END IF;
  result:=public.kc_finish_recipient_enrollment(p_actor,c.id,p_payload->>'proof',p_payload->>'prior_proof');
 ELSE
  RAISE EXCEPTION 'Unsupported operation';
 END IF;
 END IF;
 -- Recheck after waiting for challenge/head locks; expiry rolls back writes.
 now_epoch:=extract(epoch FROM clock_timestamp())::bigint;
 IF p_token_expires_at<=now_epoch OR p_step_up_at<now_epoch-300 OR (s.not_after IS NOT NULL AND s.not_after<=clock_timestamp()) THEN RAISE EXCEPTION 'Sensitive session expired' USING ERRCODE='28000'; END IF;
 IF p_action='complete' AND c.expected_revision>0 THEN
  IF a.token_expires_at<=now_epoch OR a.step_up_at<now_epoch-300 OR NOT EXISTS(SELECT 1 FROM auth.sessions WHERE id=a.session_id AND user_id=p_actor AND (not_after IS NULL OR not_after>clock_timestamp())) THEN RAISE EXCEPTION 'Approval expired' USING ERRCODE='28000'; END IF;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.kc_sensitive_key_operation(uuid,uuid,bigint,bigint,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kc_sensitive_key_operation(uuid,uuid,bigint,bigint,text,jsonb) TO service_role;
-- Prevent bypassing session checks through the former privileged entry points.
REVOKE EXECUTE ON FUNCTION public.kc_finish_recipient_enrollment(uuid,uuid,text,text),public.kc_revoke_recipient_key(uuid,integer) FROM service_role;
REVOKE INSERT,UPDATE ON public.citizen_key_challenges,public.citizen_key_heads,public.citizen_recipient_keys FROM service_role;
