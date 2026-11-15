import {beforeAll,beforeEach,afterAll,expect,it} from 'vitest'
import {PGlite} from '@electric-sql/pglite'
import {readFileSync} from 'node:fs'
import {proofDigest} from '../lib/e2ee/enrollment'
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',S='11111111-1111-4111-8111-111111111111',T='22222222-2222-4222-8222-222222222222',D='dddddddd-dddd-4ddd-dddd-dddddddddddd'
const proof=Buffer.alloc(32,7).toString('base64'),prior=Buffer.alloc(32,8).toString('base64'),fp=(n:number)=>Buffer.alloc(32,n).toString('base64')
let db:PGlite
const now=()=>Math.floor(Date.now()/1000)
beforeAll(async()=>{
 db=new PGlite();await db.exec(`CREATE ROLE authenticated; CREATE ROLE anon; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
 CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL,not_after timestamptz);
 CREATE TABLE public.profiles(id uuid PRIMARY KEY); ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 INSERT INTO public.profiles VALUES('${A}'),('${B}'); GRANT USAGE ON SCHEMA public,auth TO service_role,authenticated,anon;
 SET app.kingdom_isolated_fixture='synthetic-only';`)
 await db.exec(`CREATE SCHEMA storage;
 CREATE TABLE storage.objects(id uuid); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
 CREATE TABLE storage.buckets(id text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 INSERT INTO storage.buckets VALUES('citizen-private-attachments',false,2097152,ARRAY['image/png','image/jpeg','application/pdf','text/plain']);
 CREATE TABLE public.app_messages(id uuid); ALTER TABLE public.app_messages ENABLE ROW LEVEL SECURITY;
 CREATE TABLE public.citizen_groups(id uuid); ALTER TABLE public.citizen_groups ENABLE ROW LEVEL SECURITY;
 CREATE TABLE public.citizen_group_members(id uuid); ALTER TABLE public.citizen_group_members ENABLE ROW LEVEL SECURITY;`)
 for(const file of ['20261115125432_isolated_recipient_key_enrollment.sql','20261115161155_isolated_pairing_cancellation.sql','20261115164408_isolated_sensitive_session_operations.sql'])await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'))
},30_000)
beforeEach(async()=>{await db.exec(`RESET ROLE; TRUNCATE public.citizen_pairing_approvals,public.citizen_key_challenges,public.citizen_key_heads,public.citizen_recipient_keys,auth.sessions;INSERT INTO auth.sessions VALUES('${S}','${A}',NULL),('${T}','${A}',NULL); SET ROLE service_role;`)})
afterAll(async()=>{await db?.close()})
async function op(action:string,payload:Record<string,unknown>={},actor=A,session=S,step=now(),expiry=now()+600){
 return db.query<{result:unknown}>('SELECT public.kc_sensitive_key_operation($1,$2,$3,$4,$5,$6::jsonb) AS result',[actor,session,step,expiry,action,JSON.stringify(payload)])
}
async function challenge(revision=0,session=S){const id=crypto.randomUUID();await op('challenge',{id,device_id:D,expected_revision:revision,public_spki:'A'.repeat(128),fingerprint:fp(revision+1),proof_hash:await proofDigest(proof),prior_fingerprint:revision?fp(1):null,prior_proof_hash:revision?await proofDigest(prior):null,expires_at:new Date(Date.now()+180_000).toISOString()},A,session);return id}
async function enrolled(){const id=await challenge();await op('complete',{challenge_id:id,proof});return id}
it('authorizes a live owned session and initial enrollment',async()=>{expect((await op('check')).rows[0].result).toBe(true);await enrolled()})
it('rejects revoked session despite an unexpired access-token timestamp',async()=>{await db.exec(`RESET ROLE;DELETE FROM auth.sessions WHERE id='${S}';SET ROLE service_role;`);await expect(op('check')).rejects.toThrow('denied')})
it('rejects another Citizen session',async()=>{await expect(op('check',{},B,S)).rejects.toThrow('denied')})
it.each(['token','mfa','session-timebox'])('rejects expired %s',async kind=>{
 if(kind==='session-timebox')await db.exec(`RESET ROLE;UPDATE auth.sessions SET not_after=clock_timestamp()-interval '1 second';SET ROLE service_role;`)
 await expect(op('check',{},A,S,kind==='mfa'?now()-301:now(),kind==='token'?now()-1:now()+60)).rejects.toThrow('denied')
})
it('permits separately authenticated concurrent sessions without mixing their owner',async()=>{expect((await op('check',{},A,T)).rows[0].result).toBe(true);await expect(op('check',{},B,T)).rejects.toThrow()})
it('requires a server-recorded trusted approval before rotation',async()=>{await enrolled();const id=await challenge(1,T);await expect(op('complete',{challenge_id:id,proof,prior_proof:prior},A,T)).rejects.toThrow('approval required')})
it('completes dual-proof pairing with authenticated trusted approval',async()=>{await enrolled();const id=await challenge(1,T);await op('approve',{challenge_id:id,prior_proof:prior});expect((await op('complete',{challenge_id:id,proof,prior_proof:prior},A,T)).rows[0].result).toMatchObject({revision:2})})
it('rejects copied approval after the trusted session is revoked',async()=>{
 await enrolled();const id=await challenge(1,T);await op('approve',{challenge_id:id,prior_proof:prior})
 await db.exec(`RESET ROLE;DELETE FROM auth.sessions WHERE id='${S}';SET ROLE service_role;`)
 await expect(op('complete',{challenge_id:id,proof,prior_proof:prior},A,T)).rejects.toThrow('revoked')
 expect((await db.query<{revision:number}>(`SELECT revision FROM public.citizen_key_heads WHERE citizen_id='${A}'`)).rows[0].revision).toBe(1)
})
it('rejects approval replay and terminal challenge reuse',async()=>{await enrolled();const id=await challenge(1,T);await op('approve',{challenge_id:id,prior_proof:prior});await expect(op('approve',{challenge_id:id,prior_proof:prior})).rejects.toThrow();await op('cancel',{challenge_id:id},A,T);await expect(op('complete',{challenge_id:id,proof,prior_proof:prior},A,T)).rejects.toThrow('unavailable')})
it('rejects wrong trusted-key possession',async()=>{await enrolled();const id=await challenge(1,T);await expect(op('approve',{challenge_id:id,prior_proof:proof})).rejects.toThrow('proof required')})
it('ordinary Citizens cannot call the privileged auth bridge',async()=>{await db.exec('RESET ROLE;SET ROLE authenticated');await expect(op('check')).rejects.toThrow('permission denied')})
it('service callers cannot bypass session gates through legacy mutation functions or tables',async()=>{
 await expect(db.query('SELECT public.kc_revoke_recipient_key($1,0)',[A])).rejects.toThrow('permission denied')
 await expect(db.exec('UPDATE public.citizen_key_challenges SET cancelled_at=clock_timestamp()')).rejects.toThrow('permission denied')
 await expect(db.exec('SELECT * FROM auth.sessions')).rejects.toThrow('permission denied')
 await expect(db.exec('SELECT * FROM public.citizen_pairing_approvals')).rejects.toThrow('permission denied')
})

it('executes the read-only isolated deployment metadata probe',async()=>{
 await db.exec('RESET ROLE');await db.exec(readFileSync('scripts/sql/verify-isolated-key-security.sql','utf8'))
})
it('metadata probe rejects accidentally exposed privileged execute grants',async()=>{
 await db.exec('RESET ROLE;GRANT EXECUTE ON FUNCTION public.kc_sensitive_key_operation(uuid,uuid,bigint,bigint,text,jsonb) TO authenticated')
 try{await expect(db.exec(readFileSync('scripts/sql/verify-isolated-key-security.sql','utf8'))).rejects.toThrow('BLOCKED')}
 finally{await db.exec('ROLLBACK;REVOKE EXECUTE ON FUNCTION public.kc_sensitive_key_operation(uuid,uuid,bigint,bigint,text,jsonb) FROM authenticated')}
})
it.each(['cancel','approve','complete'])('a different valid Citizen session cannot %s another Citizen challenge',async action=>{
 const id=await challenge(),other='33333333-3333-4333-8333-333333333333'
 await db.exec(`RESET ROLE;INSERT INTO auth.sessions VALUES('${other}','${B}',NULL);SET ROLE service_role;`)
 await expect(op(action,{challenge_id:id,proof,prior_proof:prior},B,other)).rejects.toThrow('unavailable')
})
it('a revoked trusted device cannot authorize another enrollment',async()=>{
 await enrolled();const id=await challenge(1,T);await op('revoke',{expected_revision:1})
 await expect(op('approve',{challenge_id:id,prior_proof:prior})).rejects.toThrow('device changed')
})
