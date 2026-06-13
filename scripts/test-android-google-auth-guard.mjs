import fs from 'node:fs'
import assert from 'node:assert/strict'

const runtime = fs.readFileSync('lib/mobile-runtime.ts', 'utf8')
const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')

assert.match(runtime, /typeof window === 'undefined'/)
assert.match(runtime, /isAndroidNativeApp/)
assert.match(runtime, /getPlatform\?\.\(\) === 'android'/)
assert.match(button, /isAndroidNativeApp/)
assert.match(button, /if \(androidNative\) return/)
assert.match(button, /Google sign-in in the Android app needs native return setup\. Use email login for now\./)

console.log('PASS android Google auth guard is present')
