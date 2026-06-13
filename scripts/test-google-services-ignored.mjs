import fs from 'node:fs'
import assert from 'node:assert/strict'

const gitignore = fs.readFileSync('.gitignore', 'utf8')
const capacitor = fs.readFileSync('capacitor.config.ts', 'utf8')
const androidBuild = fs.readFileSync('android/app/build.gradle', 'utf8')
const rootBuild = fs.readFileSync('android/build.gradle', 'utf8')

assert.match(gitignore, /android\/app\/google-services\.json/)
assert.match(capacitor, /appId:\s*'com\.kingdomcitizens\.app'/)
assert.match(androidBuild, /google-services\.json/)
assert.match(androidBuild, /com\.google\.gms\.google-services/)
assert.match(rootBuild, /com\.google\.gms:google-services/)

console.log('PASS google-services.json is ignored and Android FCM config is present')
