# Recipient envelopes and isolated attachment migration

## Verified baseline and scope

Started on clean existing development head `c942d3c`, beta `83254e2`. Re-ran the 111-test baseline, TypeScript, full lint and production-mode build before implementation. No homepage/logo, Production Vercel, connected database, bucket, live policy, member record or Neneka changes.

## Recipient envelope candidate — code verified, deployment BLOCKED

`lib/e2ee/recipient-envelope.ts` uses Web Crypto RSA-OAEP/SHA-256 (3072-bit keys) to wrap a fresh AES-256-GCM message key for each of the two participants. Non-extractable private identity keys are never exported, transmitted or serialized. Only public SPKI fingerprints and wrapped per-message AES keys appear in the envelope. AES-GCM authenticates conversation ID, sender and recipient-key identities; OAEP labels bind wrapped keys to the same context. Decryption requires caller-supplied, independently trusted expected context and enrolled fingerprint, not identity claims from ciphertext alone.

Tests use actual Web Crypto, proving A/B round trips and replies, non-extractability, outsider rejection, wrong/rotated key rejection, sender/conversation substitution and ciphertext/IV tampering. These are local tests, not independent cryptographic audit or end-to-end deployment verification.

The candidate is **not wired into sending or accepted by the message API**. Before enabling it, the isolated backend needs authenticated immutable Citizen/device public-key enrollment, fingerprint authenticity checks, revocation/rotation, non-extractable key persistence and multi-device/recovery design. An old-message key migration needs ownership proof; blindly assigning legacy shared-browser keys to the next signed-in Citizen is unsafe. Ordinary Citizen recipient permissions and live RLS also remain unverified. No E2EE completion claim.

New legacy sender-only encryption now **fails closed** instead of generating more raw AES keys in localStorage and persisting messages another device cannot open. Drafts remain preserved on failure. Existing legacy key bytes are not deleted or automatically reassigned; read compatibility is retained where a matching existing device key is available. This deliberately does not claim safe legacy shared-device ownership or recovery.

## Attachment migration — local Postgres tested, not applied to Supabase

Generated using the actual Supabase CLI `migration new` command:

`supabase/migrations/20261115115146_isolated_private_attachment_policies.sql`

The CLI initially could not create its home state in this environment. Using its supported `SUPABASE_HOME` under ignored `work/` allowed local-only generation. No CLI login, remote connection or hosted database command was used.

The migration refuses execution without explicit session setting `app.kingdom_isolated_fixture=synthetic-only`. This acknowledgment is for a separately verified disposable test database, **not proof that a database is isolated** and not authorization to set it on Production. It creates the new bucket only if absent, refuses an existing conflicting configuration, and never changes an existing bucket's settings.

Policies enforce current message participant/active group membership, uploader-owned insertion/deletion, and no overwrites/owner reassignment. Restrictive policies constrain any existing permissive policies for this bucket while preserving unrelated-bucket behavior. The helper is SECURITY INVOKER with empty search_path and fully qualified tables; it does not bypass source-table RLS. Anonymous execute permission is explicit only to preserve policy planning on unrelated public buckets; anonymous identity still cannot access private objects and no source-table privileges are granted.

Actual Postgres policy tests run through PGlite in disposable memory with synthetic schemas/roles and a deliberately overbroad existing storage policy. They cover participant/outsider/anonymous access, revoked membership/recipient access, inactive groups, malformed paths, forged owners, ownership mutation, deletion and unchanged unrelated buckets. This is stronger than mocked policy text checks, but does not reproduce the hosted Supabase Storage service, deployed grants/triggers, realtime or API behavior.

File paths now bind uploader identity: `messages/<message-id>/<uploader-id>_<file-id>.ext` or `groups/<group-id>/<uploader-id>_<file-id>.ext`. No real attachments previously existed through this disabled feature. API/UI deletion is uploader-only, requires current resource access, and remains subject to storage RLS. Failed or revoked access never grants an admin-file IO bypass.

### Isolated application / rollback sequence

1. Verify a dedicated test project and synthetic A/B/C fixtures; review existing source-table/storage grants and policies. Never use Production credentials.
2. Apply the reviewed migration only in that isolated database with its explicit fixture acknowledgment. Validate private bucket limits and every source table's RLS using ordinary synthetic roles.
3. Run the integration runner and actual Storage API upload/read/delete/removed-member tests. Local SQL tests do not satisfy this gate.
4. Keep `KC_PRIVATE_ATTACHMENTS_ENABLED` absent until those checks pass. Existing isolation/Production-ref checks remain in code.
5. Roll back application exposure by removing the isolated attachment opt-in first. Keep the bucket private and restrictive policies in place while any files remain. Do not drop guards, delete real objects or run automatic destructive cleanup. A schema rollback is a separately reviewed isolated-fixture operation after the bucket is confirmed empty; it must not expose retained files through older broad policies.

## Integration runner

The runner now rejects duplicate account emails as well as absent opt-in, Production ref and mismatched URL. Guard tests hard-block network even if a regression accidentally passes configuration validation. Logout probes validate refresh-token revocation; old access JWT expiry is not incorrectly treated as immediate logout proof. Reports retain exit code 2 whenever required checks remain BLOCKED, including confirmation-required registration and missing browser/inbox/policy fixtures.

Actual Google enrollment, recovery delivery, live role-escalation writes, new recipient distribution, hosted Storage API and group realtime tests remain BLOCKED by isolated service/account setup. Existing unit/route tests cover application guards without inventing live results.

## Android artifact integrity

Continue the existing isolated beta package/logo/OAuth branch. Add a separate GitHub Actions job that downloads the just-uploaded artifact through the supported download-artifact action, checks the APK SHA-256 against the packaged checksum and checks ZIP integrity. The build job verifies APK signing and records public integrity evidence. This can verify actual bytes on another runner even while this workspace's proxy rejects the Azure artifact download host. It does not claim local/device retrieval, production signing, independent provenance audit or installation readiness.
