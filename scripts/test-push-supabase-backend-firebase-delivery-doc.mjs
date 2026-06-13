import fs from 'node:fs'
import assert from 'node:assert/strict'

const docs = fs.readFileSync('docs/PUSH_NOTIFICATIONS.md', 'utf8')

assert.match(docs, /Supabase remains .* backend/i)
assert.match(docs, /Firebase is used only for Firebase Cloud Messaging delivery/i)
assert.match(docs, /com\.kingdomcitizens\.app/)
assert.match(docs, /user_push_tokens/)
assert.match(docs, /New encrypted message/)

console.log('PASS docs state Supabase backend and Firebase delivery roles')
