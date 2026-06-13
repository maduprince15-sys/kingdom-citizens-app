import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { canPostAnnouncements } from '../../../../lib/permissions'
import { sendPushToUsers } from '../../../../lib/push-notifications'

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

  if (profileError || !profile || !canPostAnnouncements(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const type = String(body?.type || '').trim()
  const title = String(body?.title || '').trim().slice(0, 80)

  if (type !== 'announcement') {
    return NextResponse.json(
      { error: 'Only announcement push can be sent from this route.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data: recipients, error: recipientsError } = await admin
    .from('profiles')
    .select('id')

  if (recipientsError) {
    return NextResponse.json({ error: 'Could not load recipients.' }, { status: 400 })
  }

  const result = await sendPushToUsers({
    supabase: admin,
    userIds: recipients?.map((recipient) => recipient.id) || [],
    title: 'Kingdom Citizens',
    body: title || 'New announcement',
    data: {
      type: 'announcement',
      href: '/announcements',
    },
  })

  return NextResponse.json({
    success: true,
    configured: result.configured,
    successCount: result.successCount,
    failureCount: result.failureCount,
    tokenCount: result.tokenCount,
  })
}

