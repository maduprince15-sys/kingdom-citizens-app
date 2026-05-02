import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

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
  const messageId = body?.messageId

  if (!messageId) {
    return NextResponse.json({ error: 'Message ID is required.' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Could not load your profile.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: chatMessage, error: messageError } = await admin
    .from('chat_messages')
    .select('id, sender_id, is_deleted')
    .eq('id', messageId)
    .single()

  if (messageError || !chatMessage) {
    return NextResponse.json({ error: 'Chat message not found.' }, { status: 404 })
  }

  if (chatMessage.is_deleted) {
    return NextResponse.json({ success: true })
  }

  const role = profile.role || 'member'
  const canModerate = role === 'admin' || role === 'moderator'
  const ownsMessage = chatMessage.sender_id === user.id

  if (!canModerate && !ownsMessage) {
    return NextResponse.json(
      { error: 'You can only delete your own messages.' },
      { status: 403 }
    )
  }

  const { error: updateError } = await admin
    .from('chat_messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq('id', messageId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}