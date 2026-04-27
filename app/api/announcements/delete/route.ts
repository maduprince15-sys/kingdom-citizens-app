import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { canModeratePosts } from '../../../../lib/permissions'
import { getStoragePathFromPublicUrl } from '../../../../lib/storage'

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

  const body = await request.json()
  const id = body?.id

  if (!id) {
    return NextResponse.json({ error: 'Missing announcement id.' }, { status: 400 })
  }

  const { data: announcement, error: loadError } = await supabase
    .from('app_announcements')
    .select('id, author_id, image_url')
    .eq('id', id)
    .single()

  if (loadError || !announcement) {
    return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 })
  }

  const canDelete = canModeratePosts(profile.role) || announcement.author_id === user.id

  if (!canDelete) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const imagePath = getStoragePathFromPublicUrl(announcement.image_url, 'content-media')

  const { error: deleteError } = await admin
    .from('app_announcements')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  if (imagePath) {
    await admin.storage.from('content-media').remove([imagePath])
  }

  return NextResponse.json({ success: true })
}