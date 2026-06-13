import fs from 'node:fs'
import assert from 'node:assert/strict'

const component = fs.readFileSync('app/messages/EncryptedMessageText.tsx', 'utf8')
const docs = fs.readFileSync('docs/E2EE_MESSAGES.md', 'utf8')

assert.match(component, /Legacy plaintext/)
assert.match(component, /Legacy plaintext message/)
assert.match(docs, /Legacy Plaintext/)
assert.match(docs, /No silent migration/)

console.log('PASS legacy plaintext messages are labeled and documented')
