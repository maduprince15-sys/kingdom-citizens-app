# Isolated Citizen integration setup

This setup is BLOCKED until a dedicated disposable Supabase project exists. Never use the ministry Production project, Production credentials, member data or backups. Do not share secrets in issues or chat.

## Minimum owner configuration

1. Provision a separate Supabase test project with synthetic schema/data only. Review the repository migrations against that environment; the guarded enrollment and attachment migrations require the explicit `app.kingdom_isolated_fixture = 'synthetic-only'` marker and existing profile/message/group RLS prerequisites. Do not apply the entire migration directory blindly or point CLI commands at Production. Verify deployed RLS/grants and private Storage bucket configuration separately.
2. In the private test execution environment, set the dedicated ref, URL and **ordinary publishable/anon** key plus three distinct ordinary synthetic accounts (A sender, B recipient, C unauthorized third party), confirmed through controlled test inboxes. Staff/service-role credentials are rejected as runner credentials. C must also remain an ordinary Citizen.
3. Configure an isolated Preview with the matching public test URL/key and server-only test credentials. Enrollment remains gated by `KC_RECIPIENT_ENROLLMENT_ENABLED=isolated-test-only` and `KC_ISOLATED_TEST_PROJECT_REF`. Keep attachments and ordinary messaging disabled until hosted checks pass. Do not place privileged credentials in `NEXT_PUBLIC_*` variables.
4. Configure test Google OAuth client/provider and exact Preview `/auth/callback` allowlist plus existing native beta callback. Supply controlled provider/inbox/browser fixtures for OAuth, email confirmation and recovery. Password-only tests cannot prove these flows.

Required runner environment names (values supplied privately, never guessed):

```text
KC_INTEGRATION_OPT_IN=synthetic-isolated-only
KC_ISOLATED_TEST_PROJECT_REF
KC_TEST_SUPABASE_URL
KC_TEST_SUPABASE_PUBLISHABLE_KEY
KC_TEST_CITIZEN_A_EMAIL
KC_TEST_CITIZEN_A_PASSWORD
KC_TEST_CITIZEN_B_EMAIL
KC_TEST_CITIZEN_B_PASSWORD
KC_TEST_CITIZEN_C_EMAIL
KC_TEST_CITIZEN_C_PASSWORD
```

Run `npm run test:two-citizen:config` first. It makes **no network requests** and prints no credential values. Exit 2 means BLOCKED; exit 0 means configuration shape accepted, **not** genuine verification. It shares the live runner's guard and rejects the known Production project, URL/ref mismatch, elevated credentials and duplicate accounts. Explicit project naming remains the operator's responsibility; a publishable key's project cannot be proven offline.

Then run `npm run test:two-citizen` only against the authorized isolated project. Registration is off by default; optional `KC_TEST_REGISTER_CITIZENS=create-synthetic-only` permits synthetic signup and fails BLOCKED when confirmation requires inbox access. The runner signs in A/B/C, refreshes sessions, checks ordinary roles/profile privacy/directory, and checks logout. Read the per-check output: unimplemented or unavailable provider/enrollment/message/Storage checks remain BLOCKED; do not infer success from exit 0 or preflight.

## Remaining hosted acceptance gates

- Genuine signup/confirmation/password recovery, logout and invalidated session handling; Google browser/native callbacks.
- New-device proof plus current trusted-device approval, ownership denial, replay/expiry/version conflicts and revocation under deployed enrollment authorization.
- A↔B encrypted send/reply with atomic current-key revision enforcement and C rejection. Current registry is **one active device**, not simultaneous multi-device fan-out.
- Profile/directory/group RLS, removal of group membership, and role escalation denial through ordinary clients.
- Private Storage upload/download/delete with uploader paths, MIME/size enforcement, cross-account and anonymous denial, removed-member denial, and expired/revoked access.
- Native WebView key persistence and session transitions using the verified independent beta. No device behavior is established by Node IndexedDB tests or APK compilation.

No Production migrations, policy changes, data copying or manual installation are authorized by this document.
