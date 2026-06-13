import fs from 'node:fs'
import assert from 'node:assert/strict'

const docs = fs.readFileSync('docs/PUSH_NOTIFICATIONS.md', 'utf8')

for (const phrase of [
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'Vercel Environment Variables',
  'google-services.json',
]) {
  assert.match(docs, new RegExp(phrase, 'i'))
}

console.log('PASS push docs explain Firebase env vars')
