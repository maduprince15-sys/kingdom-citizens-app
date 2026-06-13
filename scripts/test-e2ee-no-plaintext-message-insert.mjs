import fs from 'node:fs'
import assert from 'node:assert/strict'

const form = fs.readFileSync('app/messages/new/MessageForm.tsx', 'utf8')
const route = fs.readFileSync('app/api/messages/send/route.ts', 'utf8')

assert.match(form, /encryptPrivateMessageBody/)
assert.match(form, /encryptedBody/)
assert.doesNotMatch(form, /body:\s*cleanBody/)
assert.doesNotMatch(route, /bodyData\?\.body/)
assert.match(route, /isEncryptedMessageBody\(encryptedBody\)/)
assert.match(route, /body:\s*encryptedBody/)

console.log('PASS private message API no longer accepts plaintext body inserts')
