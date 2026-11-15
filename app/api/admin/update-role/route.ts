import { NextResponse } from 'next/server'
import { createClient as createRequestClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import {
  ALL_ROLES,
  getAssignableRoles,
} from '../../../../lib/permissions'

export async function POST(request: Request) {
  const supabase = await createRequestClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (actorError || !actorProfile) {
    return NextResponse.json({ error: 'Could not load your role.' }, { status: 400 })
  }

  const actorRole = actorProfile.role

  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid role request.' }, { status: 400 })
  }
  const targetUserId = body?.targetUserId
  const newRole = body?.newRole

  if (!targetUserId || !newRole) {
    return NextResponse.json({ error: 'Missing target user or role.' }, { status: 400 })
  }

  if (!ALL_ROLES.includes(newRole)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: 'You cannot change your own role here.' },
      { status: 400 }
    )
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', targetUserId)
    .single()

  if (targetError || !targetProfile) {
    return NextResponse.json({ error: 'Target user not found.' }, { status: 404 })
  }

  if (targetProfile.role === 'owner') {
    return NextResponse.json(
      { error: 'Owner accounts are protected and cannot be changed here.' },
      { status: 403 }
    )
  }

  const assignableRoles = getAssignableRoles(actorRole)

  if (!assignableRoles.includes(newRole)) {
    return NextResponse.json(
      { error: `Your role cannot assign ${newRole}.` },
      { status: 403 }
    )
  }

  if (actorRole === 'owner') {
    const ownerCanChangeTarget =
      targetProfile.role === 'admin' ||
      targetProfile.role === 'member'

    if (!ownerCanChangeTarget) {
      return NextResponse.json(
        { error: 'Owners can only appoint members as admins or remove admins back to members.' },
        { status: 403 }
      )
    }
  }

  if (actorRole === 'admin') {
    if (targetProfile.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot change other admins.' },
        { status: 403 }
      )
    }

    if (newRole === 'admin' || newRole === 'owner') {
      return NextResponse.json(
        { error: 'Admins cannot assign admin or owner roles.' },
        { status: 403 }
      )
    }
  }

  try {
    const admin = createAdminClient()

    const { error: updateError } = await admin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (updateError) {
      return NextResponse.json({ error: 'Could not update the role.' }, { status: 503 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Role service temporarily unavailable.' }, { status: 503 })
  }
}