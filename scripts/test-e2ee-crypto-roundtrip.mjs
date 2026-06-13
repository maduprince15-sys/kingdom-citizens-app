import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { webcrypto } from 'node:crypto'
import assert from 'node:assert/strict'
import ts from 'typescript'

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto
}
globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64')
globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary')

const source = fs.readFileSync('lib/e2ee/crypto.ts', 'utf8')
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kc-e2ee-'))
const modulePath = path.join(tmp, 'crypto.mjs')
fs.writeFileSync(modulePath, js)

const mod = await import(pathToFileURL(modulePath).href)
const { key } = await mod.generateAesGcmKey()
const payload = await mod.encryptMessageText({ plaintext: 'Grace and peace', key })
const decrypted = await mod.decryptMessageText({ payload, key })

assert.equal(decrypted, 'Grace and peace')
assert.notEqual(payload.ciphertext, 'Grace and peace')
assert.equal(payload.algorithm, 'AES-GCM')
assert.equal(payload.version, 1)
assert.ok(payload.iv.length > 0)

console.log('PASS E2EE crypto roundtrip works')
