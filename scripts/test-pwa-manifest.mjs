import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'public/manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

assert(fs.existsSync(manifestPath), 'manifest exists.')
assert(manifest.name === 'Kingdom Citizens', 'manifest app name is Kingdom Citizens.')
assert(manifest.short_name === 'Citizens', 'manifest short name is Citizens.')
assert(manifest.display === 'standalone', 'manifest display is standalone.')
assert(manifest.start_url === '/', 'manifest start_url is root.')
assert(manifest.background_color === '#030711', 'manifest background color is set.')
assert(manifest.theme_color === '#030711', 'manifest theme color is set.')
assert(Array.isArray(manifest.icons), 'manifest icons are present.')
assert(manifest.icons.some((icon) => icon.src === '/icons/icon-192.png' && icon.sizes === '192x192'), '192 icon is referenced.')
assert(manifest.icons.some((icon) => icon.src === '/icons/icon-512.png' && icon.sizes === '512x512'), '512 icon is referenced.')
assert(fs.existsSync(path.join(root, 'public/icons/icon-192.png')), '192 icon file exists.')
assert(fs.existsSync(path.join(root, 'public/icons/icon-512.png')), '512 icon file exists.')
assert(layout.includes("applicationName: 'Kingdom Citizens'"), 'layout metadata includes app name.')
assert(layout.includes("manifest: '/manifest.json'"), 'layout metadata references manifest.')
assert(layout.includes("themeColor: '#030711'"), 'layout viewport theme color is set.')

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS: PWA manifest and metadata are configured.')
