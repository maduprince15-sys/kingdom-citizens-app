import fs from 'node:fs'
import assert from 'node:assert/strict'

const sql = fs.readFileSync('supabase/rls-policies.sql', 'utf8')

for (const phrase of [
  'enable row level security',
  'public.app_messages',
  'messages participants read',
  'sender_id = auth.uid()',
  'recipient_id = auth.uid()',
  'public.profiles',
  'current_profile_role',
  'public_contact_messages',
]) {
  assert.match(sql, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

console.log('PASS Supabase RLS SQL template is present')
