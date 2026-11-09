import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { canBroadcastMessages, canReceiveMemberMessages } from '../../../../lib/permissions'
import { sendPrivateMessagePush } from '../../../../lib/push-notifications'

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

  // Enforce a bounded JSON envelope before parsing or querying recipients.
  // Never log, echo, or store an invalid encrypted payload.
  const MAX_MESSAGE_BYTES = 64 * 1024
  if (Number(request.headers.get('content-length') || 0) > MAX_MESSAGE_BYTES) {
    return NextResponse.json({ error: 'Message exceeds the size limit.' }, { status: 413 })
  }
  let bodyData: Record<string, unknown>
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_MESSAGE_BYTES) {
      return NextResponse.json({ error: 'Message exceeds the size limit.' }, { status: 413 })
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Invalid JSON object')
    }
    bodyData = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON message.' }, { status: 400 })
  }

  const recipientId = bodyData.recipientId
  const subject = typeof bodyData.subject === 'string' ? bodyData.subject.trim() : ''
  const encryptedBody = typeof bodyData.encryptedBody === 'string' ? bodyData.encryptedBody.trim() : ''
  const parentMessageId = bodyData.parentMessageId == null ? null : bodyData.parentMessageId
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!subject || subject.length > 160 || !encryptedBody || !isEncryptedMessageBody(encryptedBody)) {
    return NextResponse.json({ error: 'A valid subject and encrypted message are required.' }, { status: 400 })
  }

  if (recipientId !== 'all' && (typeof recipientId !== 'string' || !uuid.test(recipientId))) {
    return NextResponse.json({ error: 'A valid recipient is required.' }, { status: 400 })
  }
  if (parentMessageId !== null && (typeof parentMessageId !== 'string' || !uuid.test(parentMessageId))) {
    return NextResponse.json({ error: 'Invalid reply reference.' }, { status: 400 })
  }

  const senderRole = senderProfile.role || 'member'
  const senderName =
    senderProfile.full_name ||
    senderProfile.email ||
    user.email ||
    'The Kingdom Citizens'

  const senderIsOwnerOrAdmin = canBroadcastMessages(senderRole)

  // The Preview has no server-side admin key: authentication and secure
  // message delivery must continue without privileged push notifications.
  const admin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null

  if (recipientId === 'all') {
    // A broadcast is a new thread for each recipient. Never attach it to
    // an unrelated private conversation, even when sent by an owner.
    if (parentMessageId !== null) {
      return NextResponse.json({ error: 'Broadcasts cannot reply to private messages.' }, { status: 400 })
    }
    if (!senderIsOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Only owners and admins can broadcast to all members.' },
        { status: 403 }
      )
    }

    const { data: recipients, error: recipientsError } = await supabase
.rpc('member_directory')
      .neq('id', user.id)

    if (recipientsError) {
      return NextResponse.json({ error: recipientsError.message }, { status: 400 })
    }

    const rows =
      recipients?.map((recipient: { id: string }) => ({
        sender_id: user.id,
        sender_name: senderName,
        recipient_id: recipient.id,
        subject,
        body: encryptedBody,
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

    const notificationRows =
      recipients?.map((recipient: { id: string }) => ({
        user_id: recipient.id,
        title: 'New Broadcast Message',
        message: 'New encrypted message',
        notification_type: 'message',
        link_url: '/messages',
        created_by: user.id,
      })) || []

    if (admin) {
      if (notificationRows.length > 0) {
        await admin.from('notifications').insert(notificationRows)
      }
      await sendPrivateMessagePush(admin, recipients?.map((recipient: { id: string }) => recipient.id) || [])
    }

    return NextResponse.json({ success: true })
  }

  const { data: recipientProfile, error: recipientError } = await supabase
.rpc('member_directory')
    .eq('id', recipientId)
    .single()

  if (recipientError || !recipientProfile) {
    return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 })
  }

  const recipientRole = (recipientProfile as { role?: string }).role || 'member'

  if (!senderIsOwnerOrAdmin && !canReceiveMemberMessages(recipientRole)) {
    return NextResponse.json(
      { error: 'Members can only send messages to board members.' },
      { status: 403 }
    )
  }

  if (parentMessageId !== null) {
    // Check the parent using the signed-in user's RLS-scoped client.
    // UUID syntax alone does not prove a reply belongs to this conversation.
    const { data: parent, error: parentError } = await supabase
      .from('app_messages')
      .select('sender_id, recipient_id')
      .eq('id', parentMessageId)
      .maybeSingle()

    if (parentError || !parent ||
      !(
        (parent.sender_id === user.id && parent.recipient_id === recipientId) ||
        (parent.sender_id === recipientId && parent.recipient_id === user.id)
      )) {
      return NextResponse.json({ error: 'Reply reference is not in this conversation.' }, { status: 403 })
    }
  }

  const { error: insertError } = await supabase.from('app_messages').insert({
    sender_id: user.id,
    sender_name: senderName,
    recipient_id: recipientId,
    subject,
    body: encryptedBody,
    parent_message_id: parentMessageId,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  if (admin) {
    await admin.from('notifications').insert({
      user_id: recipientId,
      title: 'New Message',
      message: 'New encrypted message',
      notification_type: 'message',
      link_url: '/messages',
      created_by: user.id,
    })
    await sendPrivateMessagePush(admin, [recipientId])
  }

  return NextResponse.json({ success: true })
}

function isEncryptedMessageBody(value: string) {
  try {
    const parsed = JSON.parse(value) as {
      encrypted?: unknown
      payload?: {
        version?: unknown
        algorithm?: unknown
        ciphertext?: unknown
        iv?: unknown
      }
    }

    return (
      parsed.encrypted === true &&
      parsed.payload?.version === 1 &&
      parsed.payload?.algorithm === 'AES-GCM' &&
      typeof parsed.payload.ciphertext === 'string' &&
      parsed.payload.ciphertext.length > 0 &&
      parsed.payload.ciphertext.length <= 60_000 &&
      typeof parsed.payload.iv === 'string' &&
      /^[A-Za-z0-9+/_-]{12,64}={0,2}$/.test(parsed.payload.iv)
    )
  } catch {
    return false
  }
}
