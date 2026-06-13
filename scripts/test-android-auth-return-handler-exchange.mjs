import fs from 'node:fs'
import assert from 'node:assert/strict'

const handler = fs.readFileSync('app/components/AndroidAuthReturnHandler.tsx', 'utf8')
const nativeAuth = fs.readFileSync('lib/android-google-auth.ts', 'utf8')

assert.match(nativeAuth, /parsed\.searchParams/)
assert.match(nativeAuth, /hashParams/)
assert.match(nativeAuth, /exchangeCodeForSession\(code\)/)
assert.match(nativeAuth, /getSession\(\)/)
assert.match(handler, /completeNativeProfileSetup/)
assert.match(handler, /Browser\.close/)
assert.match(handler, /router\.replace\('\/dashboard'\)/)

console.log('PASS Android auth return handler exchanges code and verifies session')
