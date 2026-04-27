import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { canCreatePosts } from '../../../../lib/permissions'

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

  if (!canCreatePosts(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const title = body?.title?.trim()
  const content = body?.content?.trim()
  const image_url = body?.image_url?.trim() || null
  const video_url = body?.video_url?.trim() || null

  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 })
  }

  const { error } = await supabase.from('app_posts').insert({
    title,
    content,
    image_url,
    video_url,
    author_id: user.id,
    author_name: profile.full_name || user.email || 'Kingdom Citizens',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
