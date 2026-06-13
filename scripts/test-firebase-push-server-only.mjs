import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const offenders = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue
    const normalized = full.replaceAll('\\', '/')
    const source = fs.readFileSync(full, 'utf8')
    if (
      source.includes('firebase-admin') &&
      normalized !== 'lib/firebase-admin-push.ts' &&
      normalized !== 'lib/push-notifications.ts' &&
      !normalized.startsWith('app/api/')
    ) {
      offenders.push(normalized)
    }
  }
}

walk('app')
walk('lib')

assert.deepEqual(offenders, [])
console.log('PASS Firebase Admin is not imported into client components')
