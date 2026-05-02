import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { canPostAnnouncements } from '../../../../lib/permissions'

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
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Could not load profile.' }, { status: 400 })
  }

  if (!canPostAnnouncements(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const title = body?.title?.trim()
  const content = body?.content?.trim()
  const image_url = body?.image_url?.trim() || null
  const video_url = body?.video_url?.trim() || null
  const expires_at = body?.expires_at || null

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
  }

  let validExpiresAt = null

  if (expires_at) {
    const parsedDate = new Date(expires_at)

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid expiry date.' }, { status: 400 })
    }

    validExpiresAt = parsedDate.toISOString()
  }

  const admin = createAdminClient()

  const { error } = await admin.from('app_announcements').insert({
    title,
    content,
    image_url,
    video_url,
    expires_at: validExpiresAt,
    is_archived: false,
    author_id: user.id,
    author_name: profile.full_name || user.email || 'Kingdom Citizens',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}