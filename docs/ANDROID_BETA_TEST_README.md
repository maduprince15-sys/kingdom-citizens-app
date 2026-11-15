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

Web source is pinned to development commit `085dd994110e499e9ad216b62bb7e7a0f162b814`, not a moving Production URL. APK uses the approved original logo, independent beta package ID, disabled Android backup, and exact beta OAuth intent. The artifact includes source references and SHA-256 checksum.

Later ordered acceptance (not a request to test now):

1. Install alongside existing apps; confirm beta name, original logo and burgundy homepage.
2. Use isolated test accounts only. Confirm registration email, dashboard greeting, password login and email recovery.
3. Google login must return to this beta, not the other app; reload/restart to confirm persistence; log out and confirm protected pages reject access.
4. With two test accounts, verify profile ownership, staff role isolation, private replies and group membership restrictions. Do not use real member records.
5. Confirm opt-in notifications only after isolated Firebase configuration exists. The generic APK does not embed a production Firebase config; push readiness is not claimed.
6. Attachments remain disabled pending private storage authorization. Message recipient key sharing/recovery is not verified; do not claim E2EE.

Outstanding external gates: isolated test account/provider configuration, Preview accessibility from a device, native install/return and notification behavior. Build success alone does not establish these behaviors.
