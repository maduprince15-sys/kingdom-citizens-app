import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { resourceIdPattern } from '../../../../lib/messaging/access'

export async function POST(request: Request) {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let input
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid membership request.' }, { status: 400 }) }
  const { groupId, userId, action, role = 'member' } = input || {}
  if (!resourceIdPattern.test(groupId || '') || !resourceIdPattern.test(userId || '') || !['add', 'remove'].includes(action) || !['leader', 'assistant', 'member', 'trainee'].includes(role)) {
    return NextResponse.json({ error: 'Invalid membership request.' }, { status: 400 })
  }
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const { data: group, error: groupError } = await client.from('citizen_groups').select('id, leader_id, is_active').eq('id', groupId).maybeSingle()
  if (groupError || !group?.is_active) return NextResponse.json({ error: 'Group not found.' }, { status: 404 })
  const admin = profile?.role === 'admin' || profile?.role === 'owner'
  if (!admin) {
    const { data: membership } = await client.from('citizen_group_members').select('role_in_group').eq('group_id', groupId).eq('user_id', user.id).maybeSingle()
    if (group.leader_id !== user.id || membership?.role_in_group !== 'leader') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (userId === user.id || !['member', 'trainee'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (action === 'remove') {
      const { data: target } = await client.from('citizen_group_members').select('role_in_group').eq('group_id', groupId).eq('user_id', userId).maybeSingle()
      if (!target || !['member', 'trainee'].includes(target.role_in_group)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  // RLS remains authoritative; a group role never modifies profiles.role.
  const result = action === 'add'
    ? await client.from('citizen_group_members').insert({ group_id: groupId, user_id: userId, role_in_group: role })
    : await client.from('citizen_group_members').delete().eq('group_id', groupId).eq('user_id', userId)
  if (result.error) return NextResponse.json({ error: 'Could not update group membership.' }, { status: 503 })
  return NextResponse.json({ success: true })
}
