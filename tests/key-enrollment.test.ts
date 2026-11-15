import { beforeAll, expect, it } from 'vitest'
import { bytesToBase64 } from '../lib/e2ee/crypto'
import { generateRecipientIdentity, publicKeyFingerprint } from '../lib/e2ee/recipient-envelope'
import { answerEnrollmentChallenge, answerNewKeyChallenge, approveKeyRotation, createEnrollmentChallenge, importEnrollmentPublicKey, keyRecoveryState, proofDigest, verifyActiveRecipient, type EnrollmentContext } from '../lib/e2ee/enrollment'
const A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', D = 'dddddddd-dddd-4ddd-dddd-dddddddddddd'
let current: CryptoKeyPair, next: CryptoKeyPair, outsider: CryptoKeyPair
let context: EnrollmentContext
async function spki(identity: CryptoKeyPair) { return bytesToBase64(new Uint8Array(await crypto.subtle.exportKey('spki', identity.publicKey))) }
beforeAll(async () => {
  ;[current,next,outsider] = await Promise.all([generateRecipientIdentity(), generateRecipientIdentity(), generateRecipientIdentity()])
  context = { challengeId: crypto.randomUUID(), citizenId: A, deviceId: D, expectedRevision: 0, keyId: await publicKeyFingerprint(current.publicKey), expiresAt: new Date(Date.now()+60_000).toISOString() }
}, 30_000)
it('validates a public SPKI and derives its fingerprint instead of trusting a claimed ID', async () => {
  expect((await importEnrollmentPublicKey(await spki(current))).keyId).toBe(context.keyId)
  await expect(importEnrollmentPublicKey('-----BEGIN PRIVATE KEY-----')).rejects.toThrow()
})
it('proves possession without transmitting the private key or storing the nonce plaintext', async () => {
  const created = await createEnrollmentChallenge(context,current.publicKey)
  const answer = await answerEnrollmentChallenge(created.challenge,A,current)
  expect(await proofDigest(answer.proof)).toBe(created.proofHash)
  expect(JSON.stringify(created)).not.toContain(answer.proof)
  expect(current.privateKey.extractable).toBe(false)
})
it('rejects identity substitution for another Citizen', async () => {
  const created = await createEnrollmentChallenge(context,current.publicKey)
  await expect(answerEnrollmentChallenge(created.challenge,B,current)).rejects.toThrow()
})
it('cannot prove possession of another public key with the wrong private key', async () => {
  const created = await createEnrollmentChallenge(context,current.publicKey)
  await expect(answerEnrollmentChallenge(created.challenge,A,{ publicKey: current.publicKey, privateKey: outsider.privateKey })).rejects.toThrow()
})
it('binds proof to device, Citizen, fingerprint, revision and expiration', async () => {
  const created = await createEnrollmentChallenge(context,current.publicKey)
  await expect(answerEnrollmentChallenge({ ...created.challenge, context: { ...context, deviceId: B } },A,current)).rejects.toThrow()
})
it('rejects expired proof challenges', async () => {
  const created = await createEnrollmentChallenge(context,current.publicKey)
  await expect(answerEnrollmentChallenge({ ...created.challenge, context: { ...context, expiresAt: new Date(Date.now()-1000).toISOString() } },A,current)).rejects.toThrow()
})
it('requires both current and new private-key possession for rotation', async () => {
  const rotationContext = { ...context, keyId: await publicKeyFingerprint(next.publicKey), expectedRevision: 1 }
  const created = await createEnrollmentChallenge(rotationContext,next.publicKey,current.publicKey)
  const answer = await answerEnrollmentChallenge(created.challenge,A,next,current)
  expect(await proofDigest(answer.proof)).toBe(created.proofHash)
  expect(await proofDigest(answer.priorProof!)).toBe(created.priorProofHash)
  await expect(answerEnrollmentChallenge(created.challenge,A,next)).rejects.toThrow('trusted device')
  await expect(answerEnrollmentChallenge(created.challenge,A,next,outsider)).rejects.toThrow()
})
it('never treats account login as recovery of a missing private key', () => {
  expect(keyRecoveryState({ authenticated: true, revision: 1, activeKeyId: 'existing', localKeyId: null })).toBe('trusted-device-or-user-held-recovery-required')
  expect(keyRecoveryState({ authenticated: false, revision: 1, activeKeyId: 'existing', localKeyId: 'existing' })).toBe('reauthentication-required')
})
it('distinguishes first enrollment, usable device and revoked/lost state', () => {
  expect(keyRecoveryState({ authenticated: true, revision: 0, activeKeyId: null, localKeyId: null })).toBe('initial-enrollment-required')
  expect(keyRecoveryState({ authenticated: true, revision: 1, activeKeyId: 'existing', localKeyId: 'existing' })).toBe('current-device-available')
  expect(keyRecoveryState({ authenticated: true, revision: 2, activeKeyId: null, localKeyId: 'old' })).toBe('revoked-recovery-approval-required')
})
it('verifies the expected Citizen, current revision and pinned fingerprint before encryption', async () => {
  const record = { citizenId: A, state: 'active', revision: 1, version: 1, keyId: context.keyId, publicSpki: await spki(current), revokedAt: null }
  expect((await verifyActiveRecipient(record,A,context.keyId,1)).type).toBe('public')
  await expect(verifyActiveRecipient(record,B,context.keyId,1)).rejects.toThrow()
  await expect(verifyActiveRecipient(record,A,context.keyId,2)).rejects.toThrow()
  await expect(verifyActiveRecipient({ ...record, state: 'revoked', revokedAt: new Date().toISOString() },A,context.keyId,1)).rejects.toThrow()
  await expect(verifyActiveRecipient({ ...record, publicSpki: await spki(outsider) },A,context.keyId,1)).rejects.toThrow()
  await expect(verifyActiveRecipient(record,A,await publicKeyFingerprint(next.publicKey),1)).rejects.toThrow()
})
it('fails closed for inconsistent recovery metadata',()=>{
  expect(keyRecoveryState({authenticated:true,revision:0,activeKeyId:'unexpected',localKeyId:'unexpected'})).toBe('key-state-unavailable')
})
it('rejects malformed previous-key fields on an initial challenge',async()=>{
  const created=await createEnrollmentChallenge(context,current.publicKey)
  await expect(answerEnrollmentChallenge({...created.challenge,priorKeyId:'untrusted',priorWrappedProof:'x'},A,current)).rejects.toThrow('shape')
})
it('rejects oversized wrapped possession data before decrypting',async()=>{
  const created=await createEnrollmentChallenge(context,current.publicKey)
  await expect(answerEnrollmentChallenge({...created.challenge,wrappedProof:'a'.repeat(2000)},A,current)).rejects.toThrow('shape')
})
it('does not accept an invalid freshness floor',async()=>{
  const record={citizenId:A,state:'active',revision:1,version:1,keyId:context.keyId,publicSpki:await spki(current),revokedAt:null}
  await expect(verifyActiveRecipient(record,A,context.keyId,NaN)).rejects.toThrow()
})

it('supports paired-device rotation without transferring either private key',async()=>{
  const newKeyId=await publicKeyFingerprint(next.publicKey)
  const created=await createEnrollmentChallenge({...context,keyId:newKeyId,expectedRevision:1},next.publicKey,current.publicKey)
  const newDevice=await answerNewKeyChallenge(created.challenge,A,next)
  const oldDevice=await approveKeyRotation(created.challenge,A,current,newKeyId)
  expect(await proofDigest(newDevice.proof)).toBe(created.proofHash)
  expect(await proofDigest(oldDevice.priorProof)).toBe(created.priorProofHash)
  await expect(approveKeyRotation(created.challenge,A,current,await publicKeyFingerprint(outsider.publicKey))).rejects.toThrow()
})
