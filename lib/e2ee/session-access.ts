import type { ActiveIdentityRecord } from './identity-vault'

type Vault = { load: (citizenId: string, active: ActiveIdentityRecord, pin: string, revision: number) => Promise<CryptoKeyPair | null> }
// getCitizen must use validated getUser(), not a locally decoded session/JWT.
// No private-key cache. Auth events and logout invalidate in-flight operations.
export function createSessionKeyAccess(deps: {
  citizenId: string; getCitizen: () => Promise<string | null>
  getActive: () => Promise<ActiveIdentityRecord>; vault: Vault
}) {
  let generation = 0, disposed = false
  const invalidate = () => { generation++ }
  async function verify(epoch: number) {
    if (disposed || epoch !== generation || await deps.getCitizen() !== deps.citizenId || epoch !== generation) throw new Error('Reauthenticate before using encryption keys.')
  }
  return {
    invalidate,
    dispose() { disposed = true; invalidate() },
    async use<T>(pinnedKeyId: string, operation: (identity: CryptoKeyPair, active: ActiveIdentityRecord) => Promise<T>) {
      const epoch = generation
      await verify(epoch)
      const active = await deps.getActive()
      if (active.citizenId !== deps.citizenId) throw new Error('Citizen identity changed.')
      const identity = await deps.vault.load(deps.citizenId, active, pinnedKeyId, active.revision)
      if (!identity) throw new Error('This device has no matching private key. Use a retained trusted device.')
      await verify(epoch)
      const result = await operation(identity, active)
      await verify(epoch)
      const fresh = await deps.getActive()
      if (fresh.citizenId !== active.citizenId || fresh.state !== 'active' || fresh.revokedAt !== null || fresh.revision !== active.revision || fresh.deviceId !== active.deviceId || fresh.keyId !== active.keyId) throw new Error('Device authorization changed. Start again.')
      await verify(epoch)
      return result
    },
  }
}
