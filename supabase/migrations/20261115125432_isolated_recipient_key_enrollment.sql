-- REVIEW ONLY: dedicated synthetic fixture, never Production.
DO $$ BEGIN
  IF current_setting('app.kingdom_isolated_fixture', true) IS DISTINCT FROM 'synthetic-only' THEN
    RAISE EXCEPTION 'BLOCKED: isolated synthetic fixture acknowledgment required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='profiles' AND c.relrowsecurity) THEN
    RAISE EXCEPTION 'BLOCKED: profile RLS must already be enabled';
  END IF;
END $$;
CREATE TABLE public.citizen_key_heads (
  citizen_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  revision integer NOT NULL DEFAULT 0 CHECK(revision >= 0),
  active_version integer CHECK(active_version > 0 AND active_version <= revision)
);
CREATE TABLE public.citizen_recipient_keys (
  citizen_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK(version > 0), device_id uuid NOT NULL,
  public_spki text NOT NULL CHECK(length(public_spki) BETWEEN 128 AND 2048 AND public_spki ~ '^[A-Za-z0-9+/]+={0,2}$'),
  fingerprint text NOT NULL UNIQUE CHECK(fingerprint ~ '^[A-Za-z0-9+/]{43}=$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), revoked_at timestamptz CHECK(revoked_at IS NULL OR revoked_at>=created_at),
  PRIMARY KEY(citizen_id,version)
);
ALTER TABLE public.citizen_key_heads ADD CONSTRAINT kc_active_version_exists
  FOREIGN KEY(citizen_id,active_version) REFERENCES public.citizen_recipient_keys(citizen_id,version)
  DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE public.citizen_key_challenges (
  id uuid PRIMARY KEY, citizen_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, device_id uuid NOT NULL,
  expected_revision integer NOT NULL CHECK(expected_revision >= 0),
  public_spki text NOT NULL CHECK(length(public_spki) BETWEEN 128 AND 2048),
  fingerprint text NOT NULL CHECK(fingerprint ~ '^[A-Za-z0-9+/]{43}=$'),
  proof_hash text NOT NULL CHECK(proof_hash ~ '^[0-9a-f]{64}$'),
  prior_fingerprint text, prior_proof_hash text CHECK(prior_proof_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL,
  used_at timestamptz, CHECK(expires_at > created_at AND expires_at <= created_at + interval '5 minutes')
);
ALTER TABLE public.citizen_key_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_recipient_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_key_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.citizen_key_heads, public.citizen_recipient_keys, public.citizen_key_challenges FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.citizen_key_heads, public.citizen_recipient_keys TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.citizen_key_heads, public.citizen_recipient_keys, public.citizen_key_challenges TO service_role;
CREATE POLICY kc_registered_key_heads ON public.citizen_key_heads FOR SELECT TO authenticated
USING (coalesce(auth.jwt()->>'is_anonymous','false')<>'true' AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()));
-- Public enrollment material only: no private key, nonce plaintext, contact data or role.
CREATE POLICY kc_registered_public_keys ON public.citizen_recipient_keys FOR SELECT TO authenticated
USING (coalesce(auth.jwt()->>'is_anonymous','false')<>'true' AND EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()) AND
  (citizen_id=auth.uid() OR EXISTS(SELECT 1 FROM public.citizen_key_heads h WHERE h.citizen_id=citizen_recipient_keys.citizen_id AND h.active_version=citizen_recipient_keys.version)));
CREATE FUNCTION public.kc_immutable_recipient_key() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
  IF (NEW.citizen_id,NEW.version,NEW.device_id,NEW.public_spki,NEW.fingerprint,NEW.created_at)
      IS DISTINCT FROM (OLD.citizen_id,OLD.version,OLD.device_id,OLD.public_spki,OLD.fingerprint,OLD.created_at)
      OR (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at)
      OR (OLD.revoked_at IS NULL AND NEW.revoked_at IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Immutable key identity';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.kc_immutable_recipient_key() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER kc_key_identity_guard BEFORE UPDATE ON public.citizen_recipient_keys FOR EACH ROW EXECUTE FUNCTION public.kc_immutable_recipient_key();

CREATE FUNCTION public.kc_finish_recipient_enrollment(p_actor uuid,p_challenge uuid,p_proof text,p_prior_proof text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE c public.citizen_key_challenges%ROWTYPE; h public.citizen_key_heads%ROWTYPE;
  old_key public.citizen_recipient_keys%ROWTYPE; next_revision integer;
BEGIN
  SELECT * INTO c FROM public.citizen_key_challenges WHERE id=p_challenge AND citizen_id=p_actor FOR UPDATE;
  IF NOT FOUND OR c.used_at IS NOT NULL OR c.expires_at<=clock_timestamp() THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Invalid enrollment challenge';
  END IF;
  IF p_proof IS NULL OR encode(sha256(convert_to(p_proof,'UTF8')),'hex')<>c.proof_hash THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Invalid possession proof';
  END IF;
  INSERT INTO public.citizen_key_heads(citizen_id,revision) VALUES(p_actor,0) ON CONFLICT DO NOTHING;
  SELECT * INTO h FROM public.citizen_key_heads WHERE citizen_id=p_actor FOR UPDATE;
  IF h.revision<>c.expected_revision THEN
    RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='Key revision conflict';
  END IF;
  IF h.revision>0 THEN
    IF h.active_version IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Recovery approval required';
    END IF;
    SELECT * INTO old_key FROM public.citizen_recipient_keys WHERE citizen_id=p_actor AND version=h.active_version FOR UPDATE;
    IF NOT FOUND OR old_key.revoked_at IS NOT NULL OR c.prior_fingerprint IS DISTINCT FROM old_key.fingerprint
        OR c.prior_proof_hash IS NULL OR p_prior_proof IS NULL
        OR encode(sha256(convert_to(p_prior_proof,'UTF8')),'hex')<>c.prior_proof_hash THEN
      RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Trusted current key proof required';
    END IF;
  ELSIF c.prior_fingerprint IS NOT NULL OR c.prior_proof_hash IS NOT NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Unexpected prior key';
  END IF;
  next_revision := h.revision+1;
  INSERT INTO public.citizen_recipient_keys(citizen_id,version,device_id,public_spki,fingerprint)
    VALUES(p_actor,next_revision,c.device_id,c.public_spki,c.fingerprint);
  IF h.active_version IS NOT NULL THEN
    UPDATE public.citizen_recipient_keys SET revoked_at=clock_timestamp() WHERE citizen_id=p_actor AND version=h.active_version;
  END IF;
  UPDATE public.citizen_key_heads SET revision=next_revision,active_version=next_revision WHERE citizen_id=p_actor;
  UPDATE public.citizen_key_challenges SET used_at=clock_timestamp() WHERE id=c.id;
  RETURN jsonb_build_object('revision',next_revision,'version',next_revision,'keyId',c.fingerprint);
END $$;
CREATE FUNCTION public.kc_revoke_recipient_key(p_actor uuid,p_expected_revision integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE h public.citizen_key_heads%ROWTYPE;
BEGIN
  SELECT * INTO h FROM public.citizen_key_heads WHERE citizen_id=p_actor FOR UPDATE;
  IF NOT FOUND OR h.revision<>p_expected_revision THEN
    RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='Key revision conflict';
  END IF;
  IF h.active_version IS NULL THEN RETURN jsonb_build_object('revision',h.revision,'state','revoked'); END IF;
  UPDATE public.citizen_recipient_keys SET revoked_at=clock_timestamp() WHERE citizen_id=p_actor AND version=h.active_version;
  UPDATE public.citizen_key_heads SET revision=h.revision+1,active_version=NULL WHERE citizen_id=p_actor;
  RETURN jsonb_build_object('revision',h.revision+1,'state','revoked');
END $$;
REVOKE ALL ON FUNCTION public.kc_finish_recipient_enrollment(uuid,uuid,text,text),public.kc_revoke_recipient_key(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kc_finish_recipient_enrollment(uuid,uuid,text,text),public.kc_revoke_recipient_key(uuid,integer) TO service_role;
