import { expect, it, vi } from 'vitest'
const device = vi.hoisted(() => ({ getDeviceMessageKey: vi.fn() }))
vi.mock('../lib/e2ee/device-keys', () => device)
import { decryptStoredPrivateMessage, encryptPrivateMessageBody } from '../lib/e2ee/messages'
it('cannot claim recipient readability without a recipient key', async () => {
  device.getDeviceMessageKey.mockResolvedValue(null)
  const result = await decryptStoredPrivateMessage(JSON.stringify({ encrypted: true, payload: { version: 1, algorithm: 'AES-GCM', ciphertext: 'Y2lwaGVy', iv: 'YWJjZGVmZ2hpamts', keyId: 'citizen-a-device-key' } }))
  expect(result.ok).toBe(false)
  expect(result.text).toContain('does not have the key')
})

it('refuses new sender-only encryption until authenticated recipient enrollment exists', async () => {
  await expect(encryptPrivateMessageBody('Synthetic unsent draft')).rejects.toThrow('Secure recipient enrollment')
  expect(device.getDeviceMessageKey).not.toHaveBeenCalled()
})
