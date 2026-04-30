import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import GroupsManager from './GroupsManager'

export default async function AdminGroupsPage() {
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

  const role = profile?.role || 'member'

  if (!['admin', 'moderator', 'teacher'].includes(role)) {
    redirect('/dashboard')
  }

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('full_name', { ascending: true })

  const { data: groups } = await supabase
    .from('citizen_groups')
    .select('id, name, description, group_type, leader_id, is_active, created_at')
    .order('created_at', { ascending: false })

  const { data: groupMembers } = await supabase
    .from('citizen_group_members')
    .select('id, group_id, user_id, role_in_group')
    .order('joined_at', { ascending: false })

  return (
    <main className='min-h-screen bg-[#050303] p-4 text-white md:p-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-8 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
              The Kingdom Citizens
            </p>

            <h1 className='mt-2 text-3xl font-bold md:text-5xl'>
              Manage Groups
            </h1>

            <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-400'>
              Create training groups, Bible study groups, prayer teams, new members classes,
              and other Kingdom Citizens groups.
            </p>
          </div>

          <Link
            href='/dashboard'
            className='rounded-full border border-yellow-700 px-4 py-2 text-yellow-300'
          >
            Dashboard
          </Link>
        </div>

        <GroupsManager
          members={members || []}
          groups={groups || []}
          groupMembers={groupMembers || []}
          currentUserId={user.id}
        />
      </div>
    </main>
  )
}