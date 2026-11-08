import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { createHash } from 'node:crypto'
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

function fileHash(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}
const originalLogoSHA256 = '7c3b11e96fe1374c4f5472428b1a0e5ae9baebf05cf033c0050ec95dec66731c'
assert.equal(fileHash('public/kingdom-citizens-logo.png'),originalLogoSHA256,
  'Primary site logo must match the owner-uploaded illustration exactly')
assert.equal(fileHash('public/logo.png'),originalLogoSHA256,
  'Legacy logo path must use the same approved illustration')
for (const path of ['public/icons/icon-192.png','public/icons/icon-512.png','public/og-kingdom-citizens.png','app/icon.png','app/apple-icon.png']) {
  const bytes = readFileSync(path)
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',
    path+' must be a real PNG image')
}
assert.equal(readFileSync('app/favicon.ico').subarray(0,4).toString('hex'),'00000100',
  'Favicon must be an ICO file')
const appLayout = read('app/layout.tsx')
assert.ok(appLayout.includes('/og-kingdom-citizens.png'),
  'Social previews use approved branding')
const manifest = read('public/manifest.json')
assert.ok(manifest.includes('"theme_color": "#12090b"'), 'Keep original burgundy palette in PWA')

for (const p of ['app/dashboard/page.tsx','app/birthdays/page.tsx','app/members/page.tsx','app/messages/new/page.tsx','app/api/messages/send/route.ts']) {
  assert.ok(read(p).includes(".rpc('member_directory')"), p + ' must use privacy-filtered directory')
}
assert.ok(read('app/api/messages/send/route.ts').includes('process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null'),
 'Preview messaging must not require an unavailable admin key')
console.log('PASS Kingdom Citizens UI/auth/static audit contracts.')

// Preview authentication must never silently redirect users to production.
for (const path of ['app/components/GoogleLoginButton.tsx', 'app/register/page.tsx']) {
  const source = read(path)
  const origin = source.indexOf("if (typeof window !== 'undefined')")
  const configured = source.indexOf('const siteUrl = process.env.NEXT_PUBLIC_SITE_URL')
  assert.ok(origin >= 0 && configured > origin,
    `${path}: browser origin must take precedence over configured production site URL`)
  assert.ok(source.includes('window.location.origin'),
    `${path}: OAuth callback must return to initiating deployment`)
}


// Reject malformed/oversized encrypted-message envelopes before database writes.
const messageSend = read('app/api/messages/send/route.ts')
assert.ok(messageSend.includes('MAX_MESSAGE_BYTES = 64 * 1024'), 'Bound incoming message bytes')
assert.ok(messageSend.includes("await request.text()"), 'Validate raw payload length before JSON parsing')
assert.ok(messageSend.includes("status: 413"), 'Reject oversized encrypted messages')
assert.ok(messageSend.includes("typeof bodyData.encryptedBody === 'string'"), 'Reject non-string encrypted payloads')
assert.ok(messageSend.includes("uuid.test(recipientId)"), 'Reject malformed member identifiers')
assert.ok(messageSend.includes("uuid.test(parentMessageId)"), 'Reject malformed reply identifiers')
assert.ok(messageSend.includes("parsed.payload.ciphertext.length <= 60_000"), 'Bound ciphertext length')
