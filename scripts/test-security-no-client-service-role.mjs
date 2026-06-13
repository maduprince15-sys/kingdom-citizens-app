import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const roots = ['app', 'lib']
const offenders = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue
    const normalized = full.replaceAll('\\', '/')
    if (normalized === 'lib/supabase/admin.ts') continue
    if (normalized.startsWith('app/api/')) continue
    const source = fs.readFileSync(full, 'utf8')
    if (/SUPABASE_SERVICE_ROLE_KEY|createAdminClient/.test(source)) offenders.push(normalized)
  }
}

roots.forEach((root) => fs.existsSync(root) && walk(root))

assert.deepEqual(offenders, [])
console.log('PASS service role key is not referenced by client code')
