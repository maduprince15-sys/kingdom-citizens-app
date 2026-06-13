import fs from 'node:fs'
import assert from 'node:assert/strict'

const doc = fs.readFileSync('docs/APP_ORGANIZATION_AUDIT.md', 'utf8')

for (const phrase of [
  'Current Route Map',
  'Main Features',
  'Auth/Protected Route Map',
  'Role-Protected Sections',
  'Messy Areas Found',
  'Safe Cleanup Done',
  'Deferred Cleanup',
]) {
  assert.match(doc, new RegExp(phrase, 'i'))
}

console.log('PASS app organization audit doc exists')
