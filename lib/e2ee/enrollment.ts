import { base64ToBytes, bytesToBase64 } from './crypto'
import { publicKeyFingerprint } from './recipient-envelope'

export type EnrollmentContext = {
  challengeId: string; citizenId: string; deviceId: string; keyId: string; expectedRevision: number; expiresAt: string
}
export type EnrollmentChallenge = { context: EnrollmentContext; wrappedProof: string; priorKeyId: string | null; priorWrappedProof: string | null }
const encoder = new TextEncoder()
const canonicalId = (id: unknown): id is string => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)
export async function proofDigest(proof: string) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(proof)))].map(byte => byte.toString(16).padStart(2, '0')).join('')
}
export async function importEnrollmentPublicKey(spki: unknown) {
  if (typeof spki !== 'string' || spki.length > 2048 || !/^[A-Za-z0-9+/]+={0,2}$/.test(spki)) throw new Error('Invalid public key.')
  const key = await crypto.subtle.importKey('spki', base64ToBytes(spki), { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt', 'wrapKey'])
  const keyId = await publicKeyFingerprint(key)
  return { key, keyId, spki: bytesToBase64(new Uint8Array(await crypto.subtle.exportKey('spki', key))) }
}
function label(context: EnrollmentContext, kind: 'new' | 'prior', priorKeyId: string | null) {
  return encoder.encode(JSON.stringify(['kingdom-citizen-key-enrollment-v1', context.challengeId, context.citizenId, context.deviceId, context.keyId, context.expectedRevision, context.expiresAt, kind, priorKeyId]))
}
export async function createEnrollmentChallenge(context: EnrollmentContext, publicKey: CryptoKey, priorPublicKey?: CryptoKey) {
  if (await publicKeyFingerprint(publicKey) !== context.keyId) throw new Error('Public key fingerprint mismatch.')
  const priorKeyId = priorPublicKey ? await publicKeyFingerprint(priorPublicKey) : null
  if (priorKeyId === context.keyId) throw new Error('Rotation requires a new key.')
  async function wrap(key: CryptoKey, kind: 'new' | 'prior') {
    const nonce = crypto.getRandomValues(new Uint8Array(32))
    const wrapped = await crypto.subtle.encrypt({ name: 'RSA-OAEP', label: label(context, kind, priorKeyId) }, key, nonce)
    const hash = await proofDigest(bytesToBase64(nonce))
    nonce.fill(0)
    return { wrapped: bytesToBase64(new Uint8Array(wrapped)), hash }
  }
  const next = await wrap(publicKey, 'new')
  const prior = priorPublicKey ? await wrap(priorPublicKey, 'prior') : null
  return {
    challenge: { context, wrappedProof: next.wrapped, priorKeyId, priorWrappedProof: prior?.wrapped || null } satisfies EnrollmentChallenge,
    proofHash: next.hash, priorProofHash: prior?.hash || null,
  }
}
function validateChallenge(challenge: EnrollmentChallenge, authenticatedCitizenId: string) {
  const { context } = challenge
  const proofShape = (value: unknown) => typeof value === 'string' && value.length <= 1400 && /^[A-Za-z0-9+/]+={0,2}$/.test(value)
  if (!proofShape(challenge.wrappedProof) || (context?.expectedRevision === 0 && (challenge.priorKeyId !== null || challenge.priorWrappedProof !== null)) ||
      (context?.expectedRevision > 0 && (typeof challenge.priorKeyId !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(challenge.priorKeyId) || !proofShape(challenge.priorWrappedProof)))) throw new Error('Invalid enrollment challenge shape.')
  if (!context || !canonicalId(context.challengeId) || !canonicalId(context.deviceId) || !canonicalId(context.citizenId) || context.citizenId !== authenticatedCitizenId ||
      !Number.isInteger(context.expectedRevision) || context.expectedRevision < 0 || context.expectedRevision > 2_000_000_000 ||
      !Number.isFinite(Date.parse(context.expiresAt)) || Date.parse(context.expiresAt) <= Date.now() || Date.parse(context.expiresAt) > Date.now() + 5 * 60_000) throw new Error('Invalid enrollment identity or challenge.')
  return context
}
async function decryptPossessionProof(challenge: EnrollmentChallenge, privateKey: CryptoKey, kind: 'new' | 'prior') {
  if (privateKey.extractable) throw new Error('Private identity keys must remain non-extractable.')
  const wrapped = kind === 'new' ? challenge.wrappedProof : challenge.priorWrappedProof!
  const nonce = new Uint8Array(await crypto.subtle.decrypt({ name: 'RSA-OAEP', label: label(challenge.context, kind, challenge.priorKeyId) }, privateKey, base64ToBytes(wrapped)))
  if (nonce.length !== 32) throw new Error('Invalid enrollment proof.')
  const proof = bytesToBase64(nonce)
  nonce.fill(0)
  return proof
}
// Each device answers only its own challenge. Neither private key moves to the
// other device. Session validation and an approved pairing channel remain required.
export async function answerNewKeyChallenge(challenge: EnrollmentChallenge, authenticatedCitizenId: string, newIdentity: CryptoKeyPair) {
  const context = validateChallenge(challenge, authenticatedCitizenId)
  if (await publicKeyFingerprint(newIdentity.publicKey) !== context.keyId) throw new Error('New device key does not match enrollment.')
  return { challengeId: context.challengeId, proof: await decryptPossessionProof(challenge, newIdentity.privateKey, 'new') }
}
export async function approveKeyRotation(challenge: EnrollmentChallenge, authenticatedCitizenId: string, trustedIdentity: CryptoKeyPair, verifiedNewKeyId: string) {
  const context = validateChallenge(challenge, authenticatedCitizenId)
  if (context.expectedRevision === 0 || !challenge.priorKeyId || !challenge.priorWrappedProof || !verifiedNewKeyId ||
      context.keyId !== verifiedNewKeyId || await publicKeyFingerprint(trustedIdentity.publicKey) !== challenge.priorKeyId) throw new Error('A trusted device and verified new fingerprint are required.')
  return { challengeId: context.challengeId, priorProof: await decryptPossessionProof(challenge, trustedIdentity.privateKey, 'prior') }
}
export async function answerEnrollmentChallenge(challenge: EnrollmentChallenge, authenticatedCitizenId: string, identity: CryptoKeyPair, priorIdentity?: CryptoKeyPair) {
  const next = await answerNewKeyChallenge(challenge, authenticatedCitizenId, identity)
  if (challenge.context.expectedRevision === 0) return { ...next, priorProof: null }
  if (!priorIdentity) throw new Error('An existing trusted device must approve rotation.')
  const prior = await approveKeyRotation(challenge, authenticatedCitizenId, priorIdentity, await publicKeyFingerprint(identity.publicKey))
  return { ...next, priorProof: prior.priorProof }
}
export async function verifyActiveRecipient(record: { citizenId: string; state: string; revision: number; version: number; keyId: string; publicSpki: string; revokedAt: string | null }, expectedCitizenId: string, pinnedKeyId: string, minimumRevision: number) {
  if (!canonicalId(expectedCitizenId) || record.citizenId !== expectedCitizenId || record.state !== 'active' || record.revokedAt !== null ||
      !Number.isInteger(minimumRevision) || minimumRevision < 0 || !Number.isInteger(record.revision) || !Number.isInteger(record.version) || record.version < 1 || record.revision < minimumRevision || record.revision !== record.version ||
      !pinnedKeyId || record.keyId !== pinnedKeyId) throw new Error('Recipient identity changed, is stale or is revoked.')
  const imported = await importEnrollmentPublicKey(record.publicSpki)
  if (imported.keyId !== record.keyId) throw new Error('Recipient public key was substituted.')
  return imported.key
}
export function keyRecoveryState(input: { authenticated: boolean; revision: number; activeKeyId: string | null; localKeyId: string | null }) {
  if (!input.authenticated) return 'reauthentication-required' as const
  if (!Number.isInteger(input.revision) || input.revision < 0 || (input.revision === 0 && input.activeKeyId)) return 'key-state-unavailable' as const
  if (input.revision === 0 && !input.activeKeyId) return 'initial-enrollment-required' as const
  if (!input.activeKeyId) return 'revoked-recovery-approval-required' as const
  if (input.activeKeyId !== input.localKeyId) return 'trusted-device-or-user-held-recovery-required' as const
  return 'current-device-available' as const
}
