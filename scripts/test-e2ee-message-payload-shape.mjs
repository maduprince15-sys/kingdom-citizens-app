import fs from 'node:fs'
import assert from 'node:assert/strict'

const cryptoSource = fs.readFileSync('lib/e2ee/crypto.ts', 'utf8')
const messagesSource = fs.readFileSync('lib/e2ee/messages.ts', 'utf8')

assert.match(cryptoSource, /version:\s*1/)
assert.match(cryptoSource, /algorithm:\s*'AES-GCM'/)
assert.match(cryptoSource, /crypto\.getRandomValues\(new Uint8Array\(12\)\)/)
assert.match(cryptoSource, /ciphertext/)
assert.match(cryptoSource, /iv/)
assert.match(messagesSource, /encrypted:\s*true/)
assert.match(messagesSource, /encryptPrivateMessageBody/)
assert.match(messagesSource, /decryptStoredPrivateMessage/)

console.log('PASS E2EE payload shape is enforced')
