import fs from 'node:fs'
import assert from 'node:assert/strict'

const route = fs.readFileSync('app/api/messages/send/route.ts', 'utf8')

assert.match(route, /New encrypted message/)
assert.doesNotMatch(route, /message:\s*`/)
assert.doesNotMatch(route, /message:\s*subject/)
assert.doesNotMatch(route, /message:\s*encryptedBody/)

console.log('PASS message notifications do not preview private content')
