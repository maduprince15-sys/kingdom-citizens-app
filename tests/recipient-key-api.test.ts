import { beforeAll, beforeEach, afterEach, expect, it, vi } from 'vitest'
import { bytesToBase64 } from '../lib/e2ee/crypto'
import { answerEnrollmentChallenge, proofDigest } from '../lib/e2ee/enrollment'
import { generateRecipientIdentity, publicKeyFingerprint } from '../lib/e2ee/recipient-envelope'
const m=vi.hoisted(()=>({ getUser:vi.fn(),from:vi.fn(),directory:vi.fn(),admin:vi.fn(),adminFrom:vi.fn(),rpc:vi.fn() }))
vi.mock('../lib/supabase/server',()=>({ createClient:async()=>({auth:{getUser:m.getUser},from:m.from,rpc:m.directory}) }))
vi.mock('../lib/supabase/admin',()=>({createAdminClient:m.admin}))
import { GET,POST } from '../app/api/messages/recipient-keys/route'
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',D='dddddddd-dddd-4ddd-dddd-dddddddddddd',C='cccccccc-cccc-4ccc-cccc-cccccccccccc'
let identity: CryptoKeyPair, spki:string,keyId:string
function query(data:unknown,error:unknown=null){
 const q={select:vi.fn(),eq:vi.fn(),is:vi.fn(),update:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data,error}),insert:vi.fn().mockResolvedValue({error})}
 q.update.mockReturnValue(q);q.select.mockReturnValue(q);q.eq.mockReturnValue(q);q.is.mockReturnValue(q);return q
}
function request(body:unknown){return new Request('https://preview.invalid/api/messages/recipient-keys',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
beforeAll(async()=>{ identity=await generateRecipientIdentity();spki=bytesToBase64(new Uint8Array(await crypto.subtle.exportKey('spki',identity.publicKey)));keyId=await publicKeyFingerprint(identity.publicKey) },30_000)
beforeEach(()=>{
 vi.resetAllMocks();vi.stubEnv('KC_RECIPIENT_ENROLLMENT_ENABLED','isolated-test-only');vi.stubEnv('KC_ISOLATED_TEST_PROJECT_REF','synthetic-test');vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://synthetic-test.supabase.co');vi.stubEnv('VERCEL_ENV','preview')
 m.getUser.mockResolvedValue({data:{user:{id:A,email_confirmed_at:new Date().toISOString(),is_anonymous:false}},error:null})
 m.from.mockReturnValue(query({id:A}));m.admin.mockReturnValue({from:m.adminFrom,rpc:m.rpc});m.rpc.mockResolvedValue({data:{revision:1,version:1,keyId},error:null})
})
afterEach(vi.unstubAllEnvs)
it('requires a valid session before creating any privileged client',async()=>{
 m.getUser.mockResolvedValue({data:{user:null},error:null});expect((await POST(request({action:'challenge'}))).status).toBe(401);expect(m.admin).not.toHaveBeenCalled()
})
it.each(['disabled','production','live-project'])('fails closed for %s configuration',async mode=>{
 if(mode==='disabled')vi.stubEnv('KC_RECIPIENT_ENROLLMENT_ENABLED','')
 if(mode==='production')vi.stubEnv('VERCEL_ENV','production')
 if(mode==='live-project'){vi.stubEnv('KC_ISOLATED_TEST_PROJECT_REF','jngbhejfqbyjletfknkh');vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://jngbhejfqbyjletfknkh.supabase.co')}
 expect((await POST(request({action:'challenge'}))).status).toBe(503);expect(m.admin).not.toHaveBeenCalled()
})
it('requires a confirmed non-anonymous Citizen',async()=>{
 m.getUser.mockResolvedValue({data:{user:{id:A,is_anonymous:true}},error:null});expect((await POST(request({action:'challenge'}))).status).toBe(403);expect(m.admin).not.toHaveBeenCalled()
})
it('rejects caller-supplied owner identity',async()=>{
 expect((await POST(request({action:'challenge',citizenId:B,deviceId:D,expectedRevision:0,publicSpki:spki}))).status).toBe(400);expect(m.admin).not.toHaveBeenCalled()
})
it('creates a challenge bound only to the authenticated Citizen and possession of the submitted key',async()=>{
 const write=query(null);m.adminFrom.mockReturnValueOnce(query(null)).mockReturnValueOnce(write)
 const response=await POST(request({action:'challenge',deviceId:D,expectedRevision:0,publicSpki:spki}))
 expect(response.status).toBe(201)
 const challenge=await response.json();expect(challenge.context.citizenId).toBe(A)
 const answer=await answerEnrollmentChallenge(challenge,A,identity)
 expect(write.insert).toHaveBeenCalledWith(expect.objectContaining({citizen_id:A,device_id:D,fingerprint:keyId,proof_hash:await proofDigest(answer.proof)}))
 expect(JSON.stringify(write.insert.mock.calls[0])).not.toContain(answer.proof)
})
it('finishes with the server-derived actor after constant-time proof validation',async()=>{
 const proof=bytesToBase64(crypto.getRandomValues(new Uint8Array(32))),lookup=query({id:C,proof_hash:await proofDigest(proof),prior_proof_hash:null,expires_at:new Date(Date.now()+60_000).toISOString(),used_at:null})
 m.adminFrom.mockReturnValue(lookup)
 expect((await POST(request({action:'complete',challengeId:C,proof}))).status).toBe(200)
 expect(lookup.eq).toHaveBeenCalledWith('citizen_id',A)
 expect(m.rpc).toHaveBeenCalledWith('kc_finish_recipient_enrollment',expect.objectContaining({p_actor:A,p_challenge:C,p_proof:proof}))
})
it('rejects another Citizen challenge before calling the commit function',async()=>{
 m.adminFrom.mockReturnValue(query(null))
 expect((await POST(request({action:'complete',challengeId:C,proof:'A'.repeat(43)+'='}))).status).toBe(404);expect(m.rpc).not.toHaveBeenCalled()
})
it('rejects incorrect possession proof',async()=>{
 m.adminFrom.mockReturnValue(query({id:C,proof_hash:'0'.repeat(64),prior_proof_hash:null,expires_at:new Date(Date.now()+60_000).toISOString(),used_at:null}))
 expect((await POST(request({action:'complete',challengeId:C,proof:'A'.repeat(43)+'='}))).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled()
})
it('refuses account-only reenrollment after revocation',async()=>{
 m.adminFrom.mockReturnValue(query({revision:2,active_version:null}))
 expect((await POST(request({action:'challenge',deviceId:D,expectedRevision:2,publicSpki:spki}))).status).toBe(409)
})
it('revocation uses only the authenticated actor and expected revision',async()=>{
 expect((await POST(request({action:'revoke',expectedRevision:1}))).status).toBe(200)
 expect(m.rpc).toHaveBeenCalledWith('kc_revoke_recipient_key',{p_actor:A,p_expected_revision:1})
})
it('rejects oversized enrollment data without mutation',async()=>{
 expect((await POST(request({action:'challenge',deviceId:D,expectedRevision:0,publicSpki:'a'.repeat(9000)}))).status).toBe(413);expect(m.admin).not.toHaveBeenCalled()
})
it('returns only a fresh verified public key without an admin lookup',async()=>{
 m.from.mockReturnValueOnce(query({id:A})).mockReturnValueOnce(query({revision:1,active_version:1})).mockReturnValueOnce(query({version:1,device_id:D,public_spki:spki,fingerprint:keyId,revoked_at:null})).mockReturnValueOnce(query({revision:1,active_version:1}))
 const response=await GET(new Request('https://preview.invalid/api/messages/recipient-keys'))
 expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect((await response.json()).keyId).toBe(keyId);expect(m.admin).not.toHaveBeenCalled()
})
it('rejects a key changed during retrieval instead of returning stale material',async()=>{
 m.from.mockReturnValueOnce(query({id:A})).mockReturnValueOnce(query({revision:1,active_version:1})).mockReturnValueOnce(query({version:1,device_id:D,public_spki:spki,fingerprint:keyId,revoked_at:null})).mockReturnValueOnce(query({revision:2,active_version:2}))
 expect((await GET(new Request('https://preview.invalid/api/messages/recipient-keys'))).status).toBe(409)
})
it('respects member directory visibility for another Citizen',async()=>{
 m.directory.mockReturnValue(query(null))
 expect((await GET(new Request(`https://preview.invalid/api/messages/recipient-keys?citizenId=${B}`))).status).toBe(404)
})
it('does not expose enrollment database errors',async()=>{
 m.adminFrom.mockReturnValue(query(null,{message:'private schema SQL failure'}))
 const response=await POST(request({action:'challenge',deviceId:D,expectedRevision:0,publicSpki:spki}));expect(response.status).toBe(503);expect(await response.text()).not.toContain('SQL')
})
it('rejects unexpected prior-proof payloads for initial enrollment',async()=>{
 const proof=bytesToBase64(crypto.getRandomValues(new Uint8Array(32)))
 m.adminFrom.mockReturnValue(query({id:C,proof_hash:await proofDigest(proof),prior_proof_hash:null,expires_at:new Date(Date.now()+60_000).toISOString(),used_at:null}))
 expect((await POST(request({action:'complete',challengeId:C,proof,priorProof:{privateKey:'must-not-be-forwarded'}}))).status).toBe(403)
 expect(m.rpc).not.toHaveBeenCalled()
})

it.each(['https://attacker.invalid','https://sibling.preview.invalid','null'])('rejects an untrusted Origin %s before authentication',async origin=>{
 const req=request({action:'revoke',expectedRevision:1});req.headers.set('Origin',origin)
 expect((await POST(req)).status).toBe(403);expect(m.getUser).not.toHaveBeenCalled();expect(m.admin).not.toHaveBeenCalled()
})
it.each(['cross-site','same-site'])('rejects browser fetch metadata %s even with a matching origin',async site=>{
 const req=request({action:'revoke',expectedRevision:1});req.headers.set('Origin','https://preview.invalid');req.headers.set('Sec-Fetch-Site',site)
 expect((await POST(req)).status).toBe(403);expect(m.admin).not.toHaveBeenCalled()
})
it.each(['text/plain','application/x-www-form-urlencoded','multipart/form-data'])('rejects simple-request content type %s',async contentType=>{
 const req=request({action:'revoke',expectedRevision:1});req.headers.set('Content-Type',contentType)
 expect((await POST(req)).status).toBe(415);expect(m.getUser).not.toHaveBeenCalled();expect(m.admin).not.toHaveBeenCalled()
})
it('rejects a missing content type',async()=>{
 const req=request({action:'revoke',expectedRevision:1});req.headers.delete('Content-Type')
 expect((await POST(req)).status).toBe(415);expect(m.admin).not.toHaveBeenCalled()
})
it('accepts same-origin JSON with charset and retains authenticated actor ownership',async()=>{
 const req=request({action:'revoke',expectedRevision:1});req.headers.set('Origin','https://preview.invalid');req.headers.set('Sec-Fetch-Site','same-origin');req.headers.set('Content-Type','application/json; charset=utf-8')
 expect((await POST(req)).status).toBe(200);expect(m.rpc).toHaveBeenCalledWith('kc_revoke_recipient_key',{p_actor:A,p_expected_revision:1})
})

it('rejects account switching between validation and mutation',async()=>{
 const req=request({action:'revoke',expectedRevision:1});req.headers.set('X-KC-Citizen',B)
 expect((await POST(req)).status).toBe(403);expect(m.admin).not.toHaveBeenCalled()
})
it('cancels only an owned, unused challenge and filters both terminal states',async()=>{
 const q=query({id:C});m.adminFrom.mockReturnValue(q)
 expect((await POST(request({action:'cancel',challengeId:C}))).status).toBe(200)
 expect(q.eq).toHaveBeenCalledWith('citizen_id',A);expect(q.eq).toHaveBeenCalledWith('id',C)
 expect(q.is).toHaveBeenCalledWith('used_at',null);expect(q.is).toHaveBeenCalledWith('cancelled_at',null)
})
it('returns a safe conflict for unavailable or terminal cancellation',async()=>{
 m.adminFrom.mockReturnValue(query(null));expect((await POST(request({action:'cancel',challengeId:C}))).status).toBe(409)
})
it('rejects completion of cancelled challenges before checking possession or mutation',async()=>{
 m.adminFrom.mockReturnValue(query({id:C,cancelled_at:new Date().toISOString(),expires_at:new Date(Date.now()+60_000).toISOString()}))
 expect((await POST(request({action:'complete',challengeId:C,proof:'unused'}))).status).toBe(409);expect(m.rpc).not.toHaveBeenCalled()
})

it('rejects uppercase Production host aliases before privileged access',async()=>{
 vi.stubEnv('KC_ISOLATED_TEST_PROJECT_REF','JNGBHEJFQBYJLETFKNKH');vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://JNGBHEJFQBYJLETFKNKH.supabase.co')
 expect((await POST(request({action:'revoke',expectedRevision:1}))).status).toBe(503);expect(m.admin).not.toHaveBeenCalled()
})
