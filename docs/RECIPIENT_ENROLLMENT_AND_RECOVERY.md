# Recipient enrollment, revocation and recovery candidate

## Baseline and deployment status

Existing development/beta branches were clean at `8235dd3` / `7505542`; reverified the 184-test baseline, TypeScript, full lint and production build. This extends the prior envelope and attachment migrations without duplicate implementations or homepage/logo changes.

This is **isolated-test-only code**, not activated ordinary Citizen messaging or a verified E2EE product. No migration, permission, account, storage bucket, member record or Production deployment was changed. No private key or plaintext message reaches the registry service.

## Authenticated enrollment

`/api/messages/recipient-keys` authenticates the Supabase user, requires a confirmed non-anonymous Citizen profile and derives the owner from that verified identity. Caller-supplied identity fields are rejected. The API is disabled unless `KC_RECIPIENT_ENROLLMENT_ENABLED=isolated-test-only`, an explicitly isolated project ref exactly matches the configured URL, and the environment is neither Production Vercel nor the known live project. An isolated server key is required for narrowly scoped challenge/commit operations; it is never exposed to the browser.

1. Validate the public SPKI using Web Crypto RSA-OAEP/SHA-256, enforce the existing key-strength bounds, compute its canonical SHA-256 fingerprint on the server, and bind a device UUID and expected revision.
2. Generate a five-minute random proof-of-possession nonce. Encrypt it to the proposed public key with an OAEP label binding protocol, challenge ID, Citizen, device, fingerprint, revision, expiry and proof kind. Store its hash, not the plaintext nonce/private key.
3. The non-extractable private key decrypts that one-time nonce. The returned proof is an ephemeral challenge token, **not a private encryption key**. Only the authenticated owner can submit it. The API compares fixed-length digests using timingSafeEqual; the database verifies proof again during commit.
4. A service-only SECURITY INVOKER transaction locks the challenge/head, checks expiry and single use, and performs compare-and-swap against the expected revision. Public key/device/fingerprint/version are immutable; direct authenticated writes and mutation RPC execution are denied. Concurrent/stale completions cannot silently replace a key.
5. Rotation requires proof of **both** the current and proposed private keys. It creates a new immutable version and revokes the previous version. Fingerprints cannot be reused across Citizens. Revocation advances the revision, removes the active key and invalidates outstanding old approvals. Reauthentication alone cannot reenroll after revocation.

The shared Web Crypto utility is now usable from both server routes and client code; a regression guard prevents reintroducing a client-only boundary into server enrollment dependencies.

New guarded migration: `supabase/migrations/20261115125432_isolated_recipient_key_enrollment.sql`, created using the actual Supabase CLI local `migration new` command. It requires explicit synthetic-fixture acknowledgment and existing profile RLS, creates only new tables/policies/functions, and leaves profile roles and existing permissions unchanged. Profile deletion cascades enrollment metadata so the existing account-deletion flow is not blocked. The active head references a real key version.

The registry contains **public encryption material**, opaque device UUIDs and revision metadata; no contact details, app roles, private key bytes or message plaintext. Confirmed registered Citizens may discover active public material; owner history stays owner-readable, and nonce challenges are server-only. Anonymous users, anonymous signed-in identities and identities without a profile cannot read the registry. The API additionally respects the filtered member directory for peer lookup.

## Recipient verification and freshness

GET uses the authenticated RLS client, verifies SPKI/fingerprint consistency and rereads the head before returning a no-store active record. Revoked/unenrolled or concurrently changed keys are not returned as active. `verifyActiveRecipient` requires the expected Citizen, an explicitly pinned fingerprint and a valid minimum revision. A changed fingerprint must be verified; it is not silently trusted.

The v2 message API remains disabled. Before activation, the actual send transaction must atomically revalidate both participants' current revisions and authorization, and authenticated enrollment/fingerprint trust must pass isolated end-to-end testing. A fresh lookup alone does not eliminate the lookup-to-send revocation race. Context-authenticated encryption is not a sender signature or independent E2EE audit. Supabase/session integrity and initial fingerprint trust remain explicit assumptions.

## Recovery behavior — safe implemented gates

- **Logout:** key operations require reauthentication; login does not reconstruct key bytes. Logout tests revoke refresh tokens; they do not incorrectly assume every already-issued access JWT immediately expires.
- **Same browser/device with a retained current key:** possession can be proved again. This candidate does not introduce unsafe raw-key persistence. Secure browser storage/unlock, shared-device isolation and logout retention policy still need approval and verification before product activation.
- **New browser while a trusted device remains:** split helper functions let the new device answer only its new-key nonce and the old device approve only the prior-key nonce. Neither private key transfers. The old device must explicitly verify the new fingerprint through an approved authenticated pairing channel. Tests prove the crypto path; pairing UI/channel and real-device approval are not deployed.
- **Rotation/history:** current public identity advances; retained old private keys can still decrypt their historical envelopes. Revocation prevents new key selection; it cannot erase already downloaded data or ciphertext/private keys on a compromised device. Historical envelopes are not automatically rewritten or falsely presented as recovered on the new device.
- **Compromised or lost current device:** authenticated revocation quarantines it. The registry refuses account-only replacement after revocation, even with an outstanding old approval. Missing/inconsistent metadata fails closed.
- **All private keys lost:** recovery is BLOCKED. Authentication, password reset and ministry roles cannot decrypt old messages. No server plaintext escrow or administrative decryption override exists.

## Recovery alternatives requiring an architectural decision

| Alternative | Benefit | Security/operational trade-off |
|---|---|---|
| Approved-device enrollment/transfer | Preserves non-extractable identities; no private-key export | Requires a retained trusted device and verified pairing. This candidate has one active key; multi-active-device fan-out is not implemented. Historical message migration needs a separately authenticated client-side archive/re-encryption design. |
| Pre-provisioned user-held high-entropy recovery secret | Could recover message content after every device is lost, without server plaintext | Must be designed **before** loss, with separate encrypted recovery wrapping at message creation or a reviewed new backup scheme. Losing the secret is irreversible; weak passphrases permit offline attacks. Existing non-extractable identity keys cannot retroactively be exported for backup. |
| Hardware-backed/platform recovery | May add user presence and protected unlock | Browser/platform availability, threat model, cross-device support and recovery guarantees require verification; it is not supplied by Supabase login. |
| Server-held plaintext/private-key escrow | Easy administrative restoration | Rejected here: contradicts the required privacy architecture and is not implemented. |

Do not generate extractable private identities or silently share raw keys to avoid these decisions. No independent E2EE/key-management verification is claimed.

## Verification and genuine integration gates

Local suites exercise real Web Crypto possession/rotation/identity binding, candidate API authorization and error paths, and actual Postgres registry privileges/immutability/CAS/revocation in disposable PGlite memory. This is not hosted Supabase authentication, deployed role grants, multi-connection concurrency proof, Storage service behavior or a cryptographic audit.

Genuine integration remains BLOCKED without a dedicated isolated project, synthetic A/B/C accounts, controlled inbox/provider/browser fixtures, the reviewed new schema, and isolated server configuration. The existing runner must continue to report BLOCKED, never fall back to Production or use elevated credentials to fake ordinary-Citizen tests. Existing guarded attachment migration and 23 local storage-policy tests remain intact; attachments stay disabled pending actual deployed Storage/RLS tests.

Activation also requires abuse/rate controls, fresh-session/step-up policy for sensitive key changes, authenticated device pairing, safe persistence/recovery decisions, registry/fingerprint audit, actual A↔B encrypted send/reply tests with server revision enforcement, and third-Citizen rejection.

## Owner artifact retrieval

Use the latest verified run on the existing beta branch, authenticated as an account allowed to read repository Actions artifacts: run Summary → Artifacts → Kingdom-Citizens-Android-Beta. On a trusted network that permits GitHub's Azure artifact host, the supported CLI equivalent is `gh run download <verified-run-id> --repo maduprince15-sys/kingdom-citizens-app --name Kingdom-Citizens-Android-Beta`, then `sha256sum --check android-beta-sha256.txt` in the extracted directory. Compare source/checksum/signature evidence with the same run's summary.

The existing second Actions job actually downloads bytes and verifies SHA-256/ZIP integrity within the same authorized run. It does not publish a release or grant public artifact access. The workspace proxy's 403 is a network restriction, not justification to broaden permissions or expose a bypass credential. Preserve the independent beta package/logo/OAuth scheme. No manual installation requested while backend/device gates remain.
