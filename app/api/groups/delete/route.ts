import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'
import { resourceIdPattern } from '../../../../lib/messaging/access'

export async function POST(request: Request) {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!['owner', 'admin'].includes(profile?.role || '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let input
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid group.' }, { status: 400 }) }
  if (!resourceIdPattern.test(input?.groupId || '')) return NextResponse.json({ error: 'Invalid group.' }, { status: 400 })
  const { error: deleteError } = await client.from('citizen_groups').delete().eq('id', input.groupId)
  if (deleteError) return NextResponse.json({ error: 'Could not delete the group.' }, { status: 503 })
  return NextResponse.json({ success: true })
}
