'use client'

import {
  decryptMessageText,
  encryptMessageText,
  isEncryptedMessagePayload,
  type EncryptedMessagePayload,
} from '@/lib/e2ee/crypto'
import {
  getDeviceMessageKey,
  getOrCreateDeviceMessageKey,
} from '@/lib/e2ee/device-keys'

export type StoredEncryptedMessage = {
  encrypted: true
  payload: EncryptedMessagePayload
}

export async function encryptPrivateMessageBody(plaintext: string) {
  const deviceKey = await getOrCreateDeviceMessageKey()
  const payload = await encryptMessageText({
    plaintext,
    key: deviceKey.key,
    keyId: deviceKey.keyId,
    senderDeviceId: deviceKey.deviceId,
    recipientDeviceId: 'not-wrapped-yet',
  })

  return JSON.stringify({
    encrypted: true,
    payload,
  } satisfies StoredEncryptedMessage)
}

export function parseStoredEncryptedMessage(value: string): StoredEncryptedMessage | null {
  try {
    const parsed = JSON.parse(value) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as { encrypted?: unknown }).encrypted === true &&
      isEncryptedMessagePayload((parsed as { payload?: unknown }).payload)
    ) {
      return parsed as StoredEncryptedMessage
    }
  } catch {
    return null
  }

  return null
}

export async function decryptStoredPrivateMessage(value: string) {
  const encrypted = parseStoredEncryptedMessage(value)
  if (!encrypted) {
    return {
      ok: true,
      legacy: true,
      text: value,
    }
  }

  const deviceKey = await getDeviceMessageKey(encrypted.payload.keyId)
  if (!deviceKey) {
    return {
      ok: false,
      legacy: false,
      text: 'Encrypted message - this device does not have the key.',
    }
  }

  try {
    return {
      ok: true,
      legacy: false,
      text: await decryptMessageText({
        payload: encrypted.payload,
        key: deviceKey.key,
      }),
    }
  } catch {
    return {
      ok: false,
      legacy: false,
      text: 'Encrypted message - this device does not have the key.',
    }
  }
}

export function getEncryptedMessagePreview(value: string) {
  return parseStoredEncryptedMessage(value)
    ? 'Encrypted message'
    : value
}
