import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn(), getUser: vi.fn(),
  maybeSingle: vi.fn(), insert: vi.fn(), from: vi.fn(),
}))
vi.mock('../lib/supabase/server', () => ({ createClient: async () => ({ auth: mocks, from: mocks.from }) }))
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: () => ({ auth: mocks, from: mocks.from }) }))
import { GET } from '../app/auth/callback/route'
import { POST } from '../app/api/auth/native-profile/route'
import { safeNextPath } from '../lib/auth/safe-next'
import { proxy } from '../proxy'
const ssr = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: ssr.create }))
beforeEach(() => {
  vi.resetAllMocks()
  mocks.exchangeCodeForSession.mockResolvedValue({ error: null })
  mocks.verifyOtp.mockResolvedValue({ error: null })
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'citizen', email: 'test@example.invalid', user_metadata: { role: 'owner', full_name: 'Changed' } } }, error: null })
  mocks.maybeSingle.mockResolvedValue({ data: { id: 'citizen', role: 'owner' }, error: null })
  mocks.insert.mockResolvedValue({ error: null })
  mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }), insert: mocks.insert })
})
it.each(['//evil.test', '/\\evil.test', 'https://evil.test', '/\t/evil.test', '/\u0000/evil.test', '/login', '/auth/callback', '/\r\nevil'])('rejects unsafe redirect %s', value => {
  expect(safeNextPath(value)).toBe('/dashboard')
})
it('exchanges OAuth code and preserves existing staff profile', async () => {
  const response = await GET(new Request('https://preview.example/auth/callback?code=abc&next=//evil.test'))
  expect(response.headers.get('location')).toBe('https://preview.example/dashboard')
  expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith('abc')
  expect(mocks.insert).not.toHaveBeenCalled()
})
it('creates only least privileged membership despite user metadata', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
  expect((await GET(new Request('https://preview.example/auth/callback?code=abc'))).status).toBe(307)
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ id: 'citizen', role: 'member' }))
})
it.each(['user', 'lookup', 'insert'])('fails closed on %s failure', async failure => {
  if (failure === 'user') mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('internal') })
  if (failure === 'lookup') mocks.maybeSingle.mockResolvedValue({ data: null, error: new Error('internal') })
  if (failure === 'insert') {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    mocks.insert.mockResolvedValue({ error: new Error('internal') })
  }
  const response = await GET(new Request('https://preview.example/auth/callback?code=abc'))
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('internal')
})
it('rejects a failed code exchange', async () => {
  mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error('expired') })
  expect((await GET(new Request('https://preview.example/auth/callback?code=expired'))).headers.get('location')).toBe('https://preview.example/login')
  expect(mocks.from).not.toHaveBeenCalled()
})
it('verifies email confirmation token hashes', async () => {
  const response = await GET(new Request('https://preview.example/auth/callback?token_hash=hash&type=email'))
  expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'email' })
  expect(response.headers.get('location')).toBe('https://preview.example/dashboard')
})
it('recovery does not depend on profile availability', async () => {
  const response = await GET(new Request('https://preview.example/auth/callback?token_hash=hash&type=recovery'))
  expect(response.headers.get('location')).toBe('https://preview.example/update-password')
  expect(mocks.from).not.toHaveBeenCalled()
})
it('native setup requires a verified bearer token', async () => {
  expect((await POST(new Request('https://preview.example/api/auth/native-profile', { method: 'POST' }))).status).toBe(401)
  expect(mocks.from).not.toHaveBeenCalled()
})
it('native setup preserves existing staff profile', async () => {
  expect((await POST(new Request('https://preview.example/api/auth/native-profile', { method: 'POST', headers: { authorization: 'Bearer token' } }))).status).toBe(200)
  expect(mocks.getUser).toHaveBeenCalledWith('token')
  expect(mocks.insert).not.toHaveBeenCalled()
})
it('native lookup failure never creates a replacement profile', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: new Error('private') })
  expect((await POST(new Request('https://preview.example/api/auth/native-profile', { method: 'POST', headers: { authorization: 'Bearer token' } }))).status).toBe(503)
  expect(mocks.insert).not.toHaveBeenCalled()
})
it('persists refreshed session cookies to request and response with no-store headers', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.invalid')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key')
  const request = new NextRequest('https://preview.example/dashboard')
  ssr.create.mockImplementation((_url, _key, options) => ({ auth: { getUser: async () => {
    options.cookies.setAll([{ name: 'session', value: 'rotated', options: { httpOnly: true } }], { Pragma: 'no-cache' })
    return { data: { user: { id: 'citizen' } }, error: null }
  } } }))
  const response = await proxy(request)
  expect(request.cookies.get('session')?.value).toBe('rotated')
  expect(response.cookies.get('session')?.value).toBe('rotated')
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  expect(response.headers.get('Pragma')).toBe('no-cache')
  vi.unstubAllEnvs()
})
