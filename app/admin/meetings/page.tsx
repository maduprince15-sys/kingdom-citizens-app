import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import MeetingForm from './MeetingForm'

export default async function AdminMeetingsPage() {
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

  if (!['owner', 'admin', 'moderator'].includes(role)) {
    redirect('/dashboard')
  }

  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: true })

  return (
    <main className='min-h-screen bg-[#050303] p-4 text-white md:p-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-8 flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
              The Kingdom Citizens
            </p>
            <h1 className='mt-2 text-3xl font-bold md:text-5xl'>
              Manage Meetings
            </h1>
            <p className='mt-3 text-sm text-gray-400'>
              Add, edit, or remove live meeting links, dates, and times.
            </p>
          </div>

          <Link href='/dashboard' className='rounded-full border border-yellow-700 px-4 py-2 text-yellow-300'>
            Dashboard
          </Link>
        </div>

        {meetingsError && <p className='mb-4 text-red-400'>{meetingsError.message}</p>}

        <MeetingForm meetings={meetings || []} />
      </div>
    </main>
  )
}