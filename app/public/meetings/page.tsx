import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicMeetingsPage() {
  const supabase = await createClient()

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')

  return (
    <main className='min-h-screen bg-black p-4 text-white md:p-6'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold'>Meetings</h1>
          <Link href='/' className='text-cyan-400 underline'>Back to Home</Link>
        </div>

        {error && <p className='text-red-400'>Error loading meetings: {error.message}</p>}

        <div className='space-y-4'>
          {meetings?.map((item: any, index: number) => (
            <article key={item.id ?? item.title ?? index} className='rounded border border-gray-700 p-4'>
              <h2 className='text-xl font-semibold'>{item.title ?? 'Meeting'}</h2>

              <div className='mt-2 space-y-1 text-gray-300'>
                {(item.platform ?? item.meeting_platform) && (
                  <p><strong>Platform:</strong> {item.platform ?? item.meeting_platform}</p>
                )}
                {(item.date_text ?? item.date) && (
                  <p><strong>Date:</strong> {item.date_text ?? item.date}</p>
                )}
                {(item.time_text ?? item.time) && (
                  <p><strong>Time:</strong> {item.time_text ?? item.time}</p>
                )}
                {item.host && (
                  <p><strong>Host:</strong> {item.host}</p>
                )}
                {(item.description ?? item.notes) && (
                  <p>{item.description ?? item.notes}</p>
                )}
              </div>

              {(item.meeting_url ?? item.url ?? item.link) && (
                <p className='mt-4'>
                  <a
                    href={item.meeting_url ?? item.url ?? item.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-cyan-400 underline'
                  >
                    Join Meeting
                  </a>
                </p>
              )}
            </article>
          ))}

          {meetings?.length === 0 && <p className='text-gray-400'>No meetings yet.</p>}
        </div>
      </div>
    </main>
  )
}