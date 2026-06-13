import fs from 'node:fs'
import assert from 'node:assert/strict'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

assert.ok(pkg.dependencies['@capacitor/push-notifications'])

console.log('PASS Capacitor push notifications plugin is installed')
