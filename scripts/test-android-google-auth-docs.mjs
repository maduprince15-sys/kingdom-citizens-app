import fs from 'node:fs'
import assert from 'node:assert/strict'

const doc = fs.readFileSync('docs/ANDROID_GOOGLE_AUTH.md', 'utf8')

assert.match(doc, /Capacitor Android app/)
assert.match(doc, /native return setup/)
assert.match(doc, /email login/i)
assert.match(doc, /signInWithOAuth/)
assert.match(doc, /auth\/callback/)
assert.match(doc, /deep-link/i)

console.log('PASS Android Google auth docs explain current behavior')
