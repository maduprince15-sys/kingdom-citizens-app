import fs from 'node:fs'
import assert from 'node:assert/strict'

const dashboard = fs.readFileSync('app/dashboard/page.tsx', 'utf8')
const manager = fs.readFileSync('app/components/PushNotificationManager.tsx', 'utf8')

assert.match(dashboard, /PushNotificationManager/)
assert.match(manager, /@capacitor\/push-notifications/)
assert.match(manager, /requestPermissions/)
assert.match(manager, /PushNotifications\.register/)
assert.match(manager, /Enable notifications/)
assert.match(manager, /Notifications blocked in Android settings/)
assert.match(manager, /DENIED_STORAGE_KEY/)

console.log('PASS push notification manager is mounted and permission-aware')
