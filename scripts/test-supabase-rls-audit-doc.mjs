import fs from 'node:fs'
import assert from 'node:assert/strict'

const doc = fs.readFileSync('docs/SUPABASE_RLS_AUDIT.md', 'utf8')

for (const phrase of [
  'Tables Inferred From Code',
  'Expected Access Policies',
  'Current App-Side Protection Found',
  'Service Role Usage',
  'High-Risk Gaps',
  'supabase/rls-policies.sql',
]) {
  assert.match(doc, new RegExp(phrase, 'i'))
}

console.log('PASS Supabase RLS audit doc exists')
