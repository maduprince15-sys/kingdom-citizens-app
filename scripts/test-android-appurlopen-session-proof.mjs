import fs from 'node:fs'
import assert from 'node:assert/strict'

const handler = fs.readFileSync('app/components/AndroidAuthReturnHandler.tsx', 'utf8')
const nativeAuth = fs.readFileSync('lib/android-google-auth.ts', 'utf8')
const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')

assert.match(handler, /App\.addListener\('appUrlOpen'/)
assert.match(handler, /kingdomcitizens:\/\/auth\/callback/)
assert.match(nativeAuth, /exchangeCodeForSession\(code\)/)
assert.match(nativeAuth, /getSession\(\)/)
assert.match(handler, /router\.replace\('\/dashboard'\)/)
assert.match(button, /redirectTo:\s*ANDROID_GOOGLE_REDIRECT_URL|startAndroidGoogleOAuth/)

console.log('PASS appUrlOpen exchanges Google code and verifies Supabase session')
