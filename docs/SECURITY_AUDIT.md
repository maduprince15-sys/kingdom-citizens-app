# Security Audit

This is the final checkpoint audit for the current Kingdom Citizens stabilization pass. It does not claim the whole system is fully secure. It records what the repo proves and what still requires Supabase dashboard/database verification.

## Files Inspected

- Supabase clients: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- Permissions: `lib/permissions.ts`
- Auth: `app/components/GoogleLoginButton.tsx`, `app/auth/callback/route.ts`, `app/api/auth/native-profile/route.ts`
- Messages: `app/messages/*`, `app/api/messages/*`, `lib/e2ee/*`
- Admin APIs: `app/api/admin/update-role/route.ts`, `app/api/admin/delete-user/route.ts`
- Content APIs: `app/api/announcements/*`, `app/api/posts/*`, `app/api/chat/delete/route.ts`
- Public/client forms under `app/public`, `app/profile`, `app/admin`, `app/posts`, `app/prayers`
- Android: `capacitor.config.ts`, `android/app/src/main/AndroidManifest.xml`
- Docs/tests under `docs/` and `scripts/`

## High-Risk Findings Fixed

- Private messages previously submitted plaintext body content. New private messages are encrypted client-side, and `/api/messages/send` rejects non-encrypted bodies.
- Message notifications no longer preview private message content.
- Android Google OAuth now has a native custom-scheme return path instead of a disabled guard.
- Native Google account creation now creates/preserves the profile through a server route that verifies the Supabase access token.

## Medium-Risk Findings Fixed

- Message detail reads are constrained to the authenticated sender or recipient.
- Message archive reads are constrained to the authenticated sender or recipient.
- User deletion is aligned with `canDeleteUsers` and protects owner/admin accounts.
- Message board/broadcast role rules are centralized in `lib/permissions.ts`.

## Confirmed In Repo

- The service role key, `SUPABASE_SERVICE_ROLE_KEY`, is only read by `lib/supabase/admin.ts`.
- Service role use is server-side only.
- Privileged API routes call `auth.getUser()` before privileged work.
- Role updates reject self-role changes and invalid roles.
- Owner accounts cannot be changed through the role update route.
- Admins cannot assign owner/admin roles.
- `.env*` is git-ignored.
- No inspected private-message path logs plaintext body, OAuth code, access token, refresh token, or session.

## Service Role Usage

Service role is used for server-only operations that intentionally bypass RLS after app-side authorization:

- role update
- account/user deletion
- announcement/post insert/delete with media cleanup
- notification creation
- native profile setup after access token verification

This is acceptable only when RLS is also configured as defense in depth and the service role remains server-only.

## Still Requires Database Verification

- Supabase RLS must be enabled and verified for all private tables.
- Storage bucket policies must be reviewed for `content-media`, `book-covers`, `book-pdfs`, and `profile-photos`.
- Dependency audit reports 12 findings after plugin installation; review with `npm audit` in a separate dependency hardening pass.

## E2EE Truth State

New private message bodies are encrypted before the send API. Supabase should receive ciphertext JSON only for new private messages, stored in `app_messages.body`.

Not complete:

- no production multi-device E2EE
- no verified device trust
- no key recovery
- no group chat E2EE
- legacy plaintext remains legacy and is labeled

## Deferred Security Work

- Apply and test `supabase/rls-policies.sql` in Supabase.
- Add RLS regression tests against a real Supabase test project.
- Add dependency audit remediation.
- Add verified Android App Link support with `assetlinks.json`.
- Add production E2EE key wrapping and device verification.
