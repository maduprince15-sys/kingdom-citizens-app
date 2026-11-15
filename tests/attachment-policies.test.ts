import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
const migration = readFileSync('supabase/migrations/20261115115146_isolated_private_attachment_policies.sql', 'utf8')
const A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', C = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'
const M = 'dddddddd-dddd-4ddd-dddd-dddddddddddd', G = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee', F = 'ffffffff-ffff-4fff-ffff-ffffffffffff'
const bucket = 'citizen-private-attachments'
const messagePath = `messages/${M}/${A}_${F}.txt`, groupPath = `groups/${G}/${A}_${F}.txt`
let db: PGlite
beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    CREATE ROLE authenticated; CREATE ROLE anon;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE TABLE public.app_messages(id uuid primary key, sender_id uuid, recipient_id uuid);
    CREATE TABLE public.citizen_groups(id uuid primary key, is_active boolean);
    CREATE TABLE public.citizen_group_members(group_id uuid, user_id uuid);
    CREATE TABLE storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid default gen_random_uuid(), bucket_id text, name text, owner_id text, metadata jsonb);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.app_messages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.citizen_groups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.citizen_group_members ENABLE ROW LEVEL SECURITY;
    CREATE POLICY message_read ON public.app_messages FOR SELECT TO authenticated USING(sender_id=auth.uid() OR recipient_id=auth.uid());
    CREATE POLICY group_read ON public.citizen_groups FOR SELECT TO authenticated USING(is_active);
    CREATE POLICY member_read ON public.citizen_group_members FOR SELECT TO authenticated USING(user_id=auth.uid());
    -- Deliberately broad fixture proves the migration's restrictive gates win.
    CREATE POLICY broad_existing ON storage.objects FOR ALL TO PUBLIC USING(true) WITH CHECK(true);
    GRANT USAGE ON SCHEMA auth, storage TO authenticated, anon;
    GRANT SELECT ON public.app_messages, public.citizen_groups, public.citizen_group_members TO authenticated, anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated, anon;
    INSERT INTO public.app_messages VALUES('${M}','${A}','${B}');
    INSERT INTO public.citizen_groups VALUES('${G}',true);
    SET app.kingdom_isolated_fixture='synthetic-only';
  `)
  await db.exec(migration)
}, 30_000)
beforeEach(async () => {
  await db.exec(`RESET ROLE; SET request.jwt.claim.sub=''; TRUNCATE storage.objects,public.citizen_group_members; UPDATE public.citizen_groups SET is_active=true;
    INSERT INTO public.citizen_group_members VALUES('${G}','${A}'),('${G}','${B}');
    INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('${bucket}','${messagePath}','${A}'),('${bucket}','${groupPath}','${A}'),('other-public','visible.txt','${A}');`)
})
afterAll(async () => { await db?.close() })
async function asCitizen(id: string) { await db.exec(`SET request.jwt.claim.sub='${id}'; SET ROLE authenticated;`) }
it('migration refuses a non-acknowledged database before changes', async () => {
  await db.exec(`SET app.kingdom_isolated_fixture='';`)
  await expect(db.exec(migration)).rejects.toThrow('BLOCKED')
  await db.exec(`SET app.kingdom_isolated_fixture='synthetic-only';`)
})
it('creates private size/type-limited bucket metadata', async () => {
  const result = await db.query<{ public: boolean; file_size_limit: string }>(`SELECT public,file_size_limit FROM storage.buckets WHERE id='${bucket}'`)
  expect(result.rows[0].public).toBe(false)
  expect(Number(result.rows[0].file_size_limit)).toBe(2097152)
})
it('recipient can read an authorized private message attachment', async () => {
  await asCitizen(B)
  expect((await db.query(`SELECT name FROM storage.objects WHERE name='${messagePath}'`)).rows).toHaveLength(1)
})
it('third Citizen cannot read private message or group attachments despite broad existing policy', async () => {
  await asCitizen(C)
  expect((await db.query(`SELECT name FROM storage.objects WHERE bucket_id='${bucket}'`)).rows).toHaveLength(0)
})
it('removed group member immediately loses read access', async () => {
  await db.exec(`DELETE FROM public.citizen_group_members WHERE user_id='${B}'`)
  await asCitizen(B)
  expect((await db.query(`SELECT name FROM storage.objects WHERE name='${groupPath}'`)).rows).toHaveLength(0)
})
it('inactive group loses access', async () => {
  await db.exec(`UPDATE public.citizen_groups SET is_active=false`)
  await asCitizen(A)
  expect((await db.query(`SELECT name FROM storage.objects WHERE name='${groupPath}'`)).rows).toHaveLength(0)
})
it('participant can insert only their own uploader-bound path', async () => {
  await asCitizen(B)
  await db.exec(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('${bucket}','messages/${M}/${B}_${F}.txt','${B}')`)
})
it('rejects forged uploader path', async () => {
  await asCitizen(B)
  await expect(db.exec(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('${bucket}','${messagePath}','${B}')`)).rejects.toThrow()
})
it('rejects forged owner ID', async () => {
  await asCitizen(B)
  await expect(db.exec(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('${bucket}','messages/${M}/${B}_${F}.txt','${A}')`)).rejects.toThrow()
})
it('rejects cross-conversation upload', async () => {
  await asCitizen(C)
  await expect(db.exec(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('${bucket}','messages/${M}/${C}_${F}.txt','${C}')`)).rejects.toThrow()
})
it('revoked group member cannot upload', async () => {
  await db.exec(`DELETE FROM public.citizen_group_members WHERE user_id='${B}'`)
  await asCitizen(B)
  await expect(db.exec(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('${bucket}','groups/${G}/${B}_${F}.txt','${B}')`)).rejects.toThrow()
})
it('never allows participant overwrite or ownership reassignment', async () => {
  await asCitizen(A)
  expect((await db.query(`UPDATE storage.objects SET owner_id='${B}' WHERE name='${messagePath}' RETURNING id`)).rows).toHaveLength(0)
})
it('only current-access uploader can delete', async () => {
  await asCitizen(B)
  expect((await db.query(`DELETE FROM storage.objects WHERE name='${messagePath}' RETURNING id`)).rows).toHaveLength(0)
  await db.exec('RESET ROLE')
  await asCitizen(A)
  expect((await db.query(`DELETE FROM storage.objects WHERE name='${messagePath}' RETURNING id`)).rows).toHaveLength(1)
})
it('revoked uploader cannot delete group attachments', async () => {
  await db.exec(`DELETE FROM public.citizen_group_members WHERE user_id='${A}'`)
  await asCitizen(A)
  expect((await db.query(`DELETE FROM storage.objects WHERE name='${groupPath}' RETURNING id`)).rows).toHaveLength(0)
})
it('does not change policy behavior for unrelated buckets', async () => {
  await asCitizen(C)
  expect((await db.query(`SELECT name FROM storage.objects WHERE bucket_id='other-public'`)).rows).toHaveLength(1)
})
it.each(['../secret.txt', `messages/${M}/${A}_${F}.html`, `groups/${G}/invalid.txt`])('rejects malformed or unapproved path %s', async path => {
  await asCitizen(A)
  await expect(db.exec(`INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('${bucket}','${path}','${A}')`)).rejects.toThrow()
})
it('helper is invoker-scoped with a fixed empty search path', async () => {
  const result = await db.query<{ prosecdef: boolean; proconfig: string[] }>(`SELECT prosecdef,proconfig FROM pg_proc WHERE oid='public.kc_can_access_attachment(text)'::regprocedure`)
  expect(result.rows[0].prosecdef).toBe(false)
  expect(result.rows[0].proconfig).toContain('search_path=""')
})
it('revoked message participant loses read access', async () => {
  await db.exec(`UPDATE public.app_messages SET recipient_id='${C}' WHERE id='${M}'`)
  await asCitizen(B)
  expect((await db.query(`SELECT name FROM storage.objects WHERE name='${messagePath}'`)).rows).toHaveLength(0)
  await db.exec('RESET ROLE')
  await db.exec(`UPDATE public.app_messages SET recipient_id='${B}' WHERE id='${M}'`)
})
it('anonymous role cannot read private objects', async () => {
  await db.exec(`SET request.jwt.claim.sub=''; SET ROLE anon;`)
  try {
    expect((await db.query(`SELECT name FROM storage.objects WHERE bucket_id='${bucket}'`)).rows).toHaveLength(0)
  } catch (error) {
    expect((error as { code: string }).code).toBe('42501')
  }
})
it('anonymous behavior for unrelated buckets is preserved', async () => {
  await db.exec(`SET request.jwt.claim.sub=''; SET ROLE anon;`)
  expect((await db.query(`SELECT name FROM storage.objects WHERE bucket_id='other-public'`)).rows).toHaveLength(1)
})
it('refuses deployment when source or storage RLS is disabled', async () => {
  await db.exec('ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY')
  try { await expect(db.exec(migration)).rejects.toThrow('BLOCKED') }
  finally { await db.exec('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY') }
})
