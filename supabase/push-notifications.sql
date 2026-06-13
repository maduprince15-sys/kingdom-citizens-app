-- Kingdom Citizens Android push notification token storage.
-- Review and apply in Supabase before enabling push registration in production.

create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null,
  device_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz,
  unique(user_id, token)
);

alter table public.user_push_tokens enable row level security;

drop policy if exists "push tokens own read" on public.user_push_tokens;
create policy "push tokens own read"
on public.user_push_tokens for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "push tokens own insert" on public.user_push_tokens;
create policy "push tokens own insert"
on public.user_push_tokens for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "push tokens own update" on public.user_push_tokens;
create policy "push tokens own update"
on public.user_push_tokens for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "push tokens own delete" on public.user_push_tokens;
create policy "push tokens own delete"
on public.user_push_tokens for delete
to authenticated
using (user_id = auth.uid());

create index if not exists user_push_tokens_user_id_idx
on public.user_push_tokens(user_id);

