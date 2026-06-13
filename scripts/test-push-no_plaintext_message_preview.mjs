import fs from 'node:fs'
import assert from 'node:assert/strict'

const sendRoute = fs.readFileSync('app/api/messages/send/route.ts', 'utf8')
const docs = fs.readFileSync('docs/PUSH_NOTIFICATIONS.md', 'utf8')

assert.match(sendRoute, /New encrypted message/)
assert.doesNotMatch(sendRoute, /message:\s*subject/)
assert.doesNotMatch(sendRoute, /message:\s*encryptedBody/)
assert.doesNotMatch(sendRoute, /message:\s*body/)
assert.match(docs, /Private message pushes must not reveal encrypted message text/)

console.log('PASS push/private-message notifications do not preview plaintext')
