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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Could not load role.' }, { status: 400 })
  }

  if (!['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const bodyData = await request.json()
  const recipientId = bodyData?.recipientId
  const subject = String(bodyData?.subject || '').trim()
  const body = String(bodyData?.body || '').trim()

  if (!subject || !body) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
  }

  if (!recipientId) {
    return NextResponse.json({ error: 'Recipient is required.' }, { status: 400 })
  }

  if (recipientId === 'all') {
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
        recipient_id: recipient.id,
        subject,
        body,
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

  const { error: insertError } = await supabase.from('app_messages').insert({
    sender_id: user.id,
    recipient_id: recipientId,
    subject,
    body,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}