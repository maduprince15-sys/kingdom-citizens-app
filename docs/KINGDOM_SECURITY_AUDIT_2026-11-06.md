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
