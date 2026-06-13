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
  const token = String(body?.token || '').trim()
  const platform = String(body?.platform || '').trim().toLowerCase()
  const deviceLabel = body?.deviceLabel
    ? String(body.deviceLabel).trim().slice(0, 160)
    : null

  if (!token || !['android', 'ios', 'web'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid push token.' }, { status: 400 })
  }

  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      user_id: user.id,
      token,
      platform,
      device_label: deviceLabel,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,token',
    }
  )

  if (error) {
    return NextResponse.json({ error: 'Could not register device.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

