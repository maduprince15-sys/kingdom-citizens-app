import fs from 'node:fs'
import assert from 'node:assert/strict'

const doc = fs.readFileSync('docs/SECURITY_AUDIT.md', 'utf8')

for (const phrase of [
  'High-Risk Findings Fixed',
  'Medium-Risk Findings Fixed',
  'Deferred Security Work',
  'app_messages.body',
  'service role key',
  'no group chat E2EE',
]) {
  assert.match(doc, new RegExp(phrase.replaceAll('.', '\\.'), 'i'))
}

console.log('PASS security audit doc is present')
