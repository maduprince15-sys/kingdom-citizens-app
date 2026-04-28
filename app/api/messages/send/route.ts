import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

const BOARD_ROLES = ['owner', 'admin', 'moderator', 'teacher']

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: senderProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (profileError || !senderProfile) {
    return NextResponse.json({ error: 'Could not load sender profile.' }, { status: 400 })
  }

  const bodyData = await request.json()
  const recipientId = bodyData?.recipientId
  const subject = String(bodyData?.subject || '').trim()
  const body = String(bodyData?.body || '').trim()
  const parentMessageId = bodyData?.parentMessageId || null

  if (!subject || !body) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
  }

  if (!recipientId) {
    return NextResponse.json({ error: 'Recipient is required.' }, { status: 400 })
  }

  const senderRole = senderProfile.role || 'member'
  const senderName =
    senderProfile.full_name ||
    senderProfile.email ||
    user.email ||
    'The Kingdom Citizens'

  const senderIsOwnerOrAdmin = ['owner', 'admin'].includes(senderRole)

  if (recipientId === 'all') {
    if (!senderIsOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Only owners and admins can broadcast to all members.' },
        { status: 403 }
      )
    }

    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', user.id)

    if (recipientsError) {
      return NextResponse.json({ error: recipientsError.message }, { status: 400 })
    }

    const rows =
      recipients?.map((recipient) => ({
        sender_id: user.id,
        sender_name: senderName,
        recipient_id: recipient.id,
        subject,
        body,
        parent_message_id: parentMessageId,
      })) || []

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No recipients found.' }, { status: 400 })
    }

    const { error: insertError } = await supabase
      .from('app_messages')
      .insert(rows)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  }

  const { data: recipientProfile, error: recipientError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', recipientId)
    .single()

  if (recipientError || !recipientProfile) {
    return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 })
  }

  const recipientRole = recipientProfile.role || 'member'

  if (!senderIsOwnerOrAdmin && !BOARD_ROLES.includes(recipientRole)) {
    return NextResponse.json(
      { error: 'Members can only send messages to board members.' },
      { status: 403 }
    )
  }

  const { error: insertError } = await supabase.from('app_messages').insert({
    sender_id: user.id,
    sender_name: senderName,
    recipient_id: recipientId,
    subject,
    body,
    parent_message_id: parentMessageId,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}