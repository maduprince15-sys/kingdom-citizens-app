import fs from 'node:fs'
import assert from 'node:assert/strict'

const dashboard = fs.readFileSync('app/dashboard/page.tsx', 'utf8')
const manager = fs.readFileSync('app/components/PushNotificationManager.tsx', 'utf8')
const route = fs.readFileSync('app/api/notifications/register-device/route.ts', 'utf8')

assert.match(dashboard, /PushNotificationManager/)
assert.match(manager, /permission\.receive === 'granted'[\s\S]*setupPushRegistration/)
assert.match(manager, /addListener\('registration'/)
assert.match(manager, /registerToken\(value\)/)
assert.match(manager, /\/api\/notifications\/register-device/)
assert.match(route, /auth\.getUser\(\)/)
assert.match(route, /user_id:\s*user\.id/)
assert.doesNotMatch(route, /body\?\.userId|userId/)

console.log('PASS FCM token registers for the logged-in user after login')
