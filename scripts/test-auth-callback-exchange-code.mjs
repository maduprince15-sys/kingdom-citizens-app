import fs from 'node:fs'
import assert from 'node:assert/strict'

const webRoute = fs.readFileSync('app/auth/callback/route.ts', 'utf8')
const nativeRoute = fs.readFileSync('app/api/auth/native-profile/route.ts', 'utf8')

assert.match(webRoute, /exchangeCodeForSession\(code\)/)
assert.match(webRoute, /new URL\(next, origin\)/)
assert.match(webRoute, /!next\.startsWith\('\/'\)/)
assert.match(nativeRoute, /admin\.auth\.getUser\(token\)/)
assert.match(nativeRoute, /role:\s*existingProfile\?\.role \|\| 'member'/)

console.log('PASS web callback and native profile setup verify Supabase auth')
