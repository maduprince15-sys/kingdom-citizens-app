import {beforeEach,expect,it,vi} from 'vitest'
const m=vi.hoisted(()=>({rpc:vi.fn()}))
vi.mock('../lib/supabase/admin',()=>({createAdminClient:()=>m}))
import {sensitiveSessionClaims,requireSensitiveSession} from '../lib/e2ee/sensitive-session'
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',S='ssssssss-ssss-4sss-ssss-ssssssssssss'.replaceAll('s','1'),now=2000000000,issuer='https://synthetic-test.supabase.co/auth/v1'
const claims=()=>({sub:A,role:'authenticated',iss:issuer,aud:'authenticated',session_id:S,iat:now-10,exp:now+600,aal:'aal2',amr:[{method:'totp',timestamp:now-10}]})
beforeEach(()=>{m.rpc.mockReset().mockResolvedValue({data:true,error:null})})
it('accepts verified recent TOTP claims without trusting token refresh as step-up',()=>{expect(sensitiveSessionClaims(claims(),A,issuer,now).sessionId).toBe(S)})
it.each(['sub','role','iss','aud','session_id','exp','iat','aal','amr'])('rejects invalid claim %s',field=>{
 expect(()=>sensitiveSessionClaims({...claims(),[field]:'invalid'},A,issuer,now)).toThrow()
})
it.each(['password','oauth','webauthn','anonymous'])('never treats %s as supported MFA unlock',method=>{
 expect(()=>sensitiveSessionClaims({...claims(),amr:[{method,timestamp:now}]},A,issuer,now)).toThrow()
})
it('rejects stale MFA even with a newly refreshed access token',()=>{
 expect(()=>sensitiveSessionClaims({...claims(),iat:now,amr:[{method:'totp',timestamp:now-301}]},A,issuer,now)).toThrow()
})
it('rejects future MFA and expired tokens',()=>{
 expect(()=>sensitiveSessionClaims({...claims(),amr:[{method:'totp',timestamp:now+31}]},A,issuer,now)).toThrow()
 expect(()=>sensitiveSessionClaims({...claims(),exp:now},A,issuer,now)).toThrow()
})
it('requires the session existence check after verified claims',async()=>{
 const time=Math.floor(Date.now()/1000);const c={...claims(),iat:time,exp:time+600,amr:[{method:'totp',timestamp:time}]}
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://synthetic-test.supabase.co')
 try{await requireSensitiveSession({auth:{getClaims:async()=>({data:{claims:c},error:null})}},A);expect(m.rpc).toHaveBeenCalledWith('kc_sensitive_key_operation',expect.objectContaining({p_actor:A,p_session:S,p_action:'check'}))}finally{vi.unstubAllEnvs()}
})
it.each([false,null])('rejects missing or revoked server sessions %s',async data=>{
 const time=Math.floor(Date.now()/1000);m.rpc.mockResolvedValue({data,error:null});vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://synthetic-test.supabase.co')
 try{await expect(requireSensitiveSession({auth:{getClaims:async()=>({data:{claims:{...claims(),iat:time,exp:time+60,amr:[{method:'totp',timestamp:time}]}},error:null})}},A)).rejects.toThrow()}finally{vi.unstubAllEnvs()}
})
