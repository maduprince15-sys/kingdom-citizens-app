import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const offenders = []
const terms = /(code|access_token|refresh_token|session|authorization)/i

for (const file of [
  'app/components/GoogleLoginButton.tsx',
  'lib/android-google-auth.ts',
  'app/api/auth/native-profile/route.ts',
  'app/auth/callback/route.ts',
]) {
  const source = fs.readFileSync(file, 'utf8')
  source.split(/\r?\n/).forEach((line, index) => {
    if (/console\.(log|warn|error|info)/.test(line) && terms.test(line)) {
      offenders.push(`${path.normalize(file)}:${index + 1}`)
    }
  })
}

assert.deepEqual(offenders, [])
console.log('PASS Google auth flow does not log OAuth tokens/codes/sessions')
