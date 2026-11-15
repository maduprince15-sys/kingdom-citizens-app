# The Kingdom Citizens — Android beta

The Android debug beta is a separate installable application. It does **not** overwrite the production Kingdom Citizens app.

- Package name: `com.kingdomcitizens.app.beta`.
- Display name: `Kingdom Citizens Beta`.
- Content source: Preview branch URL specified in `capacitor.android-beta.config.ts`. The beta is a network-required WebView, not an offline standalone clone.
- Build: `.github/workflows/kingdom-android-beta.yml` on `test/kingdom-citizens-android-beta-20261106`.
- Installer: GitHub Actions **Artifacts → Kingdom-Citizens-Android-Beta** after the workflow succeeds. Unzip and install the debug-signed APK manually.
- Authentication: The Preview environment may use an intentionally disconnected Supabase test endpoint. Until isolated test accounts and OAuth redirect allowlists are configured, registration, login, Google OAuth, member messaging and private resources **must not** be claimed as working.
- OAuth callbacks: `kingdomcitizensbeta://auth/callback` belongs only to the beta. The web code selects it using the native package ID. The isolated test Supabase project must explicitly allow this return URL; Production allowlists are unchanged.
- Security: Never embed `SUPABASE_SERVICE_ROLE_KEY`, Firebase service account JSON or other server secrets in the APK. Do not connect the beta to live member data for experiments.
- User testing later: Public home/logo/layout first; then sign-in, member dashboard, directory/role isolation, private messaging, group membership and push notifications using two **test-only** accounts; finally verify Android app link handling and account recovery.
- Production release requires independent auth/security tests and explicit user review.

## Consolidated candidate — 15 November 2026

Web source is pinned to development commit `c942d3c078491b154530e2d6e74b534035353985`, not a moving Production URL. APK uses the approved original logo, independent beta package ID, disabled Android backup, and exact beta OAuth intent. The artifact includes source references and SHA-256 checksum.

Later ordered acceptance (not a request to test now):

1. Install alongside existing apps; confirm beta name, original logo and burgundy homepage.
2. Use isolated test accounts only. Confirm registration email, dashboard greeting, password login and email recovery.
3. Google login must return to this beta, not the other app; reload/restart to confirm persistence; log out and confirm protected pages reject access.
4. With two test accounts, verify profile ownership, staff role isolation, private replies and group membership restrictions. Do not use real member records.
5. Confirm opt-in notifications only after isolated Firebase configuration exists. The generic APK does not embed a production Firebase config; push readiness is not claimed.
6. Attachments remain disabled pending private storage authorization. Message recipient key sharing/recovery is not verified; do not claim E2EE.

Outstanding external gates: isolated test account/provider configuration, Preview accessibility from a device, native install/return and notification behavior. Build success alone does not establish these behaviors.

## Security verification candidate

This candidate includes 70 mocked behavioral regressions and the profile/directory/chat/role hardening documented in `docs/TWO_CITIZEN_VERIFICATION_2026-11-15.md`. Full lint has zero errors. Actual isolated A/B authentication, deployed RLS, ordinary Citizen-to-Citizen delivery, recipient decryption and private attachments remain BLOCKED; an APK build does not change those findings.

Artifact retrieval from this execution environment is blocked by a proxy CONNECT 403 on GitHub's Azure artifact host. Checksum verification requires actual downloaded bytes; no local checksum or installation is claimed. This candidate supersedes the earlier beta installer for later acceptance. No manual testing requested now.

## Messaging/attachment code candidate

This candidate incorporates 111 mocked behavioral tests, current-membership group chat/membership/deletion APIs, draft-preserving delivery errors, and the private attachment pipeline. Attachments remain disabled until explicitly configured against an isolated test project with a verified private size/type-limited bucket and participant-only RLS; no Production storage is used. Recipient decryption remains BLOCKED by missing key distribution, and ordinary Citizen-to-Citizen messaging is not claimed complete.

The opt-in `npm run test:two-citizen` runner exits BLOCKED without synthetic isolated account settings. See `docs/SECURE_MESSAGING_ATTACHMENTS_2026-11-15.md` for exact prerequisites and pending acceptance gates. No installation or manual device testing requested now.
