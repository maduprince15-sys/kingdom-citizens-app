import fs from 'node:fs'
import assert from 'node:assert/strict'

const routes = [
  'app/api/admin/update-role/route.ts',
  'app/api/admin/delete-user/route.ts',
  'app/api/announcements/create/route.ts',
  'app/api/posts/create/route.ts',
  'app/api/messages/send/route.ts',
  'app/api/messages/archive/route.ts',
]

for (const routePath of routes) {
  const source = fs.readFileSync(routePath, 'utf8')
  assert.match(source, /auth\.getUser\(\)/, `${routePath} must derive user from auth`)
  assert.match(source, /Unauthorized/, `${routePath} must reject missing auth`)
}

assert.match(fs.readFileSync('app/api/admin/update-role/route.ts', 'utf8'), /actorRole/)
assert.match(fs.readFileSync('app/api/admin/delete-user/route.ts', 'utf8'), /owner.*admin|admin.*owner/s)
assert.match(fs.readFileSync('app/api/announcements/create/route.ts', 'utf8'), /canPostAnnouncements/)
assert.match(fs.readFileSync('app/api/posts/create/route.ts', 'utf8'), /canCreatePosts/)
assert.match(fs.readFileSync('app/api/messages/send/route.ts', 'utf8'), /senderIsOwnerOrAdmin/)
assert.match(fs.readFileSync('app/api/messages/archive/route.ts', 'utf8'), /recipient_id\.eq\.\$\{user\.id\},sender_id\.eq\.\$\{user\.id\}/)

console.log('PASS privileged API routes have auth and authorization guards')
