import fs from 'node:fs'
import assert from 'node:assert/strict'

const doc = fs.readFileSync('docs/APP_ORGANIZATION_AUDIT.md', 'utf8')

for (const route of [
  '/dashboard',
  '/messages/[id]',
  '/admin/giving',
  '/public/contact',
  '/api/messages/send',
  '/api/auth/native-profile',
]) {
  assert.match(doc, new RegExp(route.replaceAll('/', '\\/').replace('[', '\\[').replace(']', '\\]')))
}

console.log('PASS route map doc covers core routes')
