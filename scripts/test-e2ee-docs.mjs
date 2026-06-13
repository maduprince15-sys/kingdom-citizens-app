import fs from 'node:fs'
import assert from 'node:assert/strict'

const doc = fs.readFileSync('docs/E2EE_MESSAGES.md', 'utf8')

for (const phrase of [
  'New private messages',
  'AES-GCM',
  'Visible metadata',
  'not full production multi-device E2EE',
  'Legacy plaintext messages',
  'Group chat messages',
]) {
  assert.match(doc, new RegExp(phrase, 'i'))
}

console.log('PASS E2EE docs describe implementation and limits')
