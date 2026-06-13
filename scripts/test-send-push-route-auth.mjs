import fs from 'node:fs'
import assert from 'node:assert/strict'

const route = fs.readFileSync('app/api/notifications/send-push/route.ts', 'utf8')

assert.match(route, /auth\.getUser\(\)/)
assert.match(route, /Unauthorized/)
assert.match(route, /canPostAnnouncements/)
assert.match(route, /Forbidden/)
assert.match(route, /Only announcement push can be sent/)
assert.match(route, /sendPushToUsers/)
assert.doesNotMatch(route, /body\?\.userId|targetUserId/)
assert.doesNotMatch(route, /console\.(log|warn|error|info)/)

console.log('PASS send-push route requires auth and role checks')
