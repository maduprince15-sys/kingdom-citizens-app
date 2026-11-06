import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const read=p=>readFileSync(p,'utf8')
const paths=['app/dashboard/page.tsx','app/birthdays/page.tsx','app/members/page.tsx',
 'app/messages/new/page.tsx','app/api/messages/send/route.ts']
for(const path of paths){
  const s=read(path)
  const file=ts.createSourceFile(path,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
  assert.equal(file.parseDiagnostics.length,0,path+' has parse errors')
  assert.ok(s.includes(".rpc('member_directory')"),path+' must access privacy-safe directory')
}
assert.ok(read('app/members/page.tsx').includes('redacts email and phone'),
  'Never restore unrestricted member directory queries')
assert.ok(read('app/auth/callback/route.ts').includes('safeNextPath('), 'OAuth redirect must be local')
assert.ok(!read('app/auth/callback/route.ts').includes(".from('profiles').upsert"), 'OAuth must not upsert client-managed roles')
assert.ok(read('lib/auth/safe-next.ts').includes("value.startsWith('//')"), 'Protocol-relative redirects rejected')
console.log('PASS: member directory privacy static contracts')
