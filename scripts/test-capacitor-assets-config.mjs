import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const config = fs.readFileSync(path.join(root, 'capacitor.config.ts'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

assert(pkg.devDependencies?.['@capacitor/assets'], '@capacitor/assets is installed as a dev dependency.')
assert(pkg.dependencies?.['@capacitor/core'], '@capacitor/core is still installed.')
assert(pkg.dependencies?.['@capacitor/android'], '@capacitor/android is still installed.')
assert(config.includes("appId: 'com.kingdomcitizens.app'"), 'Capacitor app id is unchanged.')
assert(config.includes("appName: 'Kingdom Citizens'"), 'Capacitor app name is unchanged.')
assert(/url:\s*'https:\/\/kingdom-citizens-app\.vercel\.app'/.test(config), 'Capacitor still uses hosted Vercel URL.')
assert(config.includes('cleartext: false'), 'Capacitor still blocks cleartext traffic.')
assert(config.includes("webDir: 'out'"), 'Capacitor webDir remains out for native sync compatibility.')

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS: Capacitor assets dependency and hosted config are valid.')
