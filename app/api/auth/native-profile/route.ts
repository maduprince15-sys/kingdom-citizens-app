import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : ''

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token)

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, role, phone, birthday_month, birthday_day, show_birthday')
    .eq('id', user.id)
    .maybeSingle()

  const birthdayMonth =
    user.user_metadata?.birthday_month !== undefined &&
    user.user_metadata?.birthday_month !== null
      ? Number(user.user_metadata.birthday_month)
      : existingProfile?.birthday_month ?? null

  const birthdayDay =
    user.user_metadata?.birthday_day !== undefined &&
    user.user_metadata?.birthday_day !== null
      ? Number(user.user_metadata.birthday_day)
      : existingProfile?.birthday_day ?? null

  const showBirthday =
    user.user_metadata?.show_birthday !== undefined &&
    user.user_metadata?.show_birthday !== null
      ? Boolean(user.user_metadata.show_birthday)
      : existingProfile?.show_birthday ?? true

  const { error: upsertError } = await admin.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.display_name ||
      'New Member',
    phone:
      existingProfile?.phone ||
      user.user_metadata?.phone_number ||
      user.user_metadata?.phone ||
      null,
    birthday_month: birthdayMonth,
    birthday_day: birthdayDay,
    show_birthday: showBirthday,
    role: existingProfile?.role || 'member',
  })

  if (upsertError) {
    return NextResponse.json({ error: 'Profile setup failed.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

