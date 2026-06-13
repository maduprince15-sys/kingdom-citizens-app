import fs from 'node:fs'
import assert from 'node:assert/strict'

const route = fs.readFileSync('app/auth/callback/route.ts', 'utf8')

assert.match(route, /exchangeCodeForSession/)
assert.match(route, /new URL\(next, origin\)/)
assert.match(route, /!next\.startsWith\('\/'\)/)
assert.match(route, /\/dashboard/)

console.log('PASS auth callback route keeps safe code exchange flow')
