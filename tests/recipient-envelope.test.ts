import { beforeAll, expect, it } from 'vitest'
import { decryptForRecipient, encryptForRecipients, generateRecipientIdentity, publicKeyFingerprint, parseRecipientEnvelope, type MessageContext, type RecipientEnvelope } from '../lib/e2ee/recipient-envelope'
const A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', C = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'
const context: MessageContext = { conversationId: 'dddddddd-dddd-4ddd-dddd-dddddddddddd', senderId: A, recipientIds: [A, B] }
let a: CryptoKeyPair, b: CryptoKeyPair, outsider: CryptoKeyPair, envelope: RecipientEnvelope
beforeAll(async () => {
  ;[a, b, outsider] = await Promise.all([generateRecipientIdentity(), generateRecipientIdentity(), generateRecipientIdentity()])
  envelope = await encryptForRecipients('Synthetic private message', context, [{ citizenId: A, publicKey: a.publicKey }, { citizenId: B, publicKey: b.publicKey }])
}, 30_000)
it('keeps private identity keys non-extractable', async () => {
  expect(a.privateKey.extractable).toBe(false)
  await expect(crypto.subtle.exportKey('pkcs8', a.privateKey)).rejects.toThrow()
})
it('both enrolled participants decrypt using their own wrapped key', async () => {
  expect(await decryptForRecipient(envelope, context, A, await publicKeyFingerprint(a.publicKey), a.privateKey)).toBe('Synthetic private message')
  expect(await decryptForRecipient(envelope, context, B, await publicKeyFingerprint(b.publicKey), b.privateKey)).toBe('Synthetic private message')
})
it('supports the authorized recipient reply', async () => {
  const replyContext = { ...context, senderId: B }
  const reply = await encryptForRecipients('Synthetic reply', replyContext, [{ citizenId: A, publicKey: a.publicKey }, { citizenId: B, publicKey: b.publicKey }])
  expect(await decryptForRecipient(reply, replyContext, A, await publicKeyFingerprint(a.publicKey), a.privateKey)).toBe('Synthetic reply')
})
it('does not serialize plaintext or private keys', () => {
  const serialized = JSON.stringify(envelope)
  expect(serialized).not.toContain('Synthetic private message')
  expect(serialized).not.toContain('privateKey')
})
it('rejects an outsider even when they possess their own valid identity', async () => {
  await expect(decryptForRecipient(envelope, context, C, await publicKeyFingerprint(outsider.publicKey), outsider.privateKey)).rejects.toThrow()
})
it('rejects another private key for a legitimate recipient', async () => {
  await expect(decryptForRecipient(envelope, context, B, await publicKeyFingerprint(b.publicKey), outsider.privateKey)).rejects.toThrow()
})
it('rejects cross-conversation replay', async () => {
  await expect(decryptForRecipient(envelope, { ...context, conversationId: C }, B, await publicKeyFingerprint(b.publicKey), b.privateKey)).rejects.toThrow()
})
it('rejects sender substitution', async () => {
  await expect(decryptForRecipient({ ...envelope, context: { ...context, senderId: B } }, { ...context, senderId: B }, B, await publicKeyFingerprint(b.publicKey), b.privateKey)).rejects.toThrow()
})
it.each(['ciphertext', 'iv'] as const)('rejects tampered %s', async field => {
  const value = envelope[field]
  const tampered = { ...envelope, [field]: (value[0] === 'A' ? 'B' : 'A') + value.slice(1) }
  await expect(decryptForRecipient(tampered, context, B, await publicKeyFingerprint(b.publicKey), b.privateKey)).rejects.toThrow()
})
it('rejects a missing or rotated fingerprint', async () => {
  await expect(decryptForRecipient(envelope, context, B, await publicKeyFingerprint(outsider.publicKey), b.privateKey)).rejects.toThrow()
})
it('refuses to encrypt without both authenticated recipient keys', async () => {
  await expect(encryptForRecipients('Synthetic', context, [{ citizenId: A, publicKey: a.publicKey }])).rejects.toThrow()
})
it('refuses duplicate recipient identities', async () => {
  await expect(encryptForRecipients('Synthetic', context, [{ citizenId: A, publicKey: a.publicKey }, { citizenId: A, publicKey: b.publicKey }])).rejects.toThrow()
})

it('parses serialized storage data into a canonical envelope', async () => {
  const reordered = { ...envelope, context: { recipientIds: [...context.recipientIds].reverse(), senderId: A, conversationId: context.conversationId }, recipients: [...envelope.recipients].reverse() }
  expect(parseRecipientEnvelope(JSON.stringify(reordered))).not.toBeNull()
  expect(await decryptForRecipient(JSON.stringify(reordered), context, B, await publicKeyFingerprint(b.publicKey), b.privateKey)).toBe('Synthetic private message')
})
it.each([null, undefined, [], {}, 'not-json', 'x'.repeat(28 * 1024 + 1)])('rejects malformed or oversized untrusted input before crypto', value => {
  expect(parseRecipientEnvelope(value)).toBeNull()
})
it('rejects oversized ciphertext and incorrect IV length', () => {
  expect(parseRecipientEnvelope({ ...envelope, ciphertext: 'A'.repeat(24_000) })).toBeNull()
  expect(parseRecipientEnvelope({ ...envelope, iv: 'AAAA' })).toBeNull()
})
it('rejects non-canonical base64 and unexpected secret fields', () => {
  expect(parseRecipientEnvelope({ ...envelope, ciphertext: envelope.ciphertext + '\n' })).toBeNull()
  expect(parseRecipientEnvelope({ ...envelope, privateKey: 'must-never-be-accepted' })).toBeNull()
})
it('rejects one key reused for two distinct Citizens', async () => {
  await expect(encryptForRecipients('Synthetic', context, [{ citizenId: A, publicKey: a.publicKey }, { citizenId: B, publicKey: a.publicKey }])).rejects.toThrow('Distinct')
})
it('rejects case-alias identities', async () => {
  await expect(encryptForRecipients('Synthetic', { ...context, senderId: A.toUpperCase() }, [{ citizenId: A, publicKey: a.publicKey }, { citizenId: B, publicKey: b.publicKey }])).rejects.toThrow()
})
it('rejects recipient key metadata aliasing', () => {
  expect(parseRecipientEnvelope({ ...envelope, recipients: envelope.recipients.map(key => ({ ...key, keyId: envelope.recipients[0].keyId })) })).toBeNull()
})
