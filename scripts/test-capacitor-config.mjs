import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configPath = path.join(root, 'capacitor.config.ts')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const config = fs.readFileSync(configPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

assert(fs.existsSync(configPath), 'Capacitor config exists.')
assert(config.includes("appId: 'com.kingdomcitizens.app'"), 'Capacitor app id is correct.')
assert(config.includes("appName: 'Kingdom Citizens'"), 'Capacitor app name is correct.')
assert(config.includes("webDir: 'out'"), 'Capacitor webDir is out.')
assert(config.includes('server:') && config.includes('url:'), 'Capacitor uses hosted server strategy.')
assert(/url:\s*'https:\/\/[^']+'/.test(config), 'Capacitor hosted URL is HTTPS.')
assert(config.includes('cleartext: false'), 'Capacitor cleartext traffic is disabled.')
assert(pkg.dependencies['@capacitor/core'], '@capacitor/core dependency exists.')
assert(pkg.dependencies['@capacitor/cli'], '@capacitor/cli dependency exists.')
assert(pkg.dependencies['@capacitor/android'], '@capacitor/android dependency exists.')
assert(pkg.scripts['cap:sync'] === 'npx cap sync android', 'cap sync script exists.')
assert(pkg.scripts['cap:open:android'] === 'npx cap open android', 'cap open script exists.')

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS: Capacitor hosted Android config is valid.')
