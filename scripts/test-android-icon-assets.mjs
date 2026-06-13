import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

function pngSize(file) {
  const buffer = fs.readFileSync(file)
  const isPng = buffer.toString('ascii', 1, 4) === 'PNG'
  return {
    isPng,
    width: isPng ? buffer.readUInt32BE(16) : 0,
    height: isPng ? buffer.readUInt32BE(20) : 0,
    bytes: buffer.length,
  }
}

const iconPath = path.join(root, 'resources/icon.png')
const splashPath = path.join(root, 'resources/splash.png')

assert(fs.existsSync(iconPath), 'resources/icon.png exists.')
assert(fs.statSync(iconPath).size > 10_000, 'resources/icon.png is not empty.')

const icon = pngSize(iconPath)
assert(icon.isPng, 'resources/icon.png is a PNG.')
assert(icon.width === icon.height, 'resources/icon.png is square.')
assert(icon.width >= 1024, 'resources/icon.png is at least 1024px wide.')

assert(fs.existsSync(splashPath), 'resources/splash.png exists.')
const splash = pngSize(splashPath)
assert(splash.isPng, 'resources/splash.png is a PNG.')
assert(splash.width === splash.height, 'resources/splash.png is square.')

const androidRes = path.join(root, 'android/app/src/main/res')
if (fs.existsSync(androidRes)) {
  for (const density of ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi']) {
    const dir = path.join(androidRes, density)
    assert(fs.existsSync(path.join(dir, 'ic_launcher.png')), `${density}/ic_launcher.png exists.`)
    assert(fs.existsSync(path.join(dir, 'ic_launcher_round.png')), `${density}/ic_launcher_round.png exists.`)
    assert(fs.existsSync(path.join(dir, 'ic_launcher_foreground.png')), `${density}/ic_launcher_foreground.png exists.`)
  }
  assert(fs.existsSync(path.join(androidRes, 'mipmap-anydpi-v26/ic_launcher.xml')), 'adaptive icon XML exists.')
  assert(fs.existsSync(path.join(androidRes, 'mipmap-anydpi-v26/ic_launcher_round.xml')), 'adaptive round icon XML exists.')
}

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS: Android launcher icon source and generated mipmap assets exist.')
