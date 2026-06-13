import fs from 'node:fs'
import assert from 'node:assert/strict'

const messageRoute = fs.readFileSync('app/api/messages/send/route.ts', 'utf8')
const push = fs.readFileSync('lib/push-notifications.ts', 'utf8')

assert.match(push, /New encrypted message/)
assert.doesNotMatch(push, /bodyData|encryptedBody|senderName|subject/)
assert.doesNotMatch(messageRoute, /sendPrivateMessagePush\([^)]*encryptedBody/s)
assert.doesNotMatch(messageRoute, /sendPrivateMessagePush\([^)]*subject/s)
assert.doesNotMatch(messageRoute, /sendPrivateMessagePush\([^)]*senderName/s)

console.log('PASS private message push payload excludes plaintext and private metadata')
