import fs from 'node:fs'
import assert from 'node:assert/strict'

const helper = fs.readFileSync('lib/firebase-admin-push.ts', 'utf8')
const service = fs.readFileSync('lib/push-notifications.ts', 'utf8')

assert.match(helper, /registration-token-not-registered/)
assert.match(helper, /invalid-registration-token/)
assert.match(helper, /invalidTokens/)
assert.match(service, /\.delete\(\)/)
assert.match(service, /\.in\('token', result\.invalidTokens\)/)

console.log('PASS invalid push token handling is present')
