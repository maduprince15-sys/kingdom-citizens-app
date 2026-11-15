import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { proofDigest } from '../lib/e2ee/enrollment'
const sql = readFileSync('supabase/migrations/20261115125432_isolated_recipient_key_enrollment.sql','utf8')
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', C='cccccccc-cccc-4ccc-cccc-cccccccccccc', D='dddddddd-dddd-4ddd-dddd-dddddddddddd'
const proof='synthetic-one-time-possession-proof', prior='synthetic-prior-key-proof'
const fingerprint=(value: number)=>Buffer.alloc(32,value).toString('base64')
let db: PGlite
beforeAll(async()=>{
  db=new PGlite()
  await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    CREATE TABLE public.profiles(id uuid PRIMARY KEY); ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY own_profile ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid());
    GRANT USAGE ON SCHEMA auth,public TO authenticated,anon,service_role;
    GRANT SELECT ON public.profiles TO authenticated;
    INSERT INTO public.profiles VALUES('${A}'),('${B}'); SET app.kingdom_isolated_fixture='synthetic-only';`)
  await db.exec(sql)
  await db.exec(readFileSync('supabase/migrations/20261115161155_isolated_pairing_cancellation.sql','utf8'))
},30_000)
beforeEach(async()=>{ await db.exec(`RESET ROLE; TRUNCATE public.citizen_key_heads,public.citizen_recipient_keys,public.citizen_key_challenges; SET request.jwt.claim.sub=''; SET request.jwt.claims='{}';`) })
afterAll(async()=>{await db?.close()})
async function challenge(actor=A,revision=0,key=fingerprint(1),old: string|null=null,expired=false){
  const id=crypto.randomUUID()
  await db.query(`INSERT INTO public.citizen_key_challenges(id,citizen_id,device_id,expected_revision,public_spki,fingerprint,proof_hash,prior_fingerprint,prior_proof_hash,created_at,expires_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,clock_timestamp()-interval '1 minute',clock_timestamp()+interval '${expired?'-1 second':'3 minutes'}')`,
    [id,actor,D,revision,'A'.repeat(128),key,await proofDigest(proof),old,old?await proofDigest(prior):null])
  return id
}
async function finish(id: string,actor=A,answer=proof,previous: string|null=null){ return db.query<{result: {revision:number;version:number;keyId:string}}>('SELECT public.kc_finish_recipient_enrollment($1,$2,$3,$4) AS result',[actor,id,answer,previous]) }
async function service(){ await db.exec('SET ROLE service_role') }
async function citizen(id: string){ await db.exec(`SET request.jwt.claim.sub='${id}'; SET ROLE authenticated;`) }
it('requires explicit isolated migration acknowledgment',async()=>{
  await db.exec(`SET app.kingdom_isolated_fixture=''`)
  await expect(db.exec(sql)).rejects.toThrow('BLOCKED')
  await db.exec(`SET app.kingdom_isolated_fixture='synthetic-only'`)
})
it('legitimate possession proof commits first immutable key version',async()=>{
  const id=await challenge();await service()
  expect((await finish(id)).rows[0].result.revision).toBe(1)
})
it('authenticated clients cannot bypass proof enrollment through table writes or RPC',async()=>{
  const id=await challenge();await citizen(A)
  await expect(db.query('SELECT public.kc_finish_recipient_enrollment($1,$2,$3,NULL)',[A,id,proof])).rejects.toThrow()
  await expect(db.exec(`INSERT INTO public.citizen_key_heads(citizen_id) VALUES('${B}')`)).rejects.toThrow()
})
it('cross-account challenge cannot be completed',async()=>{
  const id=await challenge(B);await service();await expect(finish(id,A)).rejects.toThrow('Invalid enrollment')
})
it('rejects wrong, expired and replayed proofs',async()=>{
  const id=await challenge();const expired=await challenge(A,0,fingerprint(2),null,true);await service()
  await expect(finish(id,A,'incorrect')).rejects.toThrow('possession')
  await expect(finish(expired)).rejects.toThrow('Invalid enrollment')
  await finish(id);await expect(finish(id)).rejects.toThrow('Invalid enrollment')
})
it('rotation requires current-key proof and advances the version atomically',async()=>{
  const first=await challenge();await service();await finish(first);await db.exec('RESET ROLE')
  const id=await challenge(A,1,fingerprint(2),fingerprint(1));await service()
  await expect(finish(id)).rejects.toThrow('current key proof')
  expect((await finish(id,A,proof,prior)).rows[0].result.revision).toBe(2)
  expect((await db.query<{revoked_at:string|null}>(`SELECT revoked_at FROM public.citizen_recipient_keys WHERE version=1`)).rows[0].revoked_at).not.toBeNull()
})
it('concurrent expected-revision completions have exactly one winner',async()=>{
  const one=await challenge(A,0,fingerprint(1)),two=await challenge(A,0,fingerprint(2));await service()
  const result=await Promise.allSettled([finish(one),finish(two)])
  expect(result.filter(value=>value.status==='fulfilled')).toHaveLength(1)
  expect(result.filter(value=>value.status==='rejected')).toHaveLength(1)
})
it('rejects public-key replacement even by privileged table mutation',async()=>{
  const id=await challenge();await service();await finish(id)
  await expect(db.exec(`UPDATE public.citizen_recipient_keys SET public_spki=repeat('B',128) WHERE citizen_id='${A}'`)).rejects.toThrow('Immutable')
})
it('revocation invalidates the active key and authentication alone cannot reenroll',async()=>{
  const id=await challenge();await service();await finish(id)
  expect((await db.query<{result:{revision:number}}>('SELECT public.kc_revoke_recipient_key($1,1) AS result',[A])).rows[0].result.revision).toBe(2)
  await db.exec('RESET ROLE');const replacement=await challenge(A,2,fingerprint(2));await service()
  await expect(finish(replacement)).rejects.toThrow('Recovery approval')
})
it('stale revocation cannot modify a newly rotated key',async()=>{
  const first=await challenge();await service();await finish(first);await db.exec('RESET ROLE')
  const rotated=await challenge(A,1,fingerprint(2),fingerprint(1));await service();await finish(rotated,A,proof,prior)
  await expect(db.query('SELECT public.kc_revoke_recipient_key($1,1)',[A])).rejects.toThrow('revision conflict')
})
it('challenges are private even to other registered Citizens',async()=>{
  await challenge(B);await citizen(A)
  await expect(db.query('SELECT * FROM public.citizen_key_challenges')).rejects.toThrow()
})
it('anonymous and unregistered identities cannot read the registry',async()=>{
  const id=await challenge();await service();await finish(id);await db.exec('RESET ROLE');await citizen(C)
  expect((await db.query('SELECT * FROM public.citizen_recipient_keys')).rows).toHaveLength(0)
  await db.exec('RESET ROLE; SET ROLE anon');await expect(db.query('SELECT * FROM public.citizen_recipient_keys')).rejects.toThrow()
})
it('registered recipients can read active public keys, but not a peer revoked key',async()=>{
  const id=await challenge();await service();await finish(id);await db.exec('RESET ROLE');await citizen(B)
  expect((await db.query('SELECT fingerprint FROM public.citizen_recipient_keys')).rows).toHaveLength(1)
  await db.exec('RESET ROLE');await service();await db.query('SELECT public.kc_revoke_recipient_key($1,1)',[A]);await db.exec('RESET ROLE');await citizen(B)
  expect((await db.query('SELECT fingerprint FROM public.citizen_recipient_keys')).rows).toHaveLength(0)
})
it('profile deletion cleans only its enrollment records without blocking account deletion',async()=>{
  const id=await challenge();await service();await finish(id);await db.exec('RESET ROLE')
  await db.exec(`DELETE FROM public.profiles WHERE id='${A}'`)
  expect((await db.query('SELECT * FROM public.citizen_key_heads')).rows).toHaveLength(0)
  expect((await db.query('SELECT * FROM public.citizen_recipient_keys')).rows).toHaveLength(0)
  expect((await db.query('SELECT * FROM public.citizen_key_challenges')).rows).toHaveLength(0)
  await db.exec(`INSERT INTO public.profiles VALUES('${A}')`)
})
it('does not allow a head pointing to an absent public-key version',async()=>{
  await service()
  await expect(db.exec(`INSERT INTO public.citizen_key_heads(citizen_id,revision,active_version) VALUES('${A}',1,1)`)).rejects.toThrow()
})
it('revocation invalidates an outstanding old-key approval challenge',async()=>{
 const first=await challenge();await service();await finish(first);await db.exec('RESET ROLE')
 const pending=await challenge(A,1,fingerprint(2),fingerprint(1));await service()
 await db.query('SELECT public.kc_revoke_recipient_key($1,1)',[A])
 await expect(finish(pending,A,proof,prior)).rejects.toThrow('revision conflict')
})

it('denies anonymous signed-in identities even if a profile row exists',async()=>{
 const id=await challenge();await service();await finish(id);await db.exec('RESET ROLE')
 await citizen(A);await db.exec(`SET request.jwt.claims='{"is_anonymous":true}'`)
 expect((await db.query('SELECT * FROM public.citizen_recipient_keys')).rows).toHaveLength(0)
 expect((await db.query('SELECT * FROM public.citizen_key_heads')).rows).toHaveLength(0)
})
it('cancelled challenge cannot activate a key and all registry writes roll back',async()=>{
 const id=await challenge();await service();await db.exec(`UPDATE public.citizen_key_challenges SET cancelled_at=clock_timestamp() WHERE id='${id}'`)
 await expect(finish(id,A)).rejects.toThrow()
 await db.exec('RESET ROLE')
 expect((await db.query('SELECT * FROM public.citizen_key_heads')).rows).toHaveLength(0)
 expect((await db.query('SELECT * FROM public.citizen_recipient_keys')).rows).toHaveLength(0)
})
it('terminal challenge cannot be reopened or altered even by service role',async()=>{
 const id=await challenge();await service();await db.exec(`UPDATE public.citizen_key_challenges SET cancelled_at=clock_timestamp() WHERE id='${id}'`)
 await expect(db.exec(`UPDATE public.citizen_key_challenges SET cancelled_at=NULL WHERE id='${id}'`)).rejects.toThrow('closed')
})
it('challenge binding cannot be replaced by privileged accidental updates',async()=>{
 const id=await challenge();await service()
 await expect(db.exec(`UPDATE public.citizen_key_challenges SET citizen_id='${B}' WHERE id='${id}'`)).rejects.toThrow('immutable')
})
it('ordinary Citizens cannot cancel challenges through direct table writes',async()=>{
 const id=await challenge();await citizen(A)
 await expect(db.exec(`UPDATE public.citizen_key_challenges SET cancelled_at=clock_timestamp() WHERE id='${id}'`)).rejects.toThrow()
})
it('completed enrollment cannot be cancelled afterward',async()=>{
 const id=await challenge();await service();await finish(id)
 await expect(db.exec(`UPDATE public.citizen_key_challenges SET cancelled_at=clock_timestamp() WHERE id='${id}'`)).rejects.toThrow('closed')
})
it('cancellation and completion leave exactly one terminal outcome',async()=>{
 const id=await challenge();await service()
 const results=await Promise.allSettled([db.exec(`UPDATE public.citizen_key_challenges SET cancelled_at=clock_timestamp() WHERE id='${id}'`),finish(id)])
 expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1)
 const result=await db.query<{used_at:string|null;cancelled_at:string|null}>(`SELECT used_at,cancelled_at FROM public.citizen_key_challenges WHERE id='${id}'`)
 expect(Boolean(result.rows[0].used_at)!==Boolean(result.rows[0].cancelled_at)).toBe(true)
})
it('expired challenge cannot be marked completed by a delayed writer',async()=>{
 const id=await challenge(A,0,fingerprint(1),null,true);await service()
 await expect(db.exec(`UPDATE public.citizen_key_challenges SET used_at=clock_timestamp() WHERE id='${id}'`)).rejects.toThrow('expired')
})
it('cancellation migration refuses a database without isolated acknowledgment',async()=>{
 await db.exec(`SET app.kingdom_isolated_fixture=''`)
 try {await expect(db.exec(readFileSync('supabase/migrations/20261115161155_isolated_pairing_cancellation.sql','utf8'))).rejects.toThrow('BLOCKED')}
 finally {await db.exec(`SET app.kingdom_isolated_fixture='synthetic-only'`)}
})
