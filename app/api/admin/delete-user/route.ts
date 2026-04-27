import { NextResponse } from 'next/server'
import { createClient as createRequestClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createRequestClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || currentProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const targetUserId = body?.targetUserId

  if (!targetUserId) {
    return NextResponse.json({ error: 'Missing target user id.' }, { status: 400 })
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: 'Use Delete My Account to remove your own account.' },
      { status: 400 }
    )
  }

  try {
    const admin = createAdminClient()

    const { error: deleteProfileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', targetUserId)

    if (deleteProfileError) {
      return NextResponse.json({ error: deleteProfileError.message }, { status: 400 })
    }

    const { error: authError } = await admin.auth.admin.deleteUser(targetUserId, false)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
