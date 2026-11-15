-- REVIEW ONLY: isolated synthetic fixture. Never apply to the live project.
-- Explicit session guard; the local SQL tests set this only in disposable memory.
DO $$ BEGIN
  IF current_setting('app.kingdom_isolated_fixture', true) IS DISTINCT FROM 'synthetic-only' THEN
    RAISE EXCEPTION 'BLOCKED: isolated synthetic fixture acknowledgment required';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
      WHERE c.relrowsecurity AND ((n.nspname='storage' AND c.relname='objects')
        OR (n.nspname='public' AND c.relname IN ('app_messages','citizen_groups','citizen_group_members')))) <> 4 THEN
    RAISE EXCEPTION 'BLOCKED: attachment and source tables must already have RLS enabled';
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('citizen-private-attachments', 'citizen-private-attachments', false, 2097152,
  ARRAY['image/png','image/jpeg','application/pdf','text/plain'])
ON CONFLICT (id) DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'citizen-private-attachments'
    AND public = false AND file_size_limit = 2097152
    AND allowed_mime_types @> ARRAY['image/png','image/jpeg','application/pdf','text/plain']
    AND allowed_mime_types <@ ARRAY['image/png','image/jpeg','application/pdf','text/plain']) THEN
    RAISE EXCEPTION 'BLOCKED: existing attachment bucket configuration differs';
  END IF;
END $$;

CREATE FUNCTION public.kc_can_access_attachment(object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL
    AND object_name ~ '^(messages|groups)/[0-9a-f-]{36}/[0-9a-f-]{36}_[0-9a-f-]{36}\.(png|jpg|pdf|txt)$'
    AND CASE split_part(object_name, '/', 1)
      WHEN 'messages' THEN EXISTS (
        SELECT 1 FROM public.app_messages m
        WHERE m.id::text = split_part(object_name, '/', 2)
          AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid()))
      WHEN 'groups' THEN EXISTS (
        SELECT 1 FROM public.citizen_groups g
        JOIN public.citizen_group_members gm ON gm.group_id = g.id
        WHERE g.id::text = split_part(object_name, '/', 2)
          AND g.is_active AND gm.user_id = auth.uid())
      ELSE false END
$$;
REVOKE ALL ON FUNCTION public.kc_can_access_attachment(text) FROM PUBLIC;
-- The invoker helper is executable by anon so planning a policy on an
-- unrelated public bucket does not fail its ACL check. auth.uid() must still
-- be non-null, and the helper never bypasses table RLS or grants table access.
GRANT EXECUTE ON FUNCTION public.kc_can_access_attachment(text) TO authenticated, anon;

-- Restrictive gates also constrain pre-existing permissive storage policies.
-- Other buckets retain their existing behavior.
CREATE POLICY kc_attachment_gate ON storage.objects AS RESTRICTIVE FOR ALL TO PUBLIC
USING (CASE WHEN bucket_id = 'citizen-private-attachments'
  THEN auth.uid() IS NOT NULL AND public.kc_can_access_attachment(name) ELSE true END)
WITH CHECK (CASE WHEN bucket_id = 'citizen-private-attachments'
  THEN auth.uid() IS NOT NULL AND public.kc_can_access_attachment(name) ELSE true END);
CREATE POLICY kc_attachment_insert_owner ON storage.objects AS RESTRICTIVE FOR INSERT TO PUBLIC
WITH CHECK (bucket_id <> 'citizen-private-attachments' OR
  (owner_id = auth.uid()::text AND split_part(split_part(name, '/', 3), '_', 1) = auth.uid()::text));
CREATE POLICY kc_attachment_delete_owner ON storage.objects AS RESTRICTIVE FOR DELETE TO PUBLIC
USING (bucket_id <> 'citizen-private-attachments' OR
  (owner_id = auth.uid()::text AND split_part(split_part(name, '/', 3), '_', 1) = auth.uid()::text));
CREATE POLICY kc_attachment_no_overwrite ON storage.objects AS RESTRICTIVE FOR UPDATE TO PUBLIC
USING (bucket_id <> 'citizen-private-attachments') WITH CHECK (bucket_id <> 'citizen-private-attachments');
CREATE POLICY kc_attachment_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'citizen-private-attachments' AND public.kc_can_access_attachment(name));
CREATE POLICY kc_attachment_upload ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'citizen-private-attachments' AND public.kc_can_access_attachment(name)
  AND owner_id = auth.uid()::text AND split_part(split_part(name, '/', 3), '_', 1) = auth.uid()::text);
CREATE POLICY kc_attachment_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'citizen-private-attachments' AND public.kc_can_access_attachment(name)
  AND owner_id = auth.uid()::text AND split_part(split_part(name, '/', 3), '_', 1) = auth.uid()::text);
