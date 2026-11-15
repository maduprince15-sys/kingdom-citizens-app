# Message boundaries and integration evidence

The existing development/beta branches were clean at `47304ac` / `62cdc22`; the current baseline is 155 tests, superseding the earlier 111-test report. Reverified tests, TypeScript, full lint and production-mode build without changing the approved homepage/logo or any Production/Supabase resource.

## Confirmed defects addressed

1. The integration runner interpreted **any** cross-profile query error as privacy protection passing. It now accepts an empty result or explicit PostgreSQL privilege denial (`42501`) only. Network outages, missing schemas and expired-token errors fail verification rather than producing a false READY result.
2. The runner now rejects secret/service-role API keys, legacy anonymous keys belonging to another project, unrecognized key formats and case/whitespace aliases of the same account email. Configuration guard tests forbid actual network access even if a future regression reaches a client request. API-key decoding is a configuration sanity check, not signature verification; the isolated service must still authenticate the key and both ordinary accounts.
3. Candidate v2 envelopes are now parsed from unknown storage/network input with strict allowed fields, canonical IDs/base64, exact IV/fingerprint lengths, bounded ciphertext/wrapped-key sizes and a serialized size limit before RSA/AES operations. Duplicate identities or a public key reused for two Citizens are rejected. Semantically equivalent field/recipient order is canonicalized consistently with authenticated additional data. Ciphertext tampering, sender/conversation substitution and missing keys still fail closed.
4. Attachment list/download responses recheck current resource access after storage IO; deletion rechecks after configuration inspection. Revoked access cannot return the previously fetched bytes/names. Storage exceptions are normalized to generic no-store 503 responses, without exposing internal messages. Hosted Storage RLS remains independently required.

## Verification scope

184 tests pass, including actual Web Crypto envelope tests, 23 disposable Postgres attachment-policy tests, route/UI security regressions and network-blocked integration configuration checks. TypeScript, full lint (0 errors / 32 warnings) and production-mode build pass locally. Exact remote CI/Preview and beta artifact evidence are recorded on tracking issue #3 after push.

The existing guarded migration remains a review-only isolated candidate; it was not applied to any hosted database. Attachments stay disabled. The supported Actions artifact-download/checksum verification job remains in place and will verify the updated beta candidate.

## Still BLOCKED / not claimed complete

No genuine isolated Supabase/account/inbox/browser fixtures are available. Real registration/recovery/Google callbacks, live profile/directory/role RLS, hosted Storage lifecycle and group realtime removal are not replaced by unit-test success. The runner exits 2 for missing configuration or incomplete required checks.

The recipient envelope remains unwired pending authenticated Citizen/device enrollment, public-key fingerprint trust, non-extractable key persistence, rotation/revocation and recovery. AES-GCM context integrity is not a sender signature or independent E2EE audit. Legacy sender-only creation remains fail-closed; drafts are preserved and existing key bytes are not automatically reassigned or deleted. Ordinary Citizen-to-Citizen sending is not claimed enabled.

No Production deployment, live permissions/storage/member data, private Neneka integration, homepage redesign or PR #1 merge. No manual Android testing requested.
