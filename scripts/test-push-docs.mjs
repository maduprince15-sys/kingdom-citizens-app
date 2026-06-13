import fs from 'node:fs'
import assert from 'node:assert/strict'

const docs = fs.readFileSync('docs/PUSH_NOTIFICATIONS.md', 'utf8')

for (const phrase of [
  '@capacitor/push-notifications',
  'Firebase Cloud Messaging',
  'android/app/google-services.json',
  'supabase/push-notifications.sql',
  'Enable notifications',
  'New encrypted message',
  'Push sending is wired in code',
  'kingdom_citizens_default',
  '@capacitor/local-notifications',
]) {
  assert.match(docs, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
}

console.log('PASS push notification docs are present and truthful')
