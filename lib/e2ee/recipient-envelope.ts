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
  return crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['wrapKey', 'unwrapKey'])
}
export async function publicKeyFingerprint(key: CryptoKey) {
  const algorithm = key.algorithm as RsaHashedKeyAlgorithm
  if (key.type !== 'public' || algorithm.name !== 'RSA-OAEP' || algorithm.hash?.name !== 'SHA-256' || algorithm.modulusLength < 3072 || !key.usages.includes('wrapKey')) throw new Error('Unsupported recipient key.')
  const bytes = await crypto.subtle.exportKey('spki', key)
  return bytesToBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
}
function normalized(context: MessageContext) {
  if (!ids.test(context.conversationId) || !ids.test(context.senderId) || context.recipientIds.length !== 2 ||
      new Set(context.recipientIds).size !== 2 || !context.recipientIds.every(id => ids.test(id)) || !context.recipientIds.includes(context.senderId)) throw new Error('Invalid conversation context.')
  return { conversationId: context.conversationId, senderId: context.senderId, recipientIds: [...context.recipientIds].sort() }
}
function additionalData(context: MessageContext, recipients: { citizenId: string; keyId: string }[]) {
  return encoder.encode(JSON.stringify({ version: 2, context, recipients: recipients.map(({ citizenId, keyId }) => ({ citizenId, keyId })) }))
}
export async function encryptForRecipients(plaintext: string, context: MessageContext, keys: { citizenId: string; publicKey: CryptoKey }[]): Promise<RecipientEnvelope> {
  const canonical = normalized(context)
  if (!plaintext || encoder.encode(plaintext).length > 16 * 1024 || keys.length !== 2 ||
      new Set(keys.map(key => key.citizenId)).size !== 2 || !canonical.recipientIds.every(id => keys.some(key => key.citizenId === id))) throw new Error('Recipient keys or message are invalid.')
  const recipients = await Promise.all([...keys].sort((a, b) => a.citizenId.localeCompare(b.citizenId)).map(async key => ({ ...key, keyId: await publicKeyFingerprint(key.publicKey) })))
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
export async function decryptForRecipient(envelope: RecipientEnvelope, expected: MessageContext, citizenId: string, expectedKeyId: string, privateKey: CryptoKey) {
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
