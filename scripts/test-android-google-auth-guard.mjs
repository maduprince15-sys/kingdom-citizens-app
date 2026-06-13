import fs from 'node:fs'
import assert from 'node:assert/strict'

const runtime = fs.readFileSync('lib/mobile-runtime.ts', 'utf8')
const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')
const nativeAuth = fs.readFileSync('lib/android-google-auth.ts', 'utf8')

assert.match(runtime, /typeof window === 'undefined'/)
assert.match(runtime, /isAndroidNativeApp/)
assert.match(button, /startAndroidGoogleOAuth/)
assert.match(button, /appUrlOpen/)
assert.match(nativeAuth, /kingdomcitizens:\/\/auth\/callback/)
assert.match(nativeAuth, /exchangeCodeForSession/)
assert.doesNotMatch(button, /needs native return setup/)

console.log('PASS android Google auth uses native return flow')
