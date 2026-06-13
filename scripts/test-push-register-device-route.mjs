import fs from 'node:fs'
import assert from 'node:assert/strict'

const route = fs.readFileSync('app/api/notifications/register-device/route.ts', 'utf8')

assert.match(route, /auth\.getUser\(\)/)
assert.match(route, /Unauthorized/)
assert.match(route, /user_id:\s*user\.id/)
assert.match(route, /user_push_tokens/)
assert.match(route, /onConflict:\s*'user_id,token'/)
assert.doesNotMatch(route, /body\?\.userId|userId/)
assert.doesNotMatch(route, /console\.(log|warn|error|info)/)

console.log('PASS push token registration route is user-bound and token-safe')
