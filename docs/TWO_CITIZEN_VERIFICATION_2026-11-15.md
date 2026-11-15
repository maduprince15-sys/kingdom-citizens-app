# Two-Citizen authentication and security verification — 15 November 2026

## READY — automated code verification

Baseline branches were clean and matched origin, including development `17bb207` and Android beta `48dd440`. Work remains on those existing branches; no Production, database policy, member record or credential changes were made.

70 mocked behavioral tests cover authentication/callbacks, registration of two distinct verified identities, all five existing staff roles, profile-owner filters, sender impersonation, unrelated replies, archive ownership, privileged role boundaries, generic database errors, exact native callbacks, and the missing recipient-key failure. These are application tests, **not live RLS or real-account integration evidence**.

- Full ESLint: **0 errors / 32 warnings**. All 20 previously reported errors fixed with narrower types/query inference and a mount-only notification permission check. Full lint is now required by CI; rules have not been disabled.
- TypeScript and production-mode build pass locally; original logo/static audit passes.
- Chat deletion now uses the authenticated RLS client for lookup **and mutation**, rather than an admin client that bypasses group visibility. App ownership/moderator checks remain. If deployed test RLS does not permit the action, it fails closed.
- Archive updates include sender/recipient ownership predicates at write time.
- Role, archive, chat and message UI failures return generic errors instead of database internals.
- The public notice board now uses `member_directory`, drops email fallback, and no longer selects profile emails directly. Actual RPC response filtering still requires isolated backend tests.
- Profile email changes return to the initiating Preview rather than a configured Production site URL.
- Attachment-bearing private-message requests are explicitly rejected. No private upload/storage contract exists; attachment support is not claimed.

## BLOCKED — genuine two-account integration

Supabase project metadata discovery returned the known active production project and an unrelated inactive project, not an identified active isolated test project. No local isolated credentials or genuine test-account configuration exists. No production SQL, users or private profiles were queried, and no accounts were invented.

The following remain BLOCKED, not passed: real A/B registration, email delivery/confirmation, password login/logout/refresh/recovery, Google provider allowlists/Preview redirects, separate-account session isolation, live profile/directory privacy, forbidden direct Data API writes/role escalation, group-membership RLS, storage authorization, and native device behavior.

Offline RLS SQL is an old review template, not evidence of current deployed permissions. It must not be applied to Production as part of this task.

## BLOCKED — ordinary Citizen private messaging

Current application policy intentionally restricts ordinary Citizens to messaging board roles. A mocked ordinary A → ordinary B request returns 403; this is recorded as an unmet functional requirement, not a successful messaging test. Authorized staff/board paths and participant-pair reply checks are tested. We did not broaden permissions without isolated RLS verification.

Encryption currently creates a sender-device AES key with `recipientDeviceId: 'not-wrapped-yet'`. A separate recipient device has no supplied decryption key; a behavioral test verifies this fails rather than displaying invented plaintext. The key storage is device-scoped, so same-device multi-account handling also needs review. Cross-recipient key distribution/recovery and E2EE are **not verified**.

No small attachment feature is ready: file-size/type checks alone cannot establish participant ownership or authorized retrieval without private storage policies. Keep it disabled until the storage design can be verified with isolated accounts.

## Android artifact investigation

Existing beta package `com.kingdomcitizens.app.beta` is separate from Production and uses `kingdomcitizensbeta://auth/callback`; callback selection uses native package identity. Manifest generation uses exact `/callback`, disables backup and preserves the original logo. Web content is a pinned Preview URL, not Production.

Previous artifact `14150100445`, 9,656,320 bytes, was confirmed available and unexpired (expires 29 November 2026). A fresh GitHub artifact request returned 302 to `productionresultssa5.blob.core.windows.net`; this environment's proxy rejected the subsequent CONNECT tunnel with **403 Forbidden**. Cache-refresh did not resolve it. No APK bytes were obtained, so local SHA-256 and installation checks are BLOCKED and not claimed. GitHub CI previously verified package identity and upload.

Preview requires Vercel SSO; no protection was disabled and no bypass secret is embedded. The consolidated beta can be rebuilt on its existing branch after the new Preview is READY. No installation or manual device testing requested.

## PENDING release gates

Check current GitHub Actions and Vercel Preview for the exact pushed code; record their remote results on issue #3. Build one consolidated APK with pinned Preview and source/checksum/checklist bundle. Resolve isolated environment and device access before eventual ordered acceptance: registration/recovery → Google native return → session/logout → profile/role privacy → two-account messages/groups → opt-in push. Do not call the product production-ready or merge draft PR #1.
