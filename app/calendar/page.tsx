import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export default async function CalendarPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: events, error: eventsError } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('is_public', true)
    .order('event_date', { ascending: true })

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-5xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold md:text-5xl'>Calendar</h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                Important dates, meetings, programs, and Kingdom Citizens appointments.
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

      <section className='mx-auto max-w-5xl px-4 py-8 md:px-8'>
        {eventsError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading calendar: {eventsError.message}
          </div>
        )}

        <div className='space-y-4'>
          {events?.map((event) => (
            <article
              key={event.id}
              className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-6'
            >
              <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    {event.event_date}
                  </p>

                  <h2 className='mt-2 text-2xl font-bold'>{event.title}</h2>

                  {(event.start_time || event.end_time) && (
                    <p className='mt-2 text-sm text-yellow-300'>
                      {event.start_time || 'Time TBA'}
                      {event.end_time ? ` - ${event.end_time}` : ''}
                    </p>
                  )}

                  {event.location && (
                    <p className='mt-2 text-sm text-gray-300'>
                      Location: {event.location}
                    </p>
                  )}

                  {event.description && (
                    <p className='mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-300'>
                      {event.description}
                    </p>
                  )}

                  {event.meeting_url && (
                    <a
                      href={event.meeting_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='mt-4 inline-block rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
                    >
                      Join / Open Link
                    </a>
                  )}
                </div>

                <a
                  href={`/api/calendar/ics?id=${event.id}`}
                  className='rounded-full border border-yellow-700 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-900/20'
                >
                  Add to Calendar
                </a>
              </div>
            </article>
          ))}

          {events?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No calendar events yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}