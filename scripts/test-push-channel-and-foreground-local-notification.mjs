import fs from 'node:fs'
import assert from 'node:assert/strict'

const manager = fs.readFileSync('app/components/PushNotificationManager.tsx', 'utf8')
const helper = fs.readFileSync('lib/firebase-admin-push.ts', 'utf8')

assert.match(manager, /CHANNEL_ID = 'kingdom_citizens_default'/)
assert.match(manager, /PushNotifications\.createChannel/)
assert.match(manager, /LocalNotifications\.createChannel/)
assert.match(manager, /pushNotificationReceived/)
assert.match(manager, /LocalNotifications\.schedule/)
assert.match(helper, /ANDROID_NOTIFICATION_CHANNEL_ID = 'kingdom_citizens_default'/)
assert.match(helper, /channelId:\s*ANDROID_NOTIFICATION_CHANNEL_ID/)

console.log('PASS push channel and foreground local notification are wired')
