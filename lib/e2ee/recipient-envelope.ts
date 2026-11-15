// Candidate hybrid envelope. Not enabled until authenticated key enrollment,
// persistence, revocation and recovery have been verified against isolated RLS.
import { base64ToBytes, bytesToBase64 } from './crypto'

const ids = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const encoder = new TextEncoder()
export type MessageContext = { conversationId: string; senderId: string; recipientIds: string[] }
export type RecipientEnvelope = {
  version: 2
  context: MessageContext
  iv: string
  ciphertext: string
  recipients: { citizenId: string; keyId: string; wrappedKey: string }[]
}
export async function generateRecipientIdentity() {
  return crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'])
}
export async function publicKeyFingerprint(key: CryptoKey) {
  const algorithm = key.algorithm as RsaHashedKeyAlgorithm
  if (key.type !== 'public' || algorithm.name !== 'RSA-OAEP' || algorithm.hash?.name !== 'SHA-256' || (algorithm.modulusLength < 3072 || algorithm.modulusLength > 8192) || !key.usages.includes('wrapKey')) throw new Error('Unsupported recipient key.')
  const bytes = await crypto.subtle.exportKey('spki', key)
  return bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
}
function normalized(context: MessageContext) {
  const validId = (value: unknown): value is string => typeof value === 'string' && ids.test(value) && value === value.toLowerCase()
  if (!context || !validId(context.conversationId) || !validId(context.senderId) || !Array.isArray(context.recipientIds) || context.recipientIds.length !== 2 ||
      new Set(context.recipientIds).size !== 2 || !context.recipientIds.every(validId) || !context.recipientIds.includes(context.senderId)) throw new Error('Invalid conversation context.')
  return { conversationId: context.conversationId, senderId: context.senderId, recipientIds: [...context.recipientIds].sort() }
}
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
function fields(value: Record<string, unknown>, expected: string[]) {
  return Object.keys(value).sort().join(',') === [...expected].sort().join(',')
}
function canonicalBase64(value: unknown, minimum: number, maximum: number): value is string {
  if (typeof value !== 'string' || value.length > 4 * Math.ceil(maximum / 3) || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) return false
  try {
    const bytes = base64ToBytes(value)
    return bytes.length >= minimum && bytes.length <= maximum && bytesToBase64(bytes) === value
  } catch { return false }
}
// Parse before any asymmetric operation. Do not trust TypeScript types at a
// network/storage boundary; malformed payloads must not allocate unbounded data.
export function parseRecipientEnvelope(value: unknown): RecipientEnvelope | null {
  try {
    if (typeof value === 'string') {
      if (value.length > 28 * 1024) return null
      value = JSON.parse(value)
    }
    if (!isRecord(value) || !fields(value, ['version', 'context', 'iv', 'ciphertext', 'recipients']) || value.version !== 2 ||
        !isRecord(value.context) || !fields(value.context, ['conversationId', 'senderId', 'recipientIds']) ||
        !Array.isArray(value.recipients) || value.recipients.length !== 2 ||
        !canonicalBase64(value.iv, 12, 12) || !canonicalBase64(value.ciphertext, 16, 16 * 1024 + 16)) return null
    const context = normalized(value.context as MessageContext)
    const recipients: RecipientEnvelope['recipients'] = []
    for (const candidate of value.recipients) {
      if (!isRecord(candidate) || !fields(candidate, ['citizenId', 'keyId', 'wrappedKey']) ||
          typeof candidate.citizenId !== 'string' || !context.recipientIds.includes(candidate.citizenId) ||
          !canonicalBase64(candidate.keyId, 32, 32) || !canonicalBase64(candidate.wrappedKey, 384, 1024)) return null
      recipients.push({ citizenId: candidate.citizenId, keyId: candidate.keyId, wrappedKey: candidate.wrappedKey })
    }
    recipients.sort((a, b) => a.citizenId.localeCompare(b.citizenId))
    if (new Set(recipients.map(key => key.citizenId)).size !== 2 || new Set(recipients.map(key => key.keyId)).size !== 2) return null
    return { version: 2, context, recipients, iv: value.iv, ciphertext: value.ciphertext }
  } catch { return null }
}
function additionalData(context: MessageContext, recipients: { citizenId: string; keyId: string }[]) {
  return encoder.encode(JSON.stringify({ version: 2, context, recipients: recipients.map(({ citizenId, keyId }) => ({ citizenId, keyId })) }))
}
export async function encryptForRecipients(plaintext: string, context: MessageContext, keys: { citizenId: string; publicKey: CryptoKey }[]): Promise<RecipientEnvelope> {
  const canonical = normalized(context)
  if (!plaintext || encoder.encode(plaintext).length > 16 * 1024 || keys.length !== 2 ||
      new Set(keys.map(key => key.citizenId)).size !== 2 || !canonical.recipientIds.every(id => keys.some(key => key.citizenId === id))) throw new Error('Recipient keys or message are invalid.')
  const recipients = await Promise.all([...keys].sort((a, b) => a.citizenId.localeCompare(b.citizenId)).map(async key => ({ ...key, keyId: await publicKeyFingerprint(key.publicKey) })))
  if (new Set(recipients.map(key => key.keyId)).size !== 2) throw new Error('Distinct recipient keys are required.')
  const aad = additionalData(canonical, recipients)
  // The ephemeral AES key is only exported through RSA-OAEP wrapKey, never raw.
  const messageKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 }, messageKey, encoder.encode(plaintext))
  const wrapped = await Promise.all(recipients.map(async recipient => ({
    citizenId: recipient.citizenId, keyId: recipient.keyId,
    wrappedKey: bytesToBase64(new Uint8Array(await crypto.subtle.wrapKey('raw', messageKey, recipient.publicKey, { name: 'RSA-OAEP', label: aad }))),
  })))
  return { version: 2, context: canonical, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)), recipients: wrapped }
}
export async function decryptForRecipient(untrusted: unknown, expected: MessageContext, citizenId: string, expectedKeyId: string, privateKey: CryptoKey) {
  const envelope = parseRecipientEnvelope(untrusted)
  if (!envelope) throw new Error('Invalid encrypted message envelope.')
  const canonical = normalized(expected)
  if (envelope.version !== 2 || JSON.stringify(envelope.context) !== JSON.stringify(canonical) ||
      envelope.recipients.length !== 2 || envelope.recipients.some((key, index) => key.citizenId !== canonical.recipientIds[index]) ||
      !canonical.recipientIds.includes(citizenId) || privateKey.type !== 'private' || privateKey.extractable) throw new Error('Message authorization or key is invalid.')
  const recipient = envelope.recipients.find(key => key.citizenId === citizenId)
  if (!recipient || recipient.keyId !== expectedKeyId) throw new Error('Recipient key is unavailable.')
  const aad = additionalData(canonical, envelope.recipients)
  const key = await crypto.subtle.unwrapKey('raw', base64ToBytes(recipient.wrappedKey), privateKey, { name: 'RSA-OAEP', label: aad }, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(envelope.iv), additionalData: aad, tagLength: 128 }, key, base64ToBytes(envelope.ciphertext))
  return new TextDecoder('utf-8', { fatal: true }).decode(plaintext)
}
