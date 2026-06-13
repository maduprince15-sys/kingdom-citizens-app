# App Organization Audit

## Current Route Map

Public/landing:

- `/`
- `/public/announcements`
- `/public/books`
- `/public/connect`
- `/public/contact`
- `/public/giving`
- `/public/meetings`
- `/public/posts`
- `/display/announcements`
- `/display/notice-board`

Auth/account:

- `/login`
- `/register`
- `/forgot-password`
- `/update-password`
- `/auth/callback`
- `/account/delete`

Protected member app:

- `/dashboard`
- `/announcements`
- `/posts`
- `/prayers`
- `/birthdays`
- `/books`
- `/calendar`
- `/chat`
- `/connect`
- `/groups`
- `/meetings`
- `/members`
- `/messages`
- `/messages/new`
- `/messages/sent`
- `/messages/[id]`
- `/my-records`
- `/notifications`
- `/profile`
- `/study`
- `/study/[id]`
- `/study/bible`
- `/study/discussion`
- `/study/progress`

Admin/protected operations:

- `/admin/book-access`
- `/admin/books`
- `/admin/calendar`
- `/admin/connect`
- `/admin/contact-messages`
- `/admin/giving`
- `/admin/groups`
- `/admin/meetings`
- `/admin/member-records`
- `/admin/study`

API routes:

- account/auth: `/api/account/delete`, `/api/auth/native-profile`
- admin: `/api/admin/delete-user`, `/api/admin/update-role`
- announcements/posts: `/api/announcements/*`, `/api/posts/*`
- books/calendar/chat/messages: `/api/books/download`, `/api/calendar/ics`, `/api/chat/delete`, `/api/messages/send`, `/api/messages/archive`

## Main Features

- Supabase Auth with email/password and Google OAuth.
- Member dashboard and profile.
- Roles: owner, admin, finance, moderator, teacher, member.
- Announcements, posts, comments, reactions, prayers.
- Private messages and group chat.
- Study center and progress.
- Meetings/calendar.
- Books and book access.
- Giving options and member activity records.
- Public content pages.
- Capacitor Android hosted APK shell.

## Auth/Protected Route Map

Protected pages call `supabase.auth.getUser()` and redirect to `/login` when no user exists. Public pages either use anonymous Supabase reads or no auth.

Most admin pages load the current user's profile role and redirect to `/dashboard` when unauthorized. `app/admin/AdminGuard.tsx` exists for owner/admin-only pages, but several admin pages still repeat their own role checks.

## Role-Protected Sections

- owner/admin: member role management, book access, some admin guard areas
- owner only: delete users through the UI/API helper
- admin/finance: giving management
- admin/moderator: calendar, meetings, moderation
- admin/teacher: study resources
- admin/teacher/moderator: announcements and posts creation
- member: normal protected app access

## Messy Areas Found

- Admin route guards are repeated across pages instead of using one generalized role guard.
- Public and protected content pages duplicate some query/rendering concepts.
- Dashboard contains role-specific copy inline instead of using a compact role-summary helper.
- Message role rules were split between page/API code.
- Android auth was previously guarded rather than wired through a native return path.
- RLS policy source files were missing from the repo.
- E2EE was an honest foundation, but docs/tests needed stronger truth labeling for legacy plaintext.

## Safe Cleanup Done

- Centralized message role constants and helpers in `lib/permissions.ts`.
- Aligned delete-user API with centralized `canDeleteUsers`.
- Added `lib/mobile-runtime.ts` for native runtime detection.
- Added `lib/android-google-auth.ts` for native Google OAuth handling.
- Added `app/api/auth/native-profile/route.ts` for server-verified native profile setup.
- Added Android deep-link intent filter.
- Added organization, RLS, Android auth, E2EE, and security docs.
- Added tests covering route map docs, native Google auth, RLS docs/SQL, security guards, and E2EE truth.

## Deferred Cleanup

- Replace repeated admin page role checks with a shared `requireRole` helper.
- Split large dashboard role copy into small data-driven helpers.
- Consider shared components for public/protected content cards.
- Add real Supabase integration tests against a disposable project.
- Add production multi-device E2EE key management.
- Add verified Android App Links.
