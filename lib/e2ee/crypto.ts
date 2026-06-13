'use client'

export type EncryptedMessagePayload = {
  version: 1
  algorithm: 'AES-GCM'
  ciphertext: string
  iv: string
  keyId?: string
  senderDeviceId?: string
  recipientDeviceId?: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export async function importAesGcmKey(rawKey: string) {
  const keyBytes = base64ToBytes(rawKey)
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function generateAesGcmKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const raw = await crypto.subtle.exportKey('raw', key)

  return {
    key,
    rawKey: bytesToBase64(new Uint8Array(raw)),
  }
}

export async function encryptMessageText(input: {
  plaintext: string
  key: CryptoKey
  keyId?: string
  senderDeviceId?: string
  recipientDeviceId?: string
}): Promise<EncryptedMessagePayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    input.key,
    encoder.encode(input.plaintext)
  )

  return {
    version: 1,
    algorithm: 'AES-GCM',
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
    keyId: input.keyId,
    senderDeviceId: input.senderDeviceId,
    recipientDeviceId: input.recipientDeviceId,
  }
}

export async function decryptMessageText(input: {
  payload: EncryptedMessagePayload
  key: CryptoKey
}) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(input.payload.iv) },
    input.key,
    base64ToBytes(input.payload.ciphertext)
  )

  return decoder.decode(plaintext)
}

export function isEncryptedMessagePayload(value: unknown): value is EncryptedMessagePayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<EncryptedMessagePayload>

  return (
    payload.version === 1 &&
    payload.algorithm === 'AES-GCM' &&
    typeof payload.ciphertext === 'string' &&
    typeof payload.iv === 'string'
  )
}
