# Authentication stabilization — 15 November 2026

Development only: feature/kingdom-citizens-glass-audit-20261106, draft PR #1, tracking issue #3.

## Implemented

- Persist rotated Supabase cookies before server rendering; mark responses private/no-store. Route authorization and RLS remain in place.
- Password recovery stays on the initiating deployment, supports PKCE and email token-hash callbacks, and does not depend on profile creation.
- Registration handles both confirmation-required and immediate-session responses.
- Login, registration, password recovery/update and logout release loading state on network exceptions. Logout errors do not falsely report success.
- Android callback checks exact URL paths and reports failures in release builds. Native onboarding preserves existing profiles and stops on failed lookups; user-editable metadata never grants staff roles.
- Citizen terminology is display copy only. Database roles remain owner/admin/moderator/teacher/finance/member.
- Original logo and homepage structure/styles preserved. Public homepage is the same route used by the native remote WebView. No Production site changes.

## Verification scope

Behavioral tests use mocked Supabase responses, not real member accounts. They cover form submission, session/no-session registration, OAuth failure paths, existing staff preservation, recovery, native callbacks, and response/request cookie rotation. Static audit additionally verifies logo hashes and existing privacy contracts.

`npm run lint:auth` gates changed authentication and related UI files. Full `npm run lint` has unrelated existing errors (explicit-any in calendar, notice board, account controls, public pages and study; effect/immutability errors in PushNotificationManager). The CI job reports full lint separately with continue-on-error; it does not suppress these rules. Image warnings remain on original logo markup.

## External gates and remaining work

- No live Supabase data, permissions, credentials or private member records inspected or changed. Actual OAuth provider allowlists, confirmation templates, SMTP delivery and two-account RLS behavior require an isolated test project.
- Native profile endpoint still requires the existing server-only service key; its absence on Preview is a configuration blocker, not permission to use Production credentials.
- Existing message encryption uses browser device keys; cross-recipient key distribution/recovery is not verified. Do not claim end-to-end encryption. Private/group isolation requires separate-account backend tests.
- Chat attachments remain unavailable. A private bucket, size/type enforcement and participant-only upload/download authorization must be verified before enabling them. Public content-media storage is unsuitable for private messages.
- Public homepage currently provides teaching/library/gatherings/connect and announcements. Dedicated About Us, featured music and shop sections are not implemented here because official copy/catalog is unavailable and the approved layout must be preserved.
- Android acceptance remains consolidated: install isolated beta, verify original logo/homepage, email confirmation/login/recovery, Google return, persistence/logout, two-account role and message privacy, and opt-in push. No owner testing requested before a coherent artifact exists.

## Verified remote evidence

- Development head `085dd994110e499e9ad216b62bb7e7a0f162b814`: Vercel Preview `dpl_F8Gn9fn3z3iFouxfSnahdW2MoDW6` is READY; target is Preview, not Production.
- GitHub Actions run `43684814416`: SUCCESS. 34 behavioral tests, static audit, TypeScript, auth lint (0 errors / 4 image warnings) and production-mode build passed.
- Full lint reports 20 existing errors / 33 warnings; the CI step is visibly non-blocking and does not redefine lint success.
- Local `next start`: `/`, `/login`, `/register`, `/forgot-password`, `/update-password` returned 200; unauthenticated `/dashboard` returned 307 to `/login`.
- Preview requires Vercel SSO (302 to `vercel.com/sso-api`); no protection settings changed and no bypass secret embedded in the beta. Device access remains a gate.
