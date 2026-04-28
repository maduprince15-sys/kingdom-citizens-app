import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import PrayerForm from './PrayerForm'
import DeletePrayerButton from './DeletePrayerButton'
import PrayedButton from './PrayedButton'

export default async function PrayersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'member'

  const { data: prayers, error } = await supabase
    .from('prayer_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-5xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold md:text-5xl'>Prayer Wall</h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                Share prayer requests and stand with other members in prayer.
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

      <section className='mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 md:px-8 lg:grid-cols-[360px_1fr]'>
        <PrayerForm />

        <div className='space-y-4'>
          {error && <p className='text-red-400'>{error.message}</p>}

          {prayers?.map((prayer) => {
            const canDelete =
              prayer.author_id === user.id ||
              ['owner', 'admin', 'moderator'].includes(role)

            return (
              <article
                key={prayer.id}
                className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'
              >
                <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                  Prayer Request
                </p>

                <h2 className='mt-3 text-2xl font-bold'>{prayer.title}</h2>

                <p className='mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-300'>
                  {prayer.body}
                </p>

                <p className='mt-4 text-xs text-gray-500'>
                  By {prayer.author_name || 'Member'} ·{' '}
                  {new Date(prayer.created_at).toLocaleString()}
                </p>

                <div className='mt-4 flex flex-wrap items-center gap-3'>
                  <PrayedButton id={prayer.id} count={prayer.prayed_count || 0} />

                  {canDelete && <DeletePrayerButton id={prayer.id} />}
                </div>
              </article>
            )
          })}

          {prayers?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No prayer requests yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}