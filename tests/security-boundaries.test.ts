import { beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), rpc: vi.fn(), admin: vi.fn(), adminFrom: vi.fn(), push: vi.fn() }))
vi.mock('../lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mock.getUser }, from: mock.from, rpc: mock.rpc }) }))
vi.mock('../lib/supabase/admin', () => ({ createAdminClient: mock.admin }))
vi.mock('../lib/push-notifications', () => ({ sendPrivateMessagePush: mock.push }))
import { POST as send } from '../app/api/messages/send/route'
import { POST as archive } from '../app/api/messages/archive/route'
import { POST as role } from '../app/api/admin/update-role/route'
import { POST as removeChat } from '../app/api/chat/delete/route'
const A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
const B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
const C = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'
const id = 'dddddddd-dddd-4ddd-dddd-dddddddddddd'
const secretError = { message: 'private_table SQL permission internals' }
const payload = { recipientId: B, subject: 'Private', encryptedBody: JSON.stringify({ encrypted: true, payload: { version: 1, algorithm: 'AES-GCM', iv: 'abcdefghijklmnop', ciphertext: 'ciphertext' } }) }
function request(body: unknown) { return new Request('https://preview.invalid/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }
function query(result: unknown) {
  const q = { select: vi.fn(), eq: vi.fn(), neq: vi.fn(), or: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), insert: vi.fn(), update: vi.fn(), then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) }
  for (const method of [q.select, q.eq, q.neq, q.or, q.insert, q.update]) method.mockReturnValue(q)
  q.single.mockResolvedValue(result)
  q.maybeSingle.mockResolvedValue(result)
  return q
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
  mock.getUser.mockResolvedValue({ data: { user: { id: A, user_metadata: { role: 'owner' } } }, error: null })
  mock.admin.mockReturnValue({ from: mock.adminFrom })
})
it.each([send, archive, role, removeChat])('rejects unauthenticated operations before queries', async endpoint => {
  mock.getUser.mockResolvedValue({ data: { user: null }, error: null })
  expect((await endpoint(request({}))).status).toBe(401)
  expect(mock.from).not.toHaveBeenCalled()
  expect(mock.admin).not.toHaveBeenCalled()
})
it('Citizen metadata cannot grant role-management privileges', async () => {
  mock.from.mockReturnValue(query({ data: { role: 'member' }, error: null }))
  expect((await role(request({ targetUserId: B, newRole: 'owner' }))).status).toBe(403)
  expect(mock.admin).not.toHaveBeenCalled()
})
it.each(['owner', 'admin'])('admin cannot assign protected %s role', async newRole => {
  mock.from.mockReturnValueOnce(query({ data: { role: 'admin' }, error: null })).mockReturnValueOnce(query({ data: { id: B, role: 'member' }, error: null }))
  expect((await role(request({ targetUserId: B, newRole }))).status).toBe(403)
  expect(mock.admin).not.toHaveBeenCalled()
})
it('owner cannot modify an existing owner', async () => {
  mock.from.mockReturnValueOnce(query({ data: { role: 'owner' }, error: null })).mockReturnValueOnce(query({ data: { id: B, role: 'owner' }, error: null }))
  expect((await role(request({ targetUserId: B, newRole: 'member' }))).status).toBe(403)
  expect(mock.admin).not.toHaveBeenCalled()
})
it('role update database failures expose only a generic message', async () => {
  mock.from.mockReturnValueOnce(query({ data: { role: 'owner' }, error: null })).mockReturnValueOnce(query({ data: { id: B, role: 'member' }, error: null }))
  mock.adminFrom.mockReturnValue(query({ error: secretError }))
  const response = await role(request({ targetUserId: B, newRole: 'admin' }))
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('private_table')
})
it('ordinary Citizen-to-Citizen send remains denied by existing policy', async () => {
  mock.from.mockReturnValue(query({ data: { role: 'member' }, error: null }))
  mock.rpc.mockReturnValue(query({ data: { id: B, role: 'member' }, error: null }))
  expect((await send(request(payload))).status).toBe(403)
})
it('ignores claimed sender identity and uses verified session for delivery', async () => {
  const write = query({ error: null })
  mock.from.mockReturnValueOnce(query({ data: { role: 'admin' }, error: null })).mockReturnValueOnce(write)
  mock.rpc.mockReturnValue(query({ data: { id: B, role: 'member' }, error: null }))
  expect((await send(request({ ...payload, sender_id: C }))).status).toBe(200)
  expect(write.insert).toHaveBeenCalledWith(expect.objectContaining({ sender_id: A, recipient_id: B }))
})
it('rejects replies to unrelated participants before writing', async () => {
  const parent = query({ data: { sender_id: B, recipient_id: C }, error: null })
  mock.from.mockReturnValueOnce(query({ data: { role: 'admin' }, error: null })).mockReturnValueOnce(parent)
  mock.rpc.mockReturnValue(query({ data: { id: B, role: 'member' }, error: null }))
  expect((await send(request({ ...payload, parentMessageId: id }))).status).toBe(403)
  expect(parent.insert).not.toHaveBeenCalled()
})
it('allows replies within the same authorized participant pair', async () => {
  const write = query({ error: null })
  mock.from.mockReturnValueOnce(query({ data: { role: 'admin' }, error: null })).mockReturnValueOnce(query({ data: { sender_id: B, recipient_id: A }, error: null })).mockReturnValueOnce(write)
  mock.rpc.mockReturnValue(query({ data: { id: B, role: 'member' }, error: null }))
  expect((await send(request({ ...payload, parentMessageId: id }))).status).toBe(200)
  expect(write.insert).toHaveBeenCalledWith(expect.objectContaining({ parent_message_id: id }))
})
it('fails safely when private message persistence fails', async () => {
  mock.from.mockReturnValueOnce(query({ data: { role: 'admin' }, error: null })).mockReturnValueOnce(query({ error: secretError }))
  mock.rpc.mockReturnValue(query({ data: { id: B, role: 'member' }, error: null }))
  const response = await send(request(payload))
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('private_table')
})
it.each(['attachments', 'attachment', 'attachmentUrl'])('rejects unsupported attachment field %s', async field => {
  mock.from.mockReturnValue(query({ data: { role: 'admin' }, error: null }))
  expect((await send(request({ ...payload, [field]: 'private.pdf' }))).status).toBe(400)
  expect(mock.rpc).not.toHaveBeenCalled()
})
it('rejects oversized messages', async () => {
  mock.from.mockReturnValue(query({ data: { role: 'admin' }, error: null }))
  expect((await send(request({ ...payload, subject: 'x'.repeat(70_000) }))).status).toBe(413)
  expect(mock.rpc).not.toHaveBeenCalled()
})
it.each(['inbox', 'sent'])('unrelated Citizen cannot archive another conversation in %s', async box => {
  mock.from.mockReturnValue(query({ data: { id, sender_id: B, recipient_id: C }, error: null }))
  expect((await archive(request({ id, box }))).status).toBe(403)
})
it('recipient archive write retains ownership filter and generic errors', async () => {
  const write = query({ error: secretError })
  mock.from.mockReturnValueOnce(query({ data: { id, sender_id: B, recipient_id: A }, error: null })).mockReturnValueOnce(write)
  const response = await archive(request({ id, box: 'inbox' }))
  expect(write.eq).toHaveBeenCalledWith('recipient_id', A)
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('private_table')
})
it('RLS-inaccessible group message cannot reach privileged deletion', async () => {
  mock.from.mockReturnValueOnce(query({ data: { role: 'admin' }, error: null })).mockReturnValueOnce(query({ data: null, error: secretError }))
  expect((await removeChat(request({ messageId: id }))).status).toBe(404)
  expect(mock.admin).not.toHaveBeenCalled()
})
it('another Citizen cannot delete a visible group message', async () => {
  mock.from.mockReturnValueOnce(query({ data: { role: 'member' }, error: null })).mockReturnValueOnce(query({ data: { id, sender_id: B, is_deleted: false }, error: null }))
  expect((await removeChat(request({ messageId: id }))).status).toBe(403)
  expect(mock.admin).not.toHaveBeenCalled()
})
it('chat owner deletion remains under RLS for both lookup and update', async () => {
  const write = query({ error: null })
  mock.from.mockReturnValueOnce(query({ data: { role: 'member' }, error: null })).mockReturnValueOnce(query({ data: { id, sender_id: A, is_deleted: false }, error: null })).mockReturnValueOnce(write)
  expect((await removeChat(request({ messageId: id }))).status).toBe(200)
  expect(write.update).toHaveBeenCalledWith(expect.objectContaining({ is_deleted: true, deleted_by: A }))
  expect(mock.admin).not.toHaveBeenCalled()
})
it('group deletion persistence errors do not disclose database internals', async () => {
  mock.from.mockReturnValueOnce(query({ data: { role: 'moderator' }, error: null })).mockReturnValueOnce(query({ data: { id, sender_id: B, is_deleted: false }, error: null })).mockReturnValueOnce(query({ error: secretError }))
  const response = await removeChat(request({ messageId: id }))
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('private_table')
})
