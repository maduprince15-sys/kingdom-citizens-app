'use client'

import {
  importAesGcmKey,
} from '@/lib/e2ee/crypto'

const DEVICE_ID_KEY = 'kingdom-citizens:e2ee-device-id'
const DEVICE_KEY_ID_KEY = 'kingdom-citizens:e2ee-device-key-id'
const DEVICE_AES_KEY = 'kingdom-citizens:e2ee-device-aes-key'

// Read existing legacy keys only. Ownership of old shared-device storage cannot
// be proven, so no automatic per-Citizen migration or new raw keys are created.
export async function getDeviceMessageKey(keyId?: string) {
  if (typeof window === 'undefined') return null
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY)
  const storedKeyId = window.localStorage.getItem(DEVICE_KEY_ID_KEY)
  const rawKey = window.localStorage.getItem(DEVICE_AES_KEY)
  if (!deviceId || !storedKeyId || !rawKey || (keyId && storedKeyId !== keyId)) return null
  return { deviceId, keyId: storedKeyId, key: await importAesGcmKey(rawKey) }
}
