import fs from 'node:fs'
import assert from 'node:assert/strict'

const sql = fs.readFileSync('supabase/push-notifications.sql', 'utf8')

for (const phrase of [
  'create table if not exists public.user_push_tokens',
  'user_id uuid not null references auth.users',
  'token text not null',
  'unique(user_id, token)',
  'enable row level security',
  'user_id = auth.uid()',
]) {
  assert.match(sql, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

console.log('PASS push notification SQL template exists')
