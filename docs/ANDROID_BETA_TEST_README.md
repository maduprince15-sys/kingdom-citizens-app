# The Kingdom Citizens — Android beta

The Android debug beta is a separate installable application. It does **not** overwrite the production Kingdom Citizens app.

- Package name: `com.kingdomcitizens.app.beta`.
- Display name: `Kingdom Citizens Beta`.
- Content source: Preview branch URL specified in `capacitor.android-beta.config.ts`. The beta is a network-required WebView, not an offline standalone clone.
- Build: `.github/workflows/kingdom-android-beta.yml` on `test/kingdom-citizens-android-beta-20261106`.
- Installer: GitHub Actions **Artifacts → Kingdom-Citizens-Android-Beta** after the workflow succeeds. Unzip and install the debug-signed APK manually.
- Authentication: The Preview environment may use an intentionally disconnected Supabase test endpoint. Until isolated test accounts and OAuth redirect allowlists are configured, registration, login, Google OAuth, member messaging and private resources **must not** be claimed as working.
- OAuth callbacks: The production `kingdomcitizens://auth/callback` intent may conflict with the installed production app. Do not repurpose production OAuth credentials; provision and test an isolated beta redirect scheme/allowed return URL before testing login.
- Security: Never embed `SUPABASE_SERVICE_ROLE_KEY`, Firebase service account JSON or other server secrets in the APK. Do not connect the beta to live member data for experiments.
- User testing later: Public home/logo/layout first; then sign-in, member dashboard, directory/role isolation, private messaging, group membership and push notifications using two **test-only** accounts; finally verify Android app link handling and account recovery.
- Production release requires independent auth/security tests and explicit user review.
