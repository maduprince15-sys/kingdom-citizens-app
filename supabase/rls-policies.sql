-- Kingdom Citizens RLS policy templates.
-- Review in Supabase SQL editor before applying. These policies assume public schema
-- table names inferred from the app code.

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_profile_role_in(roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() = any(roles), false)
$$;

alter table if exists public.profiles enable row level security;
alter table if exists public.app_messages enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.app_announcements enable row level security;
alter table if exists public.app_posts enable row level security;
alter table if exists public.app_post_comments enable row level security;
alter table if exists public.app_post_reactions enable row level security;
alter table if exists public.chat_messages enable row level security;
alter table if exists public.prayer_requests enable row level security;
alter table if exists public.study_resources enable row level security;
alter table if exists public.study_progress enable row level security;
alter table if exists public.books enable row level security;
alter table if exists public.book_access enable row level security;
alter table if exists public.calendar_events enable row level security;
alter table if exists public.meetings enable row level security;
alter table if exists public.giving_options enable row level security;
alter table if exists public.member_activity_records enable row level security;
alter table if exists public.citizen_groups enable row level security;
alter table if exists public.citizen_group_members enable row level security;
alter table if exists public.public_contact_messages enable row level security;
alter table if exists public.social_links enable row level security;
alter table if exists public.projects enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_profile_role_in(array['owner','admin','finance','moderator','teacher']));

drop policy if exists "profiles update own non-role fields" on public.profiles;
create policy "profiles update own non-role fields"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
-- IMPORTANT: enforce role immutability with column privileges or a trigger.
-- RLS alone cannot restrict individual columns in this policy.

drop policy if exists "messages participants read" on public.app_messages;
create policy "messages participants read"
on public.app_messages for select
to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "messages sender insert self" on public.app_messages;
create policy "messages sender insert self"
on public.app_messages for insert
to authenticated
with check (sender_id = auth.uid());

drop policy if exists "messages participants update own state" on public.app_messages;
create policy "messages participants update own state"
on public.app_messages for update
to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid())
with check (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "announcements read active" on public.app_announcements;
create policy "announcements read active"
on public.app_announcements for select
to anon, authenticated
using (coalesce(is_archived, false) = false);

drop policy if exists "announcements privileged write" on public.app_announcements;
create policy "announcements privileged write"
on public.app_announcements for all
to authenticated
using (public.current_profile_role_in(array['owner','admin','moderator','teacher']))
with check (public.current_profile_role_in(array['owner','admin','moderator','teacher']));

drop policy if exists "posts read active" on public.app_posts;
create policy "posts read active"
on public.app_posts for select
to anon, authenticated
using (coalesce(is_archived, false) = false);

drop policy if exists "posts privileged write" on public.app_posts;
create policy "posts privileged write"
on public.app_posts for all
to authenticated
using (public.current_profile_role_in(array['owner','admin','moderator','teacher']))
with check (public.current_profile_role_in(array['owner','admin','moderator','teacher']));

drop policy if exists "comments public insert authenticated or anon" on public.app_post_comments;
create policy "comments public insert authenticated or anon"
on public.app_post_comments for insert
to anon, authenticated
with check (true);

drop policy if exists "comments read" on public.app_post_comments;
create policy "comments read"
on public.app_post_comments for select
to anon, authenticated
using (true);

drop policy if exists "comments owner or moderator delete" on public.app_post_comments;
create policy "comments owner or moderator delete"
on public.app_post_comments for delete
to authenticated
using (author_id = auth.uid() or public.current_profile_role_in(array['owner','admin','moderator']));

drop policy if exists "chat authenticated read" on public.chat_messages;
create policy "chat authenticated read"
on public.chat_messages for select
to authenticated
using (true);

drop policy if exists "chat sender insert self" on public.chat_messages;
create policy "chat sender insert self"
on public.chat_messages for insert
to authenticated
with check (sender_id = auth.uid());

drop policy if exists "chat sender or moderator update" on public.chat_messages;
create policy "chat sender or moderator update"
on public.chat_messages for update
to authenticated
using (sender_id = auth.uid() or public.current_profile_role_in(array['owner','admin','moderator']))
with check (sender_id = auth.uid() or public.current_profile_role_in(array['owner','admin','moderator']));

drop policy if exists "study resources read" on public.study_resources;
create policy "study resources read"
on public.study_resources for select
to authenticated
using (true);

drop policy if exists "study resources admin teacher manage" on public.study_resources;
create policy "study resources admin teacher manage"
on public.study_resources for all
to authenticated
using (public.current_profile_role_in(array['owner','admin','teacher']))
with check (public.current_profile_role_in(array['owner','admin','teacher']));

drop policy if exists "study progress own" on public.study_progress;
create policy "study progress own"
on public.study_progress for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "member records own or staff read" on public.member_activity_records;
create policy "member records own or staff read"
on public.member_activity_records for select
to authenticated
using (member_id = auth.uid() or public.current_profile_role_in(array['owner','admin','finance','moderator','teacher']));

drop policy if exists "member records staff write" on public.member_activity_records;
create policy "member records staff write"
on public.member_activity_records for insert
to authenticated
with check (public.current_profile_role_in(array['owner','admin','finance','moderator','teacher']));

drop policy if exists "giving read public options" on public.giving_options;
create policy "giving read public options"
on public.giving_options for select
to anon, authenticated
using (true);

drop policy if exists "giving finance manage" on public.giving_options;
create policy "giving finance manage"
on public.giving_options for all
to authenticated
using (public.current_profile_role_in(array['owner','admin','finance']))
with check (public.current_profile_role_in(array['owner','admin','finance']));

drop policy if exists "contact public insert" on public.public_contact_messages;
create policy "contact public insert"
on public.public_contact_messages for insert
to anon, authenticated
with check (true);

drop policy if exists "contact staff read manage" on public.public_contact_messages;
create policy "contact staff read manage"
on public.public_contact_messages for all
to authenticated
using (public.current_profile_role_in(array['owner','admin','moderator']))
with check (public.current_profile_role_in(array['owner','admin','moderator']));

-- Repeat the same pattern for books, book_access, calendar_events, meetings,
-- citizen_groups, citizen_group_members, social_links, projects, prayer_requests,
-- and storage bucket policies after confirming the desired public visibility.
