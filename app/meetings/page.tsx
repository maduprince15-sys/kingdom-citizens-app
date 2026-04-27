import { createClient } from '../../lib/supabase/server'

export default async function MeetingsPage() {
  const supabase = await createClient()

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('id, title, platform, meeting_url, description, meeting_date, meeting_time, host_name')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className='p-6 text-white'>
        <h1 className='text-3xl font-bold'>Meetings</h1>
        <p className='mt-4 text-red-400'>Error loading meetings: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='p-6 text-white'>
      <h1 className='text-3xl font-bold'>Meetings</h1>
      <p className='mt-2 text-gray-300'>
        Join upcoming Kingdom Citizens meetings and live sessions.
      </p>

      <div className='mt-6 space-y-6'>
        {meetings?.length ? (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className='rounded-xl border border-gray-700 bg-gray-900 p-5 shadow'
            >
              <h2 className='text-2xl font-semibold'>{meeting.title}</h2>

              <div className='mt-3 space-y-1 text-sm text-gray-300'>
                <p><span className='font-semibold text-white'>Platform:</span> {meeting.platform}</p>
                <p><span className='font-semibold text-white'>Date:</span> {meeting.meeting_date || 'To be announced'}</p>
                <p><span className='font-semibold text-white'>Time:</span> {meeting.meeting_time || 'To be announced'}</p>
                <p><span className='font-semibold text-white'>Host:</span> {meeting.host_name || 'Kingdom Citizens'}</p>
              </div>

              {meeting.description && (
                <p className='mt-4 text-gray-300'>{meeting.description}</p>
              )}

              <a
                href={meeting.meeting_url}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-5 inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
              >
                Join Meeting
              </a>
            </div>
          ))
        ) : (
          <p className='text-gray-400'>No meetings available yet.</p>
        )}
      </div>
    </main>
  )
}
