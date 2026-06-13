import fs from 'node:fs'
import assert from 'node:assert/strict'

const helper = fs.readFileSync('lib/firebase-admin-push.ts', 'utf8')

assert.match(helper, /import 'server-only'/)
assert.match(helper, /firebase-admin\/app/)
assert.match(helper, /firebase-admin\/messaging/)
assert.match(helper, /FIREBASE_SERVICE_ACCOUNT_JSON/)
assert.match(helper, /FIREBASE_PROJECT_ID/)
assert.match(helper, /FIREBASE_CLIENT_EMAIL/)
assert.match(helper, /FIREBASE_PRIVATE_KEY/)
assert.match(helper, /replace\(\/\\\\n\/g,\s*'\\n'\)/)
assert.match(helper, /isFirebasePushConfigured/)
assert.match(helper, /sendPushToToken/)
assert.match(helper, /sendPushToTokens/)
assert.match(helper, /getApps\(\)\[0\]/)

console.log('PASS Firebase Admin push helper is configured')
