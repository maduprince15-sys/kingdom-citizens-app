import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const id = body?.id
  const box = body?.box

  if (!id) {
    return NextResponse.json({ error: 'Missing message id.' }, { status: 400 })
  }

  const { data: message, error: loadError } = await supabase
    .from('app_messages')
    .select('id, sender_id, recipient_id')
    .eq('id', id)
    .single()

  if (loadError || !message) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
  }

  if (box === 'sent') {
    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('app_messages')
      .update({ sender_archived_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  }

  if (message.recipient_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('app_messages')
    .update({ recipient_archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}