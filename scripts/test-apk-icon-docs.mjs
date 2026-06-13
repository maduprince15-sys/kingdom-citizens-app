import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docs = fs.readFileSync(path.join(root, 'docs/ANDROID_APK_BUILD.md'), 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

assert(docs.includes('Updating The Android App Icon'), 'docs include Android app icon update section.')
assert(docs.includes('npm install -D @capacitor/assets'), 'docs include assets install command.')
assert(docs.includes('New-Item -ItemType Directory -Force -Path resources'), 'docs include resources folder command.')
assert(docs.includes('resources\\icon.png'), 'docs mention resources icon path.')
assert(docs.includes('npx capacitor-assets generate --android'), 'docs include Capacitor assets generate command.')
assert(docs.includes('npm run build'), 'docs include build command.')
assert(docs.includes('npx cap sync android'), 'docs include cap sync command.')
assert(docs.includes('.\\gradlew assembleDebug'), 'docs include debug APK command.')
assert(docs.includes('Uninstall the previous APK'), 'docs tell user to uninstall old APK due to icon cache.')

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS: APK icon update documentation is present.')
