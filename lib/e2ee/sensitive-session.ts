import { createAdminClient } from '../supabase/admin'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
export class SensitiveSessionError extends Error {
  constructor(public status:number){super('Sensitive session authorization required.')}
}
// Accept only claims verified by Supabase getClaims(), never decoded getSession
// data or user_metadata. Refreshing a token does not refresh the MFA timestamp.
export function sensitiveSessionClaims(value:unknown,citizenId:string,issuer:string,now=Math.floor(Date.now()/1000)){
  if(!value || typeof value!=='object')throw new SensitiveSessionError(401)
  const c=value as Record<string,unknown>
  if(c.sub!==citizenId || !uuid.test(citizenId) || c.role!=='authenticated' || c.iss!==issuer ||
     !(c.aud==='authenticated' || Array.isArray(c.aud)&&c.aud.includes('authenticated')) ||
     typeof c.session_id!=='string' || !uuid.test(c.session_id) || !Number.isInteger(c.exp) || (c.exp as number)<=now ||
     !Number.isInteger(c.iat) || (c.iat as number)>now+30)throw new SensitiveSessionError(401)
  const methods=Array.isArray(c.amr)?c.amr:[]
  const recent=methods.filter((entry:unknown)=>entry && typeof entry==='object').map(entry=>entry as Record<string,unknown>)
    .filter(entry=>(entry.method==='totp'||entry.method==='mfa/totp') && Number.isInteger(entry.timestamp) && (entry.timestamp as number)>=now-300 && (entry.timestamp as number)<=now+30)
  if(c.aal!=='aal2' || !recent.length)throw new SensitiveSessionError(428)
  return {sessionId:c.session_id,stepUpAt:Math.max(...recent.map(entry=>entry.timestamp as number)),tokenExpiresAt:c.exp as number}
}
export type SensitiveSession=ReturnType<typeof sensitiveSessionClaims>
export function sensitiveOperationArgs(citizenId:string,session:SensitiveSession,action:string,payload:Record<string,unknown>={}){
  return {p_actor:citizenId,p_session:session.sessionId,p_step_up_at:session.stepUpAt,p_token_expires_at:session.tokenExpiresAt,p_action:action,p_payload:payload}
}
export async function requireSensitiveSession(client:{auth:{getClaims:()=>Promise<{data:{claims:unknown}|null;error:unknown}>}},citizenId:string){
  const {data,error}=await client.auth.getClaims()
  if(error || !data)throw new SensitiveSessionError(401)
  const session=sensitiveSessionClaims(data.claims,citizenId,`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`)
  const result=await createAdminClient().rpc('kc_sensitive_key_operation',sensitiveOperationArgs(citizenId,session,'check'))
  if(result.error || result.data!==true)throw new SensitiveSessionError(401)
  return session
}
