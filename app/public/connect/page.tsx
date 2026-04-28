import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicConnectPage() {
  const supabase = await createClient()

  const { data: links, error } = await supabase
    .from('social_links')
    .select('*')

  return (
    <main className='min-h-screen bg-[#070303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-[#1b0707] via-[#090505] to-black px-4 py-6 md:px-8'>
        <div className='mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
              The Kingdom Citizens
            </p>

            <h1 className='mt-2 text-3xl font-bold md:text-5xl'>
              Connect With Us
            </h1>

            <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base'>
              Follow The Kingdom Citizens through our official channels, teaching platforms,
              music channels, and public ministry links.
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
              href='/public/announcements'
              className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400'
            >
              Announcements
            </Link>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        {error && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading links: {error.message}
          </div>
        )}

        <div className='mb-8 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-6'>
          <p className='text-xs uppercase tracking-[0.3em] text-yellow-500'>
            Official Links
          </p>

          <h2 className='mt-2 text-2xl font-bold'>Stay Connected</h2>

          <p className='mt-3 max-w-3xl text-sm leading-6 text-gray-300'>
            These are the public links connected to The Kingdom Citizens. Use them to
            follow teachings, music, public updates, and ministry communication.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
          {links?.map((item: any, index: number) => {
            const title =
              item.platform_name ??
              item.title ??
              item.name ??
              'Kingdom Citizens Link'

            const description =
              item.description ??
              item.notes ??
              'Official public link for The Kingdom Citizens.'

            const url =
              item.url ??
              item.link ??
              item.href

            return (
              <article
                key={item.id ?? url ?? index}
                className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-[#050303] p-5 shadow-lg shadow-black/30'
              >
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-xl font-bold text-black'>
                  KC
                </div>

                <h2 className='text-xl font-bold text-white'>{title}</h2>

                <p className='mt-3 text-sm leading-6 text-gray-300'>
                  {description}
                </p>

                {url && (
                  <p className='mt-5'>
                    <a
                      href={url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-block rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400'
                    >
                      Open Link
                    </a>
                  </p>
                )}
              </article>
            )
          })}

          {links?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No public links yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}