-- READ ONLY metadata inspection. Operator MUST first verify the isolated
-- libpq service host/ref. This does not prove Storage/Auth network behavior.
BEGIN READ ONLY;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.citizen_pairing_approvals'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'BLOCKED: approval RLS missing'; END IF;
 IF has_function_privilege('authenticated','public.kc_sensitive_key_operation(uuid,uuid,bigint,bigint,text,jsonb)','EXECUTE') OR has_function_privilege('anon','public.kc_sensitive_key_operation(uuid,uuid,bigint,bigint,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'BLOCKED: ordinary role can call privileged bridge'; END IF;
 IF has_function_privilege('service_role','public.kc_finish_recipient_enrollment(uuid,uuid,text,text)','EXECUTE') OR has_function_privilege('service_role','public.kc_revoke_recipient_key(uuid,integer)','EXECUTE') THEN RAISE EXCEPTION 'BLOCKED: legacy mutation bypass'; END IF;
 IF has_table_privilege('service_role','public.citizen_key_challenges','INSERT') OR has_table_privilege('service_role','public.citizen_key_challenges','UPDATE') THEN RAISE EXCEPTION 'BLOCKED: direct challenge mutation bypass'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN ('public.profiles'::regclass,'public.citizen_key_heads'::regclass,'public.citizen_recipient_keys'::regclass,'public.citizen_key_challenges'::regclass,'storage.objects'::regclass,'public.app_messages'::regclass,'public.citizen_groups'::regclass,'public.citizen_group_members'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'BLOCKED: source RLS disabled'; END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='citizen-private-attachments' AND public=false AND file_size_limit=2097152 AND allowed_mime_types @> ARRAY['image/png','image/jpeg','application/pdf','text/plain'] AND allowed_mime_types <@ ARRAY['image/png','image/jpeg','application/pdf','text/plain']) THEN RAISE EXCEPTION 'BLOCKED: private bucket configuration'; END IF;
END $$;
SELECT n.nspname,c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.oid IN ('public.citizen_pairing_approvals'::regclass,'public.citizen_key_heads'::regclass,'public.citizen_recipient_keys'::regclass,'public.citizen_key_challenges'::regclass,'storage.objects'::regclass);
SELECT proname,prosecdef,proconfig,pg_get_userbyid(proowner) AS trusted_owner_to_review FROM pg_proc WHERE oid='public.kc_sensitive_key_operation(uuid,uuid,bigint,bigint,text,jsonb)'::regprocedure;
SELECT schemaname,tablename,policyname,roles,cmd,permissive FROM pg_policies WHERE (schemaname='storage' AND tablename='objects') OR tablename LIKE 'citizen_key%' OR tablename='citizen_pairing_approvals';
COMMIT;
