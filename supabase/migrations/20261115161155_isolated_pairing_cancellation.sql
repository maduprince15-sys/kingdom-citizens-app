-- Review and deploy only to an acknowledged synthetic isolated project.
DO $$ BEGIN
 IF current_setting('app.kingdom_isolated_fixture',true) IS DISTINCT FROM 'synthetic-only' THEN RAISE EXCEPTION 'BLOCKED: isolated synthetic fixture required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.citizen_key_challenges'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'BLOCKED: challenge RLS required'; END IF;
END $$;
ALTER TABLE public.citizen_key_challenges ADD COLUMN cancelled_at timestamptz;
ALTER TABLE public.citizen_key_challenges ADD CONSTRAINT kc_challenge_terminal_state CHECK (cancelled_at IS NULL OR used_at IS NULL);
CREATE FUNCTION public.kc_guard_challenge_lifecycle() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF (to_jsonb(NEW)-'used_at'-'cancelled_at') IS DISTINCT FROM (to_jsonb(OLD)-'used_at'-'cancelled_at') THEN RAISE EXCEPTION 'Challenge identity is immutable'; END IF;
 IF OLD.used_at IS NOT NULL OR OLD.cancelled_at IS NOT NULL THEN RAISE EXCEPTION 'Challenge is already closed'; END IF;
 IF NEW.used_at IS NOT NULL AND (NEW.cancelled_at IS NOT NULL OR OLD.expires_at <= clock_timestamp()) THEN RAISE EXCEPTION 'Challenge expired or cancelled'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.kc_guard_challenge_lifecycle() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER kc_challenge_lifecycle BEFORE UPDATE ON public.citizen_key_challenges FOR EACH ROW EXECUTE FUNCTION public.kc_guard_challenge_lifecycle();
-- Existing service-only grants remain unchanged. Cancellation and completion
-- serialize on this row; failed completion rolls back registry mutations too.
