import { publicKeyFingerprint } from './recipient-envelope'
import { verifyActiveRecipient } from './enrollment'

// Isolated candidate only. The caller must obtain the Citizen ID from a freshly
// validated session and the active record from the authenticated registry.
// IndexedDB structured cloning preserves CryptoKey non-extractability; this is
// not hardware storage or protection from same-origin script compromise.
export type ActiveIdentityRecord = Parameters<typeof verifyActiveRecipient>[0] & { deviceId: string }
type StoredIdentity = { citizenId: string; deviceId: string; keyId: string; identity: CryptoKeyPair }
const databaseName = 'kingdom-citizens-private-identities-v1'
const storeName = 'identities'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
function owner(citizenId: string | null, deviceId: string) {
  if (!citizenId || !uuid.test(citizenId) || !uuid.test(deviceId)) throw new Error('Authenticated identity required.')
  return citizenId
}
async function validate(record: StoredIdentity) {
  try {
    const pair = record.identity
    if (pair.privateKey.type !== 'private' || pair.privateKey.extractable || pair.publicKey.type !== 'public' ||
        await publicKeyFingerprint(pair.publicKey) !== record.keyId) throw new Error()
    const nonce = crypto.getRandomValues(new Uint8Array(32))
    const label = new TextEncoder().encode(JSON.stringify(['kingdom-identity-vault-v1', record.citizenId, record.deviceId, record.keyId]))
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP', label }, pair.publicKey, nonce)
    const decrypted = new Uint8Array(await crypto.subtle.decrypt({ name: 'RSA-OAEP', label }, pair.privateKey, encrypted))
    const equal = decrypted.length === nonce.length && decrypted.every((byte, i) => byte === nonce[i])
    nonce.fill(0); decrypted.fill(0)
    if (!equal) throw new Error()
  } catch { throw new Error('Local private identity is unavailable or corrupted.') }
}
export function createIdentityVault(factory: IDBFactory) {
  async function open() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      let blocked = false
      const request = factory.open(databaseName, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: ['citizenId', 'deviceId'] })
      request.onerror = () => reject(new Error('Private identity storage unavailable.'))
      request.onblocked = () => { blocked = true; reject(new Error('Private identity storage is blocked.')) }
      request.onsuccess = () => { if (blocked) { request.result.close(); return }; request.result.onversionchange = () => request.result.close(); resolve(request.result) }
    })
  }
  async function transaction<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, result: (value: T) => void) => void) {
    const db = await open()
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        let value: T
        tx.oncomplete = () => resolve(value)
        tx.onabort = () => reject(new Error('Private identity storage operation failed.'))
        tx.onerror = () => { /* Abort reports a generic error, without key data. */ }
        try { operation(tx.objectStore(storeName), result => { value = result }) } catch { tx.abort() }
      })
    } finally { db.close() }
  }
  return {
    // Stage before enrollment. Never overwrite an existing device, even under a
    // concurrent call; callers must explicitly remove it and approve rotation.
    async stage(citizenId: string | null, deviceId: string, identity: CryptoKeyPair) {
      const id = owner(citizenId, deviceId)
      const record = { citizenId: id, deviceId, keyId: await publicKeyFingerprint(identity.publicKey), identity }
      await validate(record)
      await transaction<void>('readwrite', store => { store.add(record) })
      return record.keyId
    },
    async load(citizenId: string | null, active: ActiveIdentityRecord, pinnedKeyId: string, minimumRevision: number) {
      const id = owner(citizenId, active.deviceId)
      await verifyActiveRecipient(active, id, pinnedKeyId, minimumRevision)
      const record = await transaction<StoredIdentity | undefined>('readonly', (store, result) => {
        const request = store.get([id, active.deviceId]); request.onsuccess = () => result(request.result)
      })
      if (!record) return null // Never generate a replacement or pretend recovery.
      if (record.citizenId !== id || record.deviceId !== active.deviceId || record.keyId !== pinnedKeyId) throw new Error('Local identity does not match the active registry.')
      await validate(record)
      return record.identity
    },
    // Explicit local forgetting only; server revocation is a separate operation.
    // Keep retained old keys for historical decryption until the Citizen chooses
    // deletion. Never imply logout or forgetting revokes downloaded copies.
    async forget(citizenId: string | null, deviceId: string) {
      const id = owner(citizenId, deviceId)
      await transaction<void>('readwrite', store => { store.delete([id, deviceId]) })
    },
  }
}
