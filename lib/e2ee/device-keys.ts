'use client'

import {
  generateAesGcmKey,
  importAesGcmKey,
} from '@/lib/e2ee/crypto'

const DEVICE_ID_KEY = 'kingdom-citizens:e2ee-device-id'
const DEVICE_KEY_ID_KEY = 'kingdom-citizens:e2ee-device-key-id'
const DEVICE_AES_KEY = 'kingdom-citizens:e2ee-device-aes-key'

export async function getOrCreateDeviceMessageKey() {
  if (typeof window === 'undefined') {
    throw new Error('E2EE device keys are only available in the browser.')
  }

  let deviceId = window.localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    window.localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  let keyId = window.localStorage.getItem(DEVICE_KEY_ID_KEY)
  if (!keyId) {
    keyId = crypto.randomUUID()
    window.localStorage.setItem(DEVICE_KEY_ID_KEY, keyId)
  }

  let rawKey = window.localStorage.getItem(DEVICE_AES_KEY)
  if (!rawKey) {
    const generated = await generateAesGcmKey()
    rawKey = generated.rawKey
    window.localStorage.setItem(DEVICE_AES_KEY, rawKey)

    return {
      deviceId,
      keyId,
      key: generated.key,
    }
  }

  return {
    deviceId,
    keyId,
    key: await importAesGcmKey(rawKey),
  }
}

export async function getDeviceMessageKey(keyId?: string) {
  const deviceKey = await getOrCreateDeviceMessageKey()
  if (keyId && deviceKey.keyId !== keyId) return null
  return deviceKey
}
