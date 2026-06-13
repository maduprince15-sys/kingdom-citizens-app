import fs from 'node:fs'
import assert from 'node:assert/strict'

const nativeAuth = fs.readFileSync('lib/android-google-auth.ts', 'utf8')
const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')

assert.match(nativeAuth, /ANDROID_GOOGLE_REDIRECT_URL = 'kingdomcitizens:\/\/auth\/callback'/)
assert.match(nativeAuth, /skipBrowserRedirect:\s*true/)
assert.match(nativeAuth, /@capacitor\/browser/)
assert.match(nativeAuth, /exchangeCodeForSession\(code\)/)
assert.match(nativeAuth, /getSession\(\)/)
assert.match(nativeAuth, /\/api\/auth\/native-profile/)
assert.match(button, /appUrlOpen/)
assert.match(button, /getLaunchUrl/)
assert.match(button, /router\.replace\('\/dashboard'\)/)

console.log('PASS Android Google auth native return flow is wired')
