import fs from 'node:fs'
import assert from 'node:assert/strict'

const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')

assert.match(button, /startAndroidGoogleOAuth/)
assert.match(button, /Continue with Google/)
assert.doesNotMatch(button, /needs native return setup/)
assert.doesNotMatch(button, /Use email login for now/)

console.log('PASS Google login button is enabled for Android native flow')
