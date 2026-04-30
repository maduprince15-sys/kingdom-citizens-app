import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type BirthdayProfile = {
  id: string
  full_name: string | null
  email: string | null
  birthday_month: number | null
  birthday_day: number | null
  show_birthday: boolean | null
}

function getMonthName(month: number | null) {
  if (!month || month < 1 || month > 12) return ''
  return months[month - 1]
}

function getBirthdaySortValue(profile: BirthdayProfile) {
  const month = profile.birthday_month ?? 99
  const day = profile.birthday_day ?? 99
  return month * 100 + day
}

export default async function BirthdaysPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  const { data: birthdays, error: birthdaysError } = await supabase
    .from('profiles')
    .select('id, full_name, email, birthday_month, birthday_day, show_birthday')
    .eq('show_birthday', true)
    .not('birthday_month', 'is', null)
    .not('birthday_day', 'is', null)

  const visibleBirthdays = (birthdays || []).sort(
    (a, b) => getBirthdaySortValue(a) - getBirthdaySortValue(b)
  )

  const todaysBirthdays = visibleBirthdays.filter(
    (profile) =>
      profile.birthday_month === currentMonth &&
      profile.birthday_day === currentDay
  )

  const thisMonthBirthdays = visibleBirthdays.filter(
    (profile) => profile.birthday_month === currentMonth
  )

  const upcomingBirthdays = visibleBirthdays.filter((profile) => {
    if (!profile.birthday_month || !profile.birthday_day) return false

    if (profile.birthday_month > currentMonth) return true

    if (
      profile.birthday_month === currentMonth &&
      profile.birthday_day >= currentDay
    ) {
      return true
    }

    return false
  })

  const displayList =
    upcomingBirthdays.length > 0 ? upcomingBirthdays : visibleBirthdays

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
                Birthdays
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                Celebrate Citizens by birthday month and day. Birth years are not collected or displayed.
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
        {birthdaysError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading birthdays: {birthdaysError.message}
          </div>
        )}

        <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Today
            </p>
            <p className='mt-2 text-3xl font-bold text-white'>
              {todaysBirthdays.length}
            </p>
          </div>

          <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              This Month
            </p>
            <p className='mt-2 text-3xl font-bold text-white'>
              {thisMonthBirthdays.length}
            </p>
          </div>

          <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Shared Birthdays
            </p>
            <p className='mt-2 text-3xl font-bold text-white'>
              {visibleBirthdays.length}
            </p>
          </div>
        </div>

        {todaysBirthdays.length > 0 && (
          <div className='mb-8 rounded-3xl border border-yellow-700/60 bg-gradient-to-br from-yellow-500/20 to-red-900/20 p-6'>
            <p className='text-xs uppercase tracking-[0.3em] text-yellow-400'>
              Today&apos;s Birthday
            </p>

            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
              {todaysBirthdays.map((profile) => (
                <div
                  key={profile.id}
                  className='rounded-2xl border border-yellow-900/40 bg-black/30 p-5'
                >
                  <h2 className='text-2xl font-bold'>
                    {profile.full_name || profile.email || 'Citizen'}
                  </h2>

                  <p className='mt-2 text-yellow-300'>
                    {getMonthName(profile.birthday_month)} {profile.birthday_day}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='mb-5'>
          <h2 className='text-2xl font-bold'>
            Upcoming Birthdays
          </h2>

          <p className='mt-2 text-sm leading-6 text-gray-400'>
            Showing upcoming birthdays from today onward. If none remain this year, the list starts again from January.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
          {displayList.map((profile) => (
            <article
              key={profile.id}
              className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 shadow-lg shadow-black/30'
            >
              <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                Birthday
              </p>

              <h3 className='mt-3 text-2xl font-bold'>
                {profile.full_name || profile.email || 'Citizen'}
              </h3>

              <p className='mt-3 text-lg font-bold text-yellow-300'>
                {getMonthName(profile.birthday_month)} {profile.birthday_day}
              </p>
            </article>
          ))}

          {displayList.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No shared birthdays yet. Members can enable birthday visibility from Profile Settings.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}