import fs from 'node:fs'
import assert from 'node:assert/strict'

const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8')

assert.match(manifest, /android\.permission\.POST_NOTIFICATIONS/)
assert.match(manifest, /android:scheme="kingdomcitizens"/)
assert.match(manifest, /android:host="auth"/)
assert.match(manifest, /android:pathPrefix="\/callback"/)

console.log('PASS Android manifest has POST_NOTIFICATIONS and deep link')
