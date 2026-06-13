# Supabase RLS Audit

This repo does not contain a complete migration history or live Supabase dashboard export, so database RLS cannot be proven from local files alone. `supabase/rls-policies.sql` provides policy templates to review and apply manually.

## Tables Inferred From Code

- `profiles`
- `app_messages`
- `notifications`
- `app_announcements`
- `app_posts`
- `app_post_comments`
- `app_post_reactions`
- `chat_messages`
- `prayer_requests`
- `study_resources`
- `study_progress`
- `books`
- `book_access`
- `calendar_events`
- `meetings`
- `giving_options`
- `member_activity_records`
- `citizen_groups`
- `citizen_group_members`
- `public_contact_messages`
- `social_links`
- `projects`

Storage buckets inferred:

- `content-media`
- `book-covers`
- `book-pdfs`
- `profile-photos`

## Expected Access Policies

Profiles:

- user reads own profile
- authenticated members may read limited member directory fields if intended
- owner/admin manage permitted member data
- only owner/admin role APIs can change roles
- users cannot promote themselves

Messages:

- sender/recipient only can read encrypted message rows
- sender can create as self
- sender/recipient can update only their own archive/read state
- no outside user can read message ciphertext

Notifications:

- user reads and updates own notifications
- trusted server/admin creates notifications
- user cannot read another user's notifications

Giving/finance/member records:

- user reads own records when appropriate
- finance/admin/owner manage finance records
- normal members cannot read all giving/member activity records

Announcements/posts:

- public/member read as intended
- admin/teacher/moderator create where intended
- delete/update restricted to author or moderator roles as intended

Contact messages:

- public can create
- admin/moderator/owner can read/manage

Study:

- authenticated members can read resources
- admin/teacher manage resources
- user reads/writes own progress

Groups:

- authenticated members can read groups/memberships as intended
- admin/moderator/teacher manage group membership

Books:

- public/member reads book catalog as intended
- owner/admin manage books and book access
- downloads require approved `book_access` or admin/owner role

## Current App-Side Protection Found

- Authenticated server pages and API routes use `supabase.auth.getUser()`.
- Privileged API routes load profile role before writes.
- Role updates reject self-editing and invalid roles.
- User deletion is owner-only and blocks owner/admin targets.
- Message APIs constrain operations to sender/recipient.
- Native profile setup verifies a Supabase access token server-side before service-role upsert.

## Service Role Usage

Server-only service role is used in:

- `app/api/admin/update-role/route.ts`
- `app/api/admin/delete-user/route.ts`
- `app/api/announcements/create/route.ts`
- `app/api/announcements/delete/route.ts`
- `app/api/posts/create/route.ts`
- `app/api/posts/delete/route.ts`
- `app/api/messages/send/route.ts` for notification creation
- `app/api/auth/native-profile/route.ts`

The service role must never be exposed to browser code.

## High-Risk Gaps

- Live RLS status is unknown from this repo.
- Client-side admin forms directly mutate some admin-managed tables; those tables need strict RLS.
- Storage bucket policies are unknown.
- Public contact insert policy must allow insert without allowing public reads.
- `profiles` policy must prevent client-side role self-escalation.

## SQL Policies

Review and apply:

```text
supabase/rls-policies.sql
```

The SQL is intentionally a template. Confirm column names and intended public visibility in Supabase before applying.
