import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicMeetingsPage() {
  const supabase = await createClient()

  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#250a0a] px-4 py-6 md:px-8'>
        <div className='mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
              The Kingdom Citizens
            </p>

            <h1 className='mt-2 text-3xl font-bold md:text-5xl'>
              Meetings
            </h1>

            <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base'>
              Join The Kingdom Citizens for prayer, Bible study, teaching sessions,
              fellowship, and spiritual formation gatherings.
            </p>
          </div>

          <div className='flex flex-wrap gap-3'>
            <Link
              href='/'
              className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20'
            >
              Home
            </Link>

            <Link
              href='/public/connect'
              className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400'
            >
              Connect
            </Link>
          </div>
        </div>
      </section>

      <section className='mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:px-8 lg:grid-cols-[1fr_330px]'>
        <div className='space-y-5'>
          {error && (
            <div className='rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
              Error loading meetings: {error.message}
            </div>
          )}

          {meetings?.map((item: any, index: number) => {
            const title = item.title ?? 'Kingdom Citizens Meeting'
            const platform = item.platform ?? item.meeting_platform
            const date = item.date_text ?? item.date
            const time = item.time_text ?? item.time
            const host = item.host
            const description = item.description ?? item.notes
            const link = item.meeting_url ?? item.url ?? item.link

            return (
              <article
                key={item.id ?? title ?? index}
                className='overflow-hidden rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-[#050303] shadow-lg shadow-black/30'
              >
                <div className='border-b border-yellow-900/30 bg-[#1a0808] p-5 md:p-6'>
                  <p className='text-xs uppercase tracking-[0.3em] text-yellow-500'>
                    Meeting Invitation
                  </p>

                  <h2 className='mt-2 text-2xl font-bold md:text-3xl'>
                    {title}
                  </h2>
                </div>

                <div className='grid grid-cols-1 gap-4 p-5 md:grid-cols-2 md:p-6'>
                  {platform && (
                    <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
                        Platform
                      </p>
                      <p className='mt-2 font-semibold text-white'>{platform}</p>
                    </div>
                  )}

                  {date && (
                    <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
                        Date
                      </p>
                      <p className='mt-2 font-semibold text-white'>{date}</p>
                    </div>
                  )}

                  {time && (
                    <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
                        Time
                      </p>
                      <p className='mt-2 font-semibold text-white'>{time}</p>
                    </div>
                  )}

                  {host && (
                    <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
                      <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
                        Host
                      </p>
                      <p className='mt-2 font-semibold text-white'>{host}</p>
                    </div>
                  )}
                </div>

                {(description || link) && (
                  <div className='border-t border-yellow-900/30 p-5 md:p-6'>
                    {description && (
                      <p className='whitespace-pre-wrap text-sm leading-7 text-gray-300 md:text-base'>
                        {description}
                      </p>
                    )}

                    {link && (
                      <p className='mt-5'>
                        <a
                          href={link}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-block rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400'
                        >
                          Join Meeting
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </article>
            )
          })}

          {meetings?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No meetings yet.
            </div>
          )}
        </div>

        <aside className='h-fit rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
          <p className='text-xs uppercase tracking-[0.3em] text-yellow-500'>
            Gathering Rhythm
          </p>

          <h2 className='mt-2 text-xl font-bold'>
            Join With Readiness
          </h2>

          <p className='mt-3 text-sm leading-6 text-gray-300'>
            Meetings are part of the formation rhythm of The Kingdom Citizens.
            Come prepared with Scripture, prayer, expectation, and willingness to grow in Christ.
          </p>

          <div className='mt-5 space-y-3 border-t border-yellow-900/30 pt-5 text-sm text-gray-300'>
            <p>
              <span className='font-semibold text-yellow-300'>Sunday:</span> Service
            </p>
            <p>
              <span className='font-semibold text-yellow-300'>Thursday:</span> Bible Study
            </p>
            <p>
              <span className='font-semibold text-yellow-300'>Daily:</span> Individual Bible Study
            </p>
          </div>

          <div className='mt-5 border-t border-yellow-900/30 pt-5'>
            <Link href='/public/announcements' className='text-sm text-yellow-300 underline'>
              View official announcements
            </Link>
          </div>
        </aside>
      </section>
    </main>
  )
}