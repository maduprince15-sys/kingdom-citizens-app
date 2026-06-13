import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const offenders = []
const sensitive = /(SUPABASE_SERVICE_ROLE_KEY|service_role|password|token|encryptedBody|bodyData|message\.body|private key)/i

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'out', 'android'].includes(entry.name)) continue
      walk(full)
      continue
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue
    const source = fs.readFileSync(full, 'utf8')
    source.split(/\r?\n/).forEach((line, index) => {
      if (/console\.(log|warn|error|info)/.test(line) && sensitive.test(line)) {
        offenders.push(`${full.replaceAll('\\', '/')}:${index + 1}`)
      }
    })
  }
}

walk('app')
walk('lib')

assert.deepEqual(offenders, [])
console.log('PASS no obvious sensitive console logging found')
