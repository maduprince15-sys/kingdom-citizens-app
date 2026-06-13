import fs from 'node:fs'
import assert from 'node:assert/strict'

const layout = fs.readFileSync('app/layout.tsx', 'utf8')
const handler = fs.readFileSync('app/components/AndroidAuthReturnHandler.tsx', 'utf8')
const button = fs.readFileSync('app/components/GoogleLoginButton.tsx', 'utf8')

assert.match(layout, /AndroidAuthReturnHandler/)
assert.match(handler, /appUrlOpen/)
assert.match(handler, /getLaunchUrl/)
assert.match(handler, /kingdomcitizens:\/\/auth\/callback/)
assert.doesNotMatch(button, /App\.addListener\('appUrlOpen'/)

console.log('PASS Android auth return handler is mounted globally')
