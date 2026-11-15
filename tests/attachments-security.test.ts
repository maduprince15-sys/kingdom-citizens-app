import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), upload: vi.fn(), download: vi.fn(), list: vi.fn(), storage: vi.fn(), getBucket: vi.fn(), remove: vi.fn() }))
vi.mock('../lib/supabase/server', () => ({ createClient: async () => ({ auth: m, from: m.from, storage: { from: m.storage } }) }))
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: () => ({ storage: { getBucket: m.getBucket } }) }))
import { GET, POST, DELETE } from '../app/api/attachments/route'
import { validateAttachment, MAX_ATTACHMENT_BYTES } from '../lib/messaging/attachments'
import { isolatedAttachmentsEnabled } from '../lib/messaging/access'
const A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
const id = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'
const filename = `${A}_dddddddd-dddd-4ddd-dddd-dddddddddddd.txt`
function query(data: unknown, error: unknown = null) {
  const q = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error }) }
  q.select.mockReturnValue(q); q.eq.mockReturnValue(q); return q
}
function request(body = 'test', type = 'text/plain', scope = 'messages') {
  return new Request(`https://preview.invalid/api/attachments?scope=${scope}&id=${id}`, { method: 'POST', headers: { 'Content-Type': type }, body })
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('KC_PRIVATE_ATTACHMENTS_ENABLED', 'isolated-test-only')
  vi.stubEnv('KC_ISOLATED_TEST_PROJECT_REF', 'synthetic-test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://synthetic-test.supabase.co')
  vi.stubEnv('VERCEL_ENV', 'preview')
  m.getUser.mockResolvedValue({ data: { user: { id: A } }, error: null })
  m.from.mockImplementation(() => query({ sender_id: A, recipient_id: B }))
  m.getBucket.mockResolvedValue({ data: { public: false, file_size_limit: MAX_ATTACHMENT_BYTES, allowed_mime_types: ['text/plain', 'image/png', 'image/jpeg', 'application/pdf'] }, error: null })
  m.storage.mockReturnValue({ upload: m.upload, download: m.download, list: m.list, remove: m.remove })
  m.upload.mockResolvedValue({ error: null })
  m.remove.mockResolvedValue({ data: [{ name: filename }], error: null })
  m.download.mockResolvedValue({ data: new Blob(['private synthetic data']), error: null })
  m.list.mockResolvedValue({ data: [{ name: filename }], error: null })
})
afterEach(vi.unstubAllEnvs)
it('disabled by default and on the known Production project', () => {
  vi.stubEnv('KC_PRIVATE_ATTACHMENTS_ENABLED', '')
  expect(isolatedAttachmentsEnabled()).toBe(false)
  vi.stubEnv('KC_PRIVATE_ATTACHMENTS_ENABLED', 'isolated-test-only')
  vi.stubEnv('KC_ISOLATED_TEST_PROJECT_REF', 'jngbhejfqbyjletfknkh')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://jngbhejfqbyjletfknkh.supabase.co')
  expect(isolatedAttachmentsEnabled()).toBe(false)
})
it('refuses Production Vercel even with test configuration', () => {
  vi.stubEnv('VERCEL_ENV', 'production')
  expect(isolatedAttachmentsEnabled()).toBe(false)
})
it('requires a verified session before storage access', async () => {
  m.getUser.mockResolvedValue({ data: { user: null }, error: null })
  expect((await POST(request())).status).toBe(401)
  expect(m.storage).not.toHaveBeenCalled()
})
it('fails closed when test configuration is missing', async () => {
  vi.stubEnv('KC_ISOLATED_TEST_PROJECT_REF', '')
  expect((await POST(request())).status).toBe(503)
  expect(m.from).not.toHaveBeenCalled()
})
it('rejects cross-account uploads', async () => {
  m.from.mockReturnValue(query({ sender_id: B, recipient_id: id }))
  expect((await POST(request())).status).toBe(404)
  expect(m.storage).not.toHaveBeenCalled()
})
it('rejects public buckets before uploading', async () => {
  m.getBucket.mockResolvedValue({ data: { public: true }, error: null })
  expect((await POST(request())).status).toBe(503)
  expect(m.upload).not.toHaveBeenCalled()
})
it('rejects unbounded bucket configuration', async () => {
  m.getBucket.mockResolvedValue({ data: { public: false, file_size_limit: null }, error: null })
  expect((await POST(request())).status).toBe(503)
})
it('uploads bounded synthetic text to the private resource prefix', async () => {
  expect((await POST(request())).status).toBe(201)
  expect(m.storage).toHaveBeenCalledWith('citizen-private-attachments')
  expect(m.upload).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^messages/${id}/${A}_[0-9a-f-]+\\.txt$`)), expect.any(Uint8Array), { contentType: 'text/plain', upsert: false })
})
it('rechecks access before persistence', async () => {
  m.from.mockReturnValueOnce(query({ sender_id: A, recipient_id: B })).mockReturnValueOnce(query(null))
  expect((await POST(request())).status).toBe(404)
  expect(m.upload).not.toHaveBeenCalled()
})
it.each(['text/html', 'image/svg+xml', 'application/zip'])('rejects unsupported %s', async type => {
  expect((await POST(request('synthetic', type))).status).toBe(415)
  expect(m.upload).not.toHaveBeenCalled()
})
it('rejects mismatched image signature', async () => {
  expect((await POST(request('<script>', 'image/png'))).status).toBe(415)
  expect(m.upload).not.toHaveBeenCalled()
})
it('bounds actual bytes rather than trusting absent Content-Length', async () => {
  expect((await POST(request('a'.repeat(MAX_ATTACHMENT_BYTES + 1)))).status).toBe(413)
  expect(m.upload).not.toHaveBeenCalled()
})
it('returns generic storage failure', async () => {
  m.upload.mockResolvedValue({ error: { message: 'internal SQL storage schema' } })
  const response = await POST(request())
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('schema')
})
it('downloads bytes only after authorization without public URLs', async () => {
  const response = await GET(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}&name=${filename}`))
  expect(response.status).toBe(200)
  expect(await response.text()).toBe('private synthetic data')
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  expect(response.headers.get('Content-Disposition')).toContain('attachment;')
  expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
})
it('rejects cross-account downloads', async () => {
  m.from.mockReturnValue(query(null))
  expect((await GET(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}&name=${filename}`))).status).toBe(404)
  expect(m.download).not.toHaveBeenCalled()
})
it('rejects path traversal', async () => {
  expect((await GET(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}&name=../secret.txt`))).status).toBe(400)
  expect(m.download).not.toHaveBeenCalled()
})
it('lists names only inside authorized resource', async () => {
  const response = await GET(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}`))
  expect(await response.json()).toEqual({ files: [{ name: filename }] })
  expect(m.list).toHaveBeenCalledWith(`messages/${id}`, { limit: 100 })
})
it('removed group member cannot list attachments', async () => {
  m.from.mockReturnValueOnce(query({ id, is_active: true })).mockReturnValueOnce(query(null))
  expect((await GET(new Request(`https://preview.invalid/api/attachments?scope=groups&id=${id}`))).status).toBe(404)
  expect(m.list).not.toHaveBeenCalled()
})
it.each([['image/png', new Uint8Array([137,80,78,71,13,10,26,10]), 'png'], ['image/jpeg', new Uint8Array([255,216,255]), 'jpg'], ['application/pdf', new TextEncoder().encode('%PDF-1.7'), 'pdf']] as const)('validates signature for %s', (type, bytes, extension) => {
  expect(validateAttachment(bytes, type)).toBe(extension)
})
it('rejects invalid UTF-8 and NUL text', () => {
  expect(validateAttachment(new Uint8Array([255]), 'text/plain')).toBeNull()
  expect(validateAttachment(new Uint8Array([65, 0]), 'text/plain')).toBeNull()
})

it('allows uploader deletion while resource access is current', async () => {
  expect((await DELETE(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}&name=${filename}`))).status).toBe(200)
  expect(m.remove).toHaveBeenCalledWith([`messages/${id}/${filename}`])
})
it('rejects deletion by a non-uploading participant', async () => {
  m.getUser.mockResolvedValue({ data: { user: { id: B } }, error: null })
  expect((await DELETE(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}&name=${filename}`))).status).toBe(403)
  expect(m.remove).not.toHaveBeenCalled()
})
it('revoked resource access rejects deletion before storage', async () => {
  m.from.mockReturnValue(query(null))
  expect((await DELETE(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}&name=${filename}`))).status).toBe(404)
  expect(m.remove).not.toHaveBeenCalled()
})

it.each(['download', 'list', 'remove'] as const)('normalizes thrown %s service errors without disclosure', async operation => {
  m[operation].mockRejectedValue(new Error('private SQL internal service details'))
  const url = `https://preview.invalid/api/attachments?scope=messages&id=${id}${operation === 'list' ? '' : `&name=${filename}`}`
  const response = operation === 'remove' ? await DELETE(new Request(url)) : await GET(new Request(url))
  expect(response.status).toBe(503)
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  expect(await response.text()).not.toContain('SQL')
})
it.each(['download', 'list'] as const)('rejects access revoked during %s before returning bytes or names', async operation => {
  m.from.mockReturnValueOnce(query({ sender_id: A, recipient_id: B })).mockReturnValueOnce(query(null))
  const url = `https://preview.invalid/api/attachments?scope=messages&id=${id}${operation === 'list' ? '' : `&name=${filename}`}`
  const response = await GET(new Request(url))
  expect(response.status).toBe(404)
  expect(await response.text()).not.toContain('private synthetic data')
})
it('rechecks access after bucket inspection before deleting', async () => {
  m.from.mockReturnValueOnce(query({ sender_id: A, recipient_id: B })).mockReturnValueOnce(query(null))
  expect((await DELETE(new Request(`https://preview.invalid/api/attachments?scope=messages&id=${id}&name=${filename}`))).status).toBe(404)
  expect(m.remove).not.toHaveBeenCalled()
})
