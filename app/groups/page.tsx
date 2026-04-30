import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export default async function GroupsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: memberships } = await supabase
    .from('citizen_group_members')
    .select('id, role_in_group, group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships || []).map((item) => item.group_id)

  const { data: groups } =
    groupIds.length > 0
      ? await supabase
          .from('citizen_groups')
          .select('id, name, description, group_type, leader_id, is_active, created_at')
          .in('id', groupIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      : { data: [] }

  function getRoleForGroup(groupId: string) {
    return memberships?.find((item) => item.group_id === groupId)?.role_in_group || 'member'
  }

  return (
    <main className='min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-6xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold md:text-5xl'>
                My Groups
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                View your Bible study groups, training groups, prayer teams, and other Citizens groups.
              </p>
            </div>

            <Link
              href='/dashboard'
              className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20'
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
          {groups?.map((group) => (
            <article
              key={group.id}
              className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 shadow-lg shadow-black/30'
            >
              <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                {group.group_type || 'general'}
              </p>

              <h2 className='mt-3 text-2xl font-bold'>
                {group.name}
              </h2>

              {group.description && (
                <p className='mt-3 text-sm leading-7 text-gray-300'>
                  {group.description}
                </p>
              )}

              <div className='mt-5 rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
                <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
                  Your Group Role
                </p>
                <p className='mt-2 capitalize text-gray-200'>
                  {getRoleForGroup(group.id)}
                </p>
              </div>
            </article>
          ))}

          {groups?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              You have not been added to any active group yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}