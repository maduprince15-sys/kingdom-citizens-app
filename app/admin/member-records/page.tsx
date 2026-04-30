import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import MemberRecordsManager from './MemberRecordsManager'

export default async function AdminMemberRecordsPage() {
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

  if (!['admin', 'finance', 'moderator', 'teacher'].includes(role)) {
    redirect('/dashboard')
  }

  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('full_name', { ascending: true })

  const { data: records } = await supabase
    .from('member_activity_records')
    .select('*')
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <main className='min-h-screen bg-[#050303] p-4 text-white md:p-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-8 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
              The Kingdom Citizens
            </p>

            <h1 className='mt-2 text-3xl font-bold md:text-5xl'>
              Manage Citizen Records
            </h1>

            <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-400'>
              Add and manage member activity records, including contributions, attendance, tasks,
              service roles, training, and notes.
            </p>
          </div>

          <Link
            href='/dashboard'
            className='rounded-full border border-yellow-700 px-4 py-2 text-yellow-300'
          >
            Dashboard
          </Link>
        </div>

        <MemberRecordsManager
          members={members || []}
          records={records || []}
          actorRole={role}
          currentUserId={user.id}
        />
      </div>
    </main>
  )
}