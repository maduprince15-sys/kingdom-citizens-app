import { approveKeyRotation, verifyActiveRecipient, type EnrollmentChallenge } from './enrollment'
import { publicKeyFingerprint } from './recipient-envelope'

type TrustedDeviceRecord = Parameters<typeof verifyActiveRecipient>[0] & { deviceId: string }
// Candidate approval boundary. Fetch the registry using a freshly authenticated
// session immediately before this call, and obtain the new fingerprint through
// an independently verified pairing interaction. Never approve a supplied QR
// code or fingerprint automatically. The server still atomically checks revision,
// both possession proofs, expiration and replay when completing enrollment.
export async function approveTrustedDevicePairing(input: {
  authenticatedCitizenId: string; trustedIdentity: CryptoKeyPair; active: TrustedDeviceRecord
  trustedDeviceId: string; pinnedCurrentKeyId: string; verifiedNewKeyId: string; challenge: EnrollmentChallenge
}) {
  const { active, challenge } = input
  await verifyActiveRecipient(active, input.authenticatedCitizenId, input.pinnedCurrentKeyId, active.revision)
  if (active.deviceId !== input.trustedDeviceId || challenge.context.deviceId === active.deviceId ||
      challenge.context.expectedRevision !== active.revision || challenge.priorKeyId !== active.keyId ||
      await publicKeyFingerprint(input.trustedIdentity.publicKey) !== active.keyId) {
    throw new Error('Trusted device changed or pairing request is stale.')
  }
  return approveKeyRotation(challenge, input.authenticatedCitizenId, input.trustedIdentity, input.verifiedNewKeyId)
}
