import Link from 'next/link'
import PublicHeader from '../../components/PublicHeader'
import PublicFooter from '../../components/PublicFooter'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicGivingPage() {
  const supabase = await createClient()

  const { data: options, error } = await supabase
    .from('giving_options')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <main className='min-h-screen bg-[#050303] pb-36 text-white md:pb-0'>
      <PublicHeader />

      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-10 md:px-8'>
        <div className='mx-auto max-w-6xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <h1 className='mt-3 text-4xl font-bold md:text-6xl'>
            Giving
          </h1>

          <p className='mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base'>
            Make for yourselves eternal wealth with unrighteous mammon, and store your
treasure where moth, rust, and decay cannot destroy. Give through the approved
options listed below.
          </p>

        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-10 pb-36 md:px-8 md:pb-10'>
        {error && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading giving options: {error.message}
          </div>
        )}

        <div className='mb-8 rounded-2xl border border-yellow-900/40 bg-[#120707] p-6'>
          <p className='text-xs uppercase tracking-[0.3em] text-yellow-500'>
            Stewardship
          </p>

          <h2 className='mt-2 text-2xl font-bold text-yellow-300'>
            Give willingly and with understanding
          </h2>

          <p className='mt-3 max-w-3xl text-sm leading-7 text-gray-300'>
            Earthly wealth can serve eternal purpose when it is submitted to God. Use only
the official giving options displayed on this page.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {options?.map((option) => (
            <article
              key={option.id}
              className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-[#050303] p-6 shadow-lg shadow-black/30'
            >
              <div className='mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-lg font-black text-black'>
                KC
              </div>

              <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                {option.method || 'Giving Option'}
              </p>

              <h2 className='mt-3 text-2xl font-bold text-white'>
                {option.title}
              </h2>

              {option.description && (
                <p className='mt-3 text-sm leading-7 text-gray-300'>
                  {option.description}
                </p>
              )}

              {option.account_details && (
                <div className='mt-5 rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
                  <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
                    Details
                  </p>

                  <p className='mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300'>
                    {option.account_details}
                  </p>
                </div>
              )}

              {option.giving_url && (
                <a
                  href={option.giving_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-5 inline-block rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400'
                >
                  Give Now
                </a>
              )}
            </article>
          ))}

          {options?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No giving options are available yet.
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}