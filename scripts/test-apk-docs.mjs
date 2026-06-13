import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsPath = path.join(root, 'docs/ANDROID_APK_BUILD.md')
const docs = fs.readFileSync(docsPath, 'utf8')

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

assert(fs.existsSync(docsPath), 'APK docs exist.')
assert(docs.includes('npm run build'), 'docs include npm build command.')
assert(docs.includes('npx cap sync android'), 'docs include cap sync command.')
assert(docs.includes('npx cap open android'), 'docs include cap open command.')
assert(docs.includes('.\\gradlew assembleDebug'), 'docs include Windows debug APK command.')
assert(docs.includes('./gradlew assembleDebug'), 'docs include Unix debug APK command.')
assert(docs.includes('Generate Signed Bundle / APK'), 'docs explain signed APK flow.')
assert(docs.includes('keystore'), 'docs mention keystore.')
assert(docs.includes('hosted production app'), 'docs explain hosted app strategy.')

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS: APK build documentation is present.')
