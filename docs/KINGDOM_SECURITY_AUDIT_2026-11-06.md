# The Kingdom Citizens — interface, login and security audit
**Date:** 2026-11-06  
**Scope:** Existing Next.js application, main GitHub branch and connected live Supabase project `KINGDOM CITIZENS` (`jngbhejfqbyjletfknkh`).

This is a read-only security assessment plus a separate design/auth-navigation code proposal. No database policy, user role, live credentials, member data, Production branch or Production Vercel deployment has been altered. Code compilation cannot prove runtime safety.

## Highest-priority confirmed database issues

### 1. CRITICAL — profile role escalation risk
Live RLS: `public.profiles` policy "Users can update own profile" permits `auth.uid() = id` without excluding the `role` column. Live grants: `has_table_privilege('authenticated','public.profiles','UPDATE') = true` and `has_column_privilege('authenticated','public.profiles','role','UPDATE') = true`. A normal signed-in user can attempt updating their own role through Supabase's exposed Data API even if the UI uses a privileged route for appointments. This bypasses the intended role governance model. This is a structural privilege finding, not a performed exploit.

**Fix before wider release:** Remove table-wide UPDATE grants from `authenticated`, grant only non-privileged editable profile columns, retain owner-row RLS, and centralize role changes through the existing server-side authorized role API. Review PUBLIC inherited grants. Back-test the normal profile editor, native/Google callback and new-account trigger before applying. Do not apply the existing all-purpose RLS template unreviewed: it explicitly notes role immutability needs column protection, and the Google callback currently upserts `role`.

### 2. HIGH — anonymous profile data exposure
Live `public.profiles` has "Users can view profiles" RLS SELECT `USING (true)` for PUBLIC and `has_table_privilege('anon','public.profiles','SELECT') = true`. Column metadata confirms `email`, `phone`, `role`, `birthday_month/day` and full name. Anonymous users are permitted to select these data through the Data API.

**Fix:** Remove anonymous table SELECT access and the permissive PUBLIC policy, then design separate authenticated member-directory access restricted to necessary fields. Audit what the Member Directory, birthday notices, recipient picker and profile pages actually need. Do not remove authenticated member-directory access until replacement queries are tested.

### 3. HIGH — group chat membership is not enforced by RLS
`public.chat_messages` authenticated SELECT and INSERT policies allow room strings beginning with `group:` or `study-resource:` without checking that the member belongs to the group or has access to that study resource. A user who can guess a room name could potentially read/post there. All member-level group authorization must be checked in RLS/server functions; neither the UI nor a generic authenticated role is enough. Test with two distinct users and a private group before release.

### 4. HIGH — privileged public functions
Live Supabase security advisors report `public.handle_new_user()` and `public.rls_auto_enable()` as SECURITY DEFINER functions executable by `anon` and `authenticated`. `handle_new_user` also has a mutable search_path warning. Revoke direct EXECUTE from PUBLIC/anon/authenticated for trigger-only or internal-only functions after reviewing their dependent triggers, restrict search_path, and re-run advisors. These grants are confirmed; active exploitation was not tested.

### 5. MEDIUM — compromised-password defense disabled
Supabase Auth advisor reports leaked-password protection disabled. Enable the protection in Auth settings and test sign-up/sign-in; use rate limits, suitable password requirements and MFA for privileged accounts.

### 6. MEDIUM — six RLS tables have no policies
`channel_links`, `group_members`, `groups`, `projects`, `scriptures`, `series` all have RLS enabled and zero policies. They are likely denied to normal clients by default rather than exposed, but intended features could silently fail. Determine if each is legacy/unused or implement explicit least-privilege policies.

## Other important findings / test gaps

- `app_messages` SELECT policy permits owner/admin to read every encrypted (and possibly legacy plaintext) row, not just sender/recipient. This may conflict with promised private messaging; decide deliberate moderation model and keep E2EE limitations explicit.
- `app_posts` and `app_announcements` each have multiple overlapping public SELECT policies, including `USING (true)`. `is_archived`/expiry should be consistently enforced if private or unpublished material exists.
- `book-pdfs` storage bucket is private with authenticated access policies — positive. `content-media`, `book-covers`, `profile-photos` are public by design; ensure no private uploads go there.
- Storage policy permissions require a dedicated role-by-role read/insert/update/delete test. `content-media` allowed MIME types include `videos/mp4`; investigate the likely `video/mp4` typo before enabling video uploads.
- Repo E2EE docs report no verified device trust, key recovery, group E2EE or multi-device E2EE. Legacy plaintext must not be represented as encrypted.
- Supabase role APIs check auth and allowed assignments, but these checks do not defend against unrestricted direct writes to `profiles.role`; database grants are the security boundary.
- `/auth/callback` previously accepted a `next` parameter starting with `//`, which could redirect to an external origin. This is fixed in the proposed branch through `safeNextPath` (needs Preview verification).
- Registration previously required birthday day/month for all new members. The proposed UI makes them optional, stores no birth year, and avoids broadcasting birthdays by default if omitted.
- Preview OAuth redirect URLs and Android Google OAuth return must be tested separately from browser email/password. A working web login is not proof of a working native callback.
- Prior repo audit reported 12 npm dependency findings, but that count has not been reverified here. Run `npm audit --omit=dev` and `npm audit` with exact advisories and affected package versions.
- No full security penetration test, member-data export, two-member isolation run, live E2EE trial or live role-change exploit test was performed. Existing documentation's claims should be treated as provisional.

## Redesign decisions

- Keep the original burgundy, near-black and gold palette — no blue recoloring.
- Keep a public ministry homepage. Do not turn the community site into a ChatGPT-like chat landing page.
- Use translucent burgundy glass cards with near-opaque backgrounds for readable text, a compact logo/header and a single mobile menu.
- Present Teachings, Library, Gatherings and Connect as the principal public destinations. Render actual pinned notices and meeting records only; never invent dates to fill empty space.
- Keep the role-specific member links and existing notice functionality; display six primary member tools, put the remaining tools and leadership management behind accessible disclosure controls.
- Reduce the sign-in/registration explanation; preserve email/password and Google OAuth; avoid duplicate lengthy headers; keep optional birthday out of the primary registration form.

## Safe remediation sequence

1. **Immediate:** Backup schema/policies and verify owner role is recoverable; stage and review a restricted profile-access migration in a disposable Supabase project, including trigger and callback changes.
2. **Then:** Test that normal members cannot change `role` or read anonymous profile PII; test directory access, native/web signup, and two-user membership isolation.
3. Restrict group-chat RLS to actual membership and resource permissions. Fix privileged function grants and search_path.
4. Audit stored media permissions, unpublished posts, message-access promises and signup settings; re-run Supabase security advisor.
5. Run browser/Android OAuth and recovery tests; review dependencies, CSRF-sensitive actions, rate limiting, push tokens, and E2EE key management.
6. Only after these pass should the design branch be promoted to Production.

**Do not apply the SQL template in `supabase/rls-policies.sql` blindly.** Its role/view definitions and schema assumptions need to be reconciled against live permissions, existing data, trigger behavior and the login callback.

## Preview environment note
The first design Preview build passed the static checks and TypeScript compilation but failed during Next.js prerendering because Vercel has **no Preview Supabase variables** (`NEXT_PUBLIC_SUPABASE_URL` or publishable/anon key). Production has these variables, but copying them would point Preview to live member data and is intentionally avoided. The design branch now renders public pages with empty real-data sections and marks member authentication unavailable when no test backend exists. The reserved `.invalid` endpoint is a safe fail-closed build fallback, not a working Supabase project. A truly functional Preview requires a separate Supabase test project with test user accounts, schema/policies and Preview-only environment configuration.

## Implementation verification — November 6, 2026

**Database: LIVE Supabase project `jngbhejfqbyjletfknkh` (committed Supabase migrations; no database member rows rewritten).**

Completed and confirmed:
- Anonymous `public.profiles` SELECT and other anonymous table privileges are revoked. Removed the permissive `USING (true)` PUBLIC profile-read policy. An authenticated member-directory SELECT policy remains temporarily so existing directory, recipient and staff views do not break.
- Recreated own-profile UPDATE policy as `TO authenticated`, with explicit owner `USING` and `WITH CHECK`.
- Added non-privileged `BEFORE UPDATE` trigger to reject client changes to `profiles.role`, `level`, `id` and `created_at`. Existing Google callback may upsert the unchanged role; the trigger allows unchanged values and still protects role changes. Service-role administrative changes remain possible. **Future:** refactor the Production callback and revoke all client column-level writes to role/level once production code has been deployed and end-to-end tested.
- Chat messages under `group:<UUID>` now require active membership from `citizen_group_members`/active `citizen_groups`, or an authorized ministry leadership role. `study-resource:<UUID>` requires a published public resource or an authorized leadership role. General and study-general rooms remain available to members. Strict canonical UUID validation prevents malformed identifiers from causing casts.
- Revoked anonymous/authenticated EXECUTE on internal `handle_new_user`, `rls_auto_enable` and profile guard functions. Fixed `handle_new_user` function search path.
- Revoked `TRUNCATE`, `TRIGGER` and `REFERENCES` from **all existing** `public` tables for browser roles. These dangerous grants are not protected by row-level security. Normal authenticated profile SELECT/UPDATE and chat SELECT/INSERT remain granted.
- Adjusted default `postgres` ownership ACL for new public tables/functions to avoid those privileges by default. The separate `supabase_admin` creator's defaults remain provider-managed and should be reviewed through a supported platform administrative route.

Structural backups before migrations:
- `docs/security/kingdom-permissions-before-fix-20261106.json`
- `docs/security/kingdom-legacy-table-privileges-before-revocation.json`

**Verification results:** `has_table_privilege('anon','public.profiles','SELECT') = false`; no remaining public table grants for client `TRUNCATE/TRIGGER/REFERENCES`; no anonymous/authenticated EXECUTE on reviewed internal definer functions; both chat policies contain strict UUID checks. Profile count **11**, with **2 owners** and **2 admins**, unchanged. Supabase's security advisor now reports only six intentional/unknown RLS-enabled tables with no policies (INFO) and leaked-password protection disabled (WARN).

**Outstanding security/functionality gates:** A two-member end-to-end test with test identities is still needed for permission denial, normal signup and Google callback, private messaging, group membership, storage and recovery. Existing authenticated members can still query full `profiles` data for other members; replacing this with a privacy-safe directory requires coordinated UI changes and dedicated member views. Six RLS-without-policy tables require an intended-access review; do not add broad policies blindly. Leaked-password protection must be enabled and validated in Supabase Auth settings. Owner/admin role changes must be verified after any callback refactor.

**Branding update:** The original user-approved image was imported without re-creation or design alteration. `public/kingdom-citizens-logo.png` and `public/logo.png` both have SHA256 `7c3b11e96fe1374c4f5472428b1a0e5ae9baebf05cf033c0050ec95dec66731c`. Generated PWA icons, Next.js favicon and social sharing image are derived from the same original. Header, homepage, authentication pages and PWA metadata use these assets. The release build checks byte identity before Preview publication.

**Release:** Database policy changes were applied LIVE with the user's authorization. Website/logo changes remain in draft PR #1; no merge or deployment to the Production website has occurred.

## Archived and expired content access: remediated on live database

A separate migration `restrict_expired_and_archived_public_posts_and_announcements_20261106` replaced the three overlapping `USING(true)` SELECT policies on both `app_posts` and `app_announcements`. Only non-archived/unexpired posts and announcements remain public. An author and authorized ministry leadership can still review their own or moderated archived records. Original policies were backed up at `docs/security/kingdom-post-announcement-policies-before-fix-20261106.json`.

**Verification:** 2 post rows remained, of which 1 is now eligible for public view and 1 expired row is excluded from the public policy. No announcement rows or authored records were modified. Both tables have precisely two intentional SELECT policies, no `USING(true)` read policy. Role-, archive-, membership-, storage- and authentication-sensitive functions still require two-account end-to-end tests.

**Final Supabase Advisor:** No formerly flagged SECURITY DEFINER function warnings remain. Outstanding:
- Six RLS-enabled tables without policies — informational until their usage is reconciled.
- Leaked-password protection remains disabled — must enable through Supabase Auth project settings.
- Authenticated clients still have broad `profiles` SELECT access to other member records to support the existing production member directory; this is a **remaining PII concern**, requiring a directory view/API and coordinated rollout. Password-manager-style protections or encryption claims must not be inferred from RLS alone.

**Release remains gated:** Real user signup, email/Google login, native OAuth callback, profile edits, nonmember denial for private rooms, and admin role-update flows have not been fully tested after the live migration. Preserve member data and avoid any untested Production site merge.
