import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { canAccessResource } from '../../../../lib/messaging/access'

export async function POST(request: Request) {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let input
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).length > 12_000) return NextResponse.json({ error: 'Message is too large.' }, { status: 413 })
    input = JSON.parse(raw)
  } catch { return NextResponse.json({ error: 'Invalid message.' }, { status: 400 }) }
  const body = typeof input?.body === 'string' ? input.body.trim() : ''
  const room = typeof input?.room === 'string' ? input.room : ''
  if (!body || body.length > 2000) return NextResponse.json({ error: 'Message must contain 1–2000 characters.' }, { status: 400 })
  if (room.startsWith('group:')) {
    if (!await canAccessResource(client, user.id, 'groups', room.slice(6))) return NextResponse.json({ error: 'Group not found.' }, { status: 404 })
  } else if (room.startsWith('study-resource:')) {
    const { data, error } = await client.from('study_resources').select('id').eq('id', room.slice(15)).eq('is_published', true).eq('is_public', true).maybeSingle()
    if (error || !data) return NextResponse.json({ error: 'Study not found.' }, { status: 404 })
  } else if (!['general', 'study-general'].includes(room)) {
    return NextResponse.json({ error: 'Invalid room.' }, { status: 400 })
  }
  const { data: profile, error: profileError } = await client.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
  if (profileError || !profile) return NextResponse.json({ error: 'Could not load your profile.' }, { status: 503 })
  const { error: insertError } = await client.from('chat_messages').insert({
    sender_id: user.id, sender_name: profile.full_name || 'Citizen', sender_role: profile.role || 'member',
    body, chat_room: room, is_deleted: false,
  })
  if (insertError) return NextResponse.json({ error: 'Could not send the group message.' }, { status: 503 })
  return NextResponse.json({ success: true }, { status: 201 })
}
