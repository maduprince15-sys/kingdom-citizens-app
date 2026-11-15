import { beforeAll, expect, it } from 'vitest'
import { approveTrustedDevicePairing } from '../lib/e2ee/device-pairing'
import { createEnrollmentChallenge, answerNewKeyChallenge, proofDigest } from '../lib/e2ee/enrollment'
import { generateRecipientIdentity, publicKeyFingerprint } from '../lib/e2ee/recipient-envelope'
import { bytesToBase64 } from '../lib/e2ee/crypto'
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',D='dddddddd-dddd-4ddd-dddd-dddddddddddd',N='eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee'
let trusted:CryptoKeyPair,next:CryptoKeyPair
beforeAll(async()=>{trusted=await generateRecipientIdentity();next=await generateRecipientIdentity()},30_000)
async function fixture(){
 const keyId=await publicKeyFingerprint(trusted.publicKey),newKeyId=await publicKeyFingerprint(next.publicKey)
 const created=await createEnrollmentChallenge({challengeId:B,citizenId:A,deviceId:N,keyId:newKeyId,expectedRevision:1,expiresAt:new Date(Date.now()+60_000).toISOString()},next.publicKey,trusted.publicKey)
 return {created,input:{authenticatedCitizenId:A,trustedIdentity:trusted,active:{citizenId:A,deviceId:D,state:'active',revision:1,version:1,keyId,publicSpki:bytesToBase64(new Uint8Array(await crypto.subtle.exportKey('spki',trusted.publicKey))),revokedAt:null as string|null},trustedDeviceId:D,pinnedCurrentKeyId:keyId,verifiedNewKeyId:newKeyId,challenge:created.challenge}}
}
it('pairs separate device proofs with a verified current identity and explicit new fingerprint',async()=>{
 const {created,input}=await fixture()
 const approval=await approveTrustedDevicePairing(input),newProof=await answerNewKeyChallenge(input.challenge,A,next)
 expect(await proofDigest(approval.priorProof)).toBe(created.priorProofHash)
 expect(await proofDigest(newProof.proof)).toBe(created.proofHash)
 expect(trusted.privateKey.extractable).toBe(false);expect(next.privateKey.extractable).toBe(false)
})
it.each(['other-citizen','revoked','stale','wrong-device','same-device','substituted-pin','unverified-new-key','wrong-trusted-key','expired'])('rejects %s pairing',async mode=>{
 const {input}=await fixture()
 if(mode==='other-citizen')input.authenticatedCitizenId=B
 if(mode==='revoked'){input.active.state='revoked';input.active.revokedAt=new Date().toISOString()}
 if(mode==='stale')input.challenge.context.expectedRevision=2
 if(mode==='wrong-device')input.trustedDeviceId=N
 if(mode==='same-device')input.challenge.context.deviceId=D
 if(mode==='substituted-pin')input.pinnedCurrentKeyId=input.verifiedNewKeyId
 if(mode==='unverified-new-key')input.verifiedNewKeyId=''
 if(mode==='wrong-trusted-key')input.trustedIdentity=next
 if(mode==='expired')input.challenge.context.expiresAt=new Date(Date.now()-1).toISOString()
 await expect(approveTrustedDevicePairing(input)).rejects.toThrow()
})
