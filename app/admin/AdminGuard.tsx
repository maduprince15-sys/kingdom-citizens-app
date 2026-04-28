import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export async function requireOwnerOrAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'member'

  if (!['owner', 'admin'].includes(role)) {
    redirect('/dashboard')
  }

  return { supabase, user, role }
}