'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { createIdentityVault, type ActiveIdentityRecord } from '../../../lib/e2ee/identity-vault'
import { createSessionKeyAccess } from '../../../lib/e2ee/session-access'
import { generateRecipientIdentity, publicKeyFingerprint } from '../../../lib/e2ee/recipient-envelope'
import { answerNewKeyChallenge, type EnrollmentChallenge } from '../../../lib/e2ee/enrollment'
import { approveTrustedDevicePairing } from '../../../lib/e2ee/device-pairing'
import { bytesToBase64 } from '../../../lib/e2ee/crypto'

type Registry = ActiveIdentityRecord | { citizenId: string; state: 'unenrolled' | 'revoked'; revision: number }
type Pending = { challenge: EnrollmentChallenge; proof: string }
export default function DevicePairingPanel({ citizenId }: { citizenId: string }) {
  const [registry,setRegistry]=useState<Registry|null>(null),[pending,setPending]=useState<Pending|null>(null)
  const [incoming,setIncoming]=useState(''),[fingerprint,setFingerprint]=useState(''),[approval,setApproval]=useState(''),[received,setReceived]=useState('')
  const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('Refresh to check device authorization.')
  const epoch=useRef(0)
  const access=useRef<ReturnType<typeof createSessionKeyAccess>|null>(null)
  const citizen = useCallback(async () => {
    const {data:{user},error}=await createClient().auth.getUser()
    return !error && user && !user.is_anonymous && user.email_confirmed_at ? user.id : null
  }, [])
  const request = useCallback(async function request<T=Registry>(input?:Record<string,unknown>):Promise<T> {
    const generation=epoch.current
    if(await citizen()!==citizenId || generation!==epoch.current)throw new Error('Reauthenticate to manage devices.')
    const response=await fetch('/api/messages/recipient-keys',{cache:'no-store',credentials:'same-origin',...(input?{method:'POST',headers:{'Content-Type':'application/json','X-KC-Citizen':citizenId},body:JSON.stringify(input)}:{})})
    if(!response.ok)throw new Error('Device request failed. Refresh or reauthenticate before trying again.')
    const data=await response.json()
    if(await citizen()!==citizenId || generation!==epoch.current)throw new Error('Session changed. Start again.')
    return data
  }, [citizen,citizenId])
  useEffect(()=>{
    const controller=createSessionKeyAccess({citizenId,getCitizen:citizen,getActive:async()=>await request() as ActiveIdentityRecord,vault:createIdentityVault(indexedDB)})
    access.current=controller
    const lock=()=>{epoch.current++;controller.invalidate()}
    const invalidate=()=>{lock();setRegistry(null);setPending(null);setApproval('');setReceived('');setIncoming('');setFingerprint('');setConfirmed(false);setStatus('Session changed. Refresh device authorization.')}
    const {data:{subscription}}=createClient().auth.onAuthStateChange(invalidate)
    window.addEventListener('kingdom:keys-lock',invalidate)
    return ()=>{lock();controller.dispose();subscription.unsubscribe();window.removeEventListener('kingdom:keys-lock',invalidate);access.current=null}
  },[citizenId,citizen,request])
  async function run(operation:()=>Promise<void>){setBusy(true);setStatus('Working…');try{await operation()}catch{setStatus('Unable to complete the request. Refresh or sign in again; retained keys were not replaced.')}finally{setBusy(false)}}
  async function refresh(){const result=await request();if(result.citizenId!==citizenId)throw new Error();setRegistry(result);setStatus('Device authorization refreshed.')}
  async function start(){
    const generation=epoch.current
    const current=await request();if(current.citizenId!==citizenId || current.state==='revoked')throw new Error()
    const deviceId=crypto.randomUUID(),identity=await generateRecipientIdentity(),keyId=await publicKeyFingerprint(identity.publicKey)
    if(await citizen()!==citizenId)throw new Error()
    await createIdentityVault(indexedDB).stage(citizenId,deviceId,identity)
    const challenge=await request<EnrollmentChallenge>({action:'challenge',deviceId,expectedRevision:current.revision,publicSpki:bytesToBase64(new Uint8Array(await crypto.subtle.exportKey('spki',identity.publicKey)))})
    if(!challenge || challenge.context.citizenId!==citizenId || challenge.context.deviceId!==deviceId || challenge.context.keyId!==keyId)throw new Error()
    const answer=await answerNewKeyChallenge(challenge,citizenId,identity)
    if(await citizen()!==citizenId || generation!==epoch.current)throw new Error()
    setPending({challenge,proof:answer.proof});setStatus('Request created. Compare the fingerprint on your trusted device before approving.')
  }
  async function complete(){
    if(!pending)throw new Error()
    await request({action:'complete',challengeId:pending.challenge.context.challengeId,proof:pending.proof,priorProof:pending.challenge.priorKeyId?received.trim():null})
    setPending(null);setReceived('');await refresh()
  }
  async function approve(){
    if(!confirmed || incoming.length>8192 || registry?.state!=='active')throw new Error()
    const challenge=JSON.parse(incoming) as EnrollmentChallenge
    const result=await access.current!.use(registry.keyId,(identity,active)=>approveTrustedDevicePairing({authenticatedCitizenId:citizenId,trustedIdentity:identity,active,trustedDeviceId:active.deviceId,pinnedCurrentKeyId:registry.keyId,verifiedNewKeyId:fingerprint.trim(),challenge}))
    setApproval(result.priorProof);setStatus('Approved this request. Transfer the one-time approval only to your new device.')
  }
  const button='rounded border border-yellow-700 px-3 py-2 disabled:opacity-50'
  return <section className="space-y-4 rounded-xl border border-yellow-900 bg-black/40 p-5">
    <p>This isolated test workflow replaces the current device. Only one device can be active. Messaging remains unavailable.</p>
    <p>Keys remain on this browser after logout, separated by Citizen account. Reauthentication and current device authorization are required to use them. Clearing browser data can permanently lose encrypted history.</p>
    <p role="status">{status}</p><button className={button} disabled={busy} onClick={()=>run(refresh)}>Refresh devices</button>
    {registry && <div><p>Status: {registry.state} · revision {registry.revision}</p>{registry.state==='active' && <><p className="break-all">Device: {registry.deviceId}<br/>Fingerprint: {registry.keyId}</p><button className={button} disabled={busy} onClick={()=>run(async()=>{if(!window.confirm('Revoke this device? New enrollment will require recovery approval. Existing history still requires retained keys.'))return;await request({action:'revoke',expectedRevision:registry.revision});access.current?.invalidate();await refresh()})}>Revoke device</button><button className={button} disabled={busy} onClick={()=>run(async()=>{if(await citizen()!==citizenId || !window.confirm('Forget this browser key? Encrypted history may become permanently unreadable. This does not revoke the device on the server.'))return;access.current?.invalidate();await createIdentityVault(indexedDB).forget(citizenId,registry.deviceId);setStatus('Local key forgotten. Server device authorization is unchanged.')})}>Forget local key</button></>}</div>}
    <button className={button} disabled={busy || !!pending} onClick={()=>run(start)}>Start enrollment on this device</button>
    {pending && <div className="space-y-3"><p>Expires: {pending.challenge.context.expiresAt}</p><p className="break-all">New fingerprint: {pending.challenge.context.keyId}</p><label className="block">Pairing request for your trusted device<textarea className="block w-full bg-black p-2" readOnly value={JSON.stringify(pending.challenge)} /></label>{pending.challenge.priorKeyId && <label className="block">One-time approval from trusted device<input className="block w-full bg-black p-2" value={received} onChange={e=>setReceived(e.target.value)} /></label>}<button className={button} disabled={busy} onClick={()=>run(complete)}>Complete enrollment</button><button className={button} disabled={busy} onClick={()=>run(async()=>{await request({action:'cancel',challengeId:pending.challenge.context.challengeId});await createIdentityVault(indexedDB).forget(citizenId,pending.challenge.context.deviceId);setPending(null);setReceived('');setStatus('Pairing request cancelled on the server.')})}>Cancel request</button></div>}
    <fieldset className="space-y-3"><legend>Approve a replacement device</legend><label className="block">Pairing request<textarea className="block w-full bg-black p-2" maxLength={8192} value={incoming} onChange={e=>{setIncoming(e.target.value);setConfirmed(false);setApproval('')}} /></label><label className="block">Fingerprint independently compared with your new device<input className="block w-full bg-black p-2" value={fingerprint} onChange={e=>{setFingerprint(e.target.value);setConfirmed(false);setApproval('')}} /></label><label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} /> I compared the fingerprint and approve replacing this trusted device.</label><button className={button} disabled={busy || !confirmed} onClick={()=>run(approve)}>Approve request</button><button className={button} disabled={busy || !incoming} onClick={()=>run(async()=>{if(incoming.length>8192)throw new Error();const challenge=JSON.parse(incoming) as EnrollmentChallenge;if(challenge.context.citizenId!==citizenId)throw new Error();await request({action:'cancel',challengeId:challenge.context.challengeId});setIncoming('');setFingerprint('');setConfirmed(false);setApproval('');setStatus('Pairing request rejected on the server.')})}>Reject request</button>{approval && <label className="block">One-time approval for your new device<input className="block w-full bg-black p-2" readOnly value={approval} /></label>}</fieldset>
  </section>
}
