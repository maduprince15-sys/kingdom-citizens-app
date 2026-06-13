import fs from 'node:fs'
import assert from 'node:assert/strict'

const helper = fs.readFileSync('lib/firebase-admin-push.ts', 'utf8')
const push = fs.readFileSync('lib/push-notifications.ts', 'utf8')

assert.match(helper, /notification:\s*{[\s\S]*title:\s*input\.title[\s\S]*body:\s*input\.body/)
assert.match(helper, /data:\s*input\.data/)
assert.match(helper, /priority:\s*'high'/)
assert.match(helper, /channelId:\s*ANDROID_NOTIFICATION_CHANNEL_ID/)
assert.match(push, /type:\s*'private_message'/)
assert.match(push, /href:\s*'\/messages'/)

console.log('PASS FCM sends notification plus data with high Android priority')
