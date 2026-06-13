import fs from 'node:fs'
import assert from 'node:assert/strict'

const route = fs.readFileSync('app/api/messages/send/route.ts', 'utf8')
const push = fs.readFileSync('lib/push-notifications.ts', 'utf8')

assert.match(route, /sendPrivateMessagePush/)
assert.match(push, /title:\s*'Kingdom Citizens'/)
assert.match(push, /body:\s*'New encrypted message'/)
assert.match(push, /type:\s*'private_message'/)
assert.match(push, /href:\s*'\/messages'/)
assert.doesNotMatch(push, /encryptedBody|plaintext|subject/)

console.log('PASS message send triggers privacy-safe push')
