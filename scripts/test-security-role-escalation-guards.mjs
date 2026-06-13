import fs from 'node:fs'
import assert from 'node:assert/strict'

const updateRole = fs.readFileSync('app/api/admin/update-role/route.ts', 'utf8')
const deleteUser = fs.readFileSync('app/api/admin/delete-user/route.ts', 'utf8')
const nativeProfile = fs.readFileSync('app/api/auth/native-profile/route.ts', 'utf8')

assert.match(updateRole, /targetUserId === user\.id/)
assert.match(updateRole, /Admins cannot assign admin or owner roles/)
assert.match(updateRole, /targetProfile\.role === 'owner'/)
assert.match(deleteUser, /canDeleteUsers\(currentProfile\?\.role\)/)
assert.match(deleteUser, /targetProfile\.role === 'owner' \|\| targetProfile\.role === 'admin'/)
assert.match(nativeProfile, /role:\s*existingProfile\?\.role \|\| 'member'/)
assert.doesNotMatch(nativeProfile, /body\?\.role|request\.json\(\)/)

console.log('PASS role escalation guards are present')
