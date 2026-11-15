import { beforeEach, expect, it, vi } from 'vitest'
const m = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))
vi.mock('../lib/supabase/server', () => ({ createClient: async () => ({ auth: m, from: m.from }) }))
import { POST as send } from '../app/api/chat/send/route'
import { POST as membership } from '../app/api/groups/membership/route'
import { POST as deleteGroup } from '../app/api/groups/delete/route'
const A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', G = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'
function query(data: unknown, error: unknown = null) {
  const result = { data, error }
  const q = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue(result), insert: vi.fn(), delete: vi.fn(), then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve) }
  for (const method of [q.select, q.eq, q.insert, q.delete]) method.mockReturnValue(q)
  return q
}
function request(body: unknown) { return new Request('https://preview.invalid/api', { method: 'POST', body: JSON.stringify(body) }) }
beforeEach(() => { vi.resetAllMocks(); m.getUser.mockResolvedValue({ data: { user: { id: A, user_metadata: { role: 'admin' } } }, error: null }) })
it.each([send, membership, deleteGroup])('requires authentication', async endpoint => {
  m.getUser.mockResolvedValue({ data: { user: null }, error: null })
  expect((await endpoint(request({}))).status).toBe(401)
  expect(m.from).not.toHaveBeenCalled()
})
it('removed member cannot send to group', async () => {
  m.from.mockReturnValueOnce(query({ id: G, is_active: true })).mockReturnValueOnce(query(null))
  expect((await send(request({ room: `group:${G}`, body: 'synthetic' }))).status).toBe(404)
})
it('inactive group cannot receive messages', async () => {
  m.from.mockReturnValue(query({ id: G, is_active: false }))
  expect((await send(request({ room: `group:${G}`, body: 'synthetic' }))).status).toBe(404)
})
it('group send derives identity and role from the verified account', async () => {
  const write = query(null)
  m.from.mockReturnValueOnce(query({ id: G, is_active: true })).mockReturnValueOnce(query({ id: 'membership' })).mockReturnValueOnce(query({ full_name: 'Citizen A', role: 'member' })).mockReturnValueOnce(write)
  expect((await send(request({ room: `group:${G}`, body: 'synthetic', sender_id: B, sender_role: 'admin' }))).status).toBe(201)
  expect(write.insert).toHaveBeenCalledWith(expect.objectContaining({ sender_id: A, sender_role: 'member', chat_room: `group:${G}` }))
})
it('does not expose group send database errors', async () => {
  m.from.mockReturnValueOnce(query({ full_name: 'Citizen A', role: 'member' })).mockReturnValueOnce(query(null, { message: 'internal SQL schema' }))
  const response = await send(request({ room: 'general', body: 'synthetic' }))
  expect(response.status).toBe(503)
  expect(await response.text()).not.toContain('schema')
})
it('rejects arbitrary room references', async () => {
  expect((await send(request({ room: 'private-admin-room', body: 'synthetic' }))).status).toBe(400)
})
it('ordinary Citizen cannot promote themselves in a group', async () => {
  m.from.mockReturnValueOnce(query({ role: 'member' })).mockReturnValueOnce(query({ id: G, leader_id: B, is_active: true })).mockReturnValueOnce(query({ role_in_group: 'member' }))
  expect((await membership(request({ groupId: G, userId: A, action: 'add', role: 'leader' }))).status).toBe(403)
})
it('unassigned teacher cannot manage a group', async () => {
  m.from.mockReturnValueOnce(query({ role: 'teacher' })).mockReturnValueOnce(query({ id: G, leader_id: B, is_active: true })).mockReturnValueOnce(query({ role_in_group: 'member' }))
  expect((await membership(request({ groupId: G, userId: B, action: 'remove' }))).status).toBe(403)
})
it('assigned leader can add an ordinary member, under RLS', async () => {
  const write = query(null)
  m.from.mockReturnValueOnce(query({ role: 'teacher' })).mockReturnValueOnce(query({ id: G, leader_id: A, is_active: true })).mockReturnValueOnce(query({ role_in_group: 'leader' })).mockReturnValueOnce(write)
  expect((await membership(request({ groupId: G, userId: B, action: 'add', role: 'member' }))).status).toBe(200)
  expect(write.insert).toHaveBeenCalledWith({ group_id: G, user_id: B, role_in_group: 'member' })
})
it('assigned leader cannot elevate another member to leader', async () => {
  m.from.mockReturnValueOnce(query({ role: 'teacher' })).mockReturnValueOnce(query({ id: G, leader_id: A, is_active: true })).mockReturnValueOnce(query({ role_in_group: 'leader' }))
  expect((await membership(request({ groupId: G, userId: B, action: 'add', role: 'leader' }))).status).toBe(403)
})
it('ordinary Citizen cannot delete a group despite metadata claiming admin', async () => {
  m.from.mockReturnValue(query({ role: 'member' }))
  expect((await deleteGroup(request({ groupId: G }))).status).toBe(403)
})
it('admin group deletion remains scoped and subject to RLS', async () => {
  const write = query(null)
  m.from.mockReturnValueOnce(query({ role: 'admin' })).mockReturnValueOnce(write)
  expect((await deleteGroup(request({ groupId: G }))).status).toBe(200)
  expect(write.eq).toHaveBeenCalledWith('id', G)
})
