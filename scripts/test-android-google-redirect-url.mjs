import fs from 'node:fs'
import assert from 'node:assert/strict'

const nativeAuth = fs.readFileSync('lib/android-google-auth.ts', 'utf8')
const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')

assert.match(nativeAuth, /ANDROID_GOOGLE_REDIRECT_URL = 'kingdomcitizens:\/\/auth\/callback'/)
assert.match(nativeAuth, /redirectTo:\s*ANDROID_GOOGLE_REDIRECT_URL/)
assert.match(nativeAuth, /skipBrowserRedirect:\s*true/)
assert.doesNotMatch(button, /kingdom-citizens-app\.vercel\.app\/auth\/callback/)

console.log('PASS Android Google uses custom-scheme redirect')
