import fs from 'node:fs'
import assert from 'node:assert/strict'

const doc = fs.readFileSync('docs/SECURITY_AUDIT.md', 'utf8')

for (const phrase of [
  'Fixed high risk issues',
  'Fixed medium risk issues',
  'Deferred or still visible',
  'app_messages.body',
  'service role key',
  'Group chat messages remain plaintext',
]) {
  assert.match(doc, new RegExp(phrase.replaceAll('.', '\\.'), 'i'))
}

console.log('PASS security audit doc is present')
