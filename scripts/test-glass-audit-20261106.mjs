import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
const read = (path) => readFileSync(path, 'utf8')
const paths = [
  'app/page.tsx', 'app/dashboard/page.tsx', 'app/login/page.tsx', 'app/register/page.tsx',
  'app/components/PublicHeader.tsx', 'app/components/PublicFooter.tsx',
  'app/auth/callback/route.ts', 'lib/auth/safe-next.ts',
]
for (const path of paths) {
  const kind = path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const file = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, kind)
  assert.equal(file.parseDiagnostics.length, 0,
    `Invalid TSX/TS: ${path}: ${file.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`)
}
const home = read('app/page.tsx')
const menu = read('app/components/PublicHeader.tsx')
const dashboard = read('app/dashboard/page.tsx')
const login = read('app/login/page.tsx')
const register = read('app/register/page.tsx')
const callback = read('app/auth/callback/route.ts')
const safe = read('lib/auth/safe-next.ts')
const report = read('docs/KINGDOM_SECURITY_AUDIT_2026-11-06.md')
assert.ok(home.includes('The Kingdom') && home.includes('PublicHeader'), 'Keep a public ministry homepage')
assert.ok(home.includes('PinnedAnnouncementSlider') && home.includes('meetings.length > 0'), 'Use actual ministry notices and meetings')
assert.ok(!home.includes('Bible Study · 8:00 PM'), 'No invented fallback service schedule')
assert.ok(menu.includes('aria-controls="kc-public-menu"') && menu.includes('aria-expanded={open}'), 'Menu accessibility')
assert.ok(!menu.includes('fixed bottom-0'), 'Remove overlapping duplicate navigation')
assert.ok(dashboard.includes('primaryCards.map') && dashboard.includes('secondaryCards.map') && dashboard.includes('managementCards.map'), 'Member and staff links retained')
assert.ok(dashboard.includes('Account options'), 'Advanced account controls behind disclosure')
assert.ok(login.includes('useMemo(() => createClient(), [])') && register.includes('useMemo(() => createClient(), [])'), 'Stable Supabase clients')
assert.ok(register.includes('Birthday (optional)') && register.includes('Boolean(monthNumber) !== Boolean(dayNumber)'), 'Birthdays optional and validated')
assert.ok(callback.includes('safeNextPath(searchParams.get'), 'Callback return paths validated')
assert.ok(safe.includes("value.startsWith('//')"), 'Protocol-relative redirects blocked')
assert.ok(report.includes('CRITICAL') && report.includes('has_column_privilege'), 'Document actual direct-role-edit finding')
const previewClient = read('lib/supabase/client.ts')
const previewServer = read('lib/supabase/server.ts')
assert.ok(previewClient.includes('supabaseConfigured') && previewServer.includes('supabaseServerConfigured'), 'Missing Preview credentials remain explicit')
assert.ok(previewClient.includes('https://preview-unconfigured.invalid') && previewServer.includes('https://preview-unconfigured.invalid'), 'No implicit Production database fallback')
assert.ok(login.includes('disabled={loading || !supabaseConfigured}') && register.includes('disabled={loading || !supabaseConfigured}'), 'Sign-in and registration disabled when disconnected')
assert.ok(home.includes('if (supabaseServerConfigured)') && !home.includes('NEXT_PUBLIC_SITE_URL'), 'Public home does not query Production without credentials')
console.log('PASS Kingdom Citizens UI/auth/static audit contracts.')
