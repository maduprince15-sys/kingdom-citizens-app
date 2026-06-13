import fs from 'node:fs'
import assert from 'node:assert/strict'

const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')

assert.match(button, /signInWithOAuth/)
assert.match(button, /provider:\s*'google'/)
assert.match(button, /redirectTo:\s*`\$\{getURL\(\)\}auth\/callback`/)
assert.match(button, /Continue with Google/)

console.log('PASS web Google OAuth remains enabled')
