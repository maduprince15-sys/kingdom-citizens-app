import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

function formatRecordType(type: string) {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getRecordColor(type: string) {
  if (type === 'contribution') return 'border-green-700/50 bg-green-950/20 text-green-300'
  if (type === 'attendance') return 'border-blue-700/50 bg-blue-950/20 text-blue-300'
  if (type === 'task') return 'border-yellow-700/50 bg-yellow-950/20 text-yellow-300'
  if (type === 'service_role') return 'border-purple-700/50 bg-purple-950/20 text-purple-300'
  if (type === 'training') return 'border-cyan-700/50 bg-cyan-950/20 text-cyan-300'
  return 'border-gray-700/50 bg-gray-950/20 text-gray-300'
}

export default async function MyRecordsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: records, error: recordsError } = await supabase
    .from('member_activity_records')
    .select('*')
    .eq('user_id', user.id)
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const contributionTotal =
    records
      ?.filter((record) => record.record_type === 'contribution')
      .reduce((sum, record) => sum + Number(record.amount || 0), 0) ?? 0

  const attendanceCount =
    records?.filter((record) => record.record_type === 'attendance').length ?? 0

  const taskCount =
    records?.filter((record) => record.record_type === 'task').length ?? 0

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
                My Citizen Records
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                View your contribution records, attendance, assigned tasks, service roles,
                training participation, and other Citizens activity records.
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
        {recordsError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading records: {recordsError.message}
          </div>
        )}

        <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='rounded-2xl border border-green-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-green-400'>
              Contributions
            </p>
            <p className='mt-2 text-3xl font-bold text-white'>
              €{contributionTotal.toFixed(2)}
            </p>
          </div>

          <div className='rounded-2xl border border-blue-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-blue-400'>
              Attendance Records
            </p>
            <p className='mt-2 text-3xl font-bold text-white'>
              {attendanceCount}
            </p>
          </div>

          <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-400'>
              Task Records
            </p>
            <p className='mt-2 text-3xl font-bold text-white'>
              {taskCount}
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          {records?.map((record) => (
            <article
              key={record.id}
              className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 shadow-lg shadow-black/30'
            >
              <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRecordColor(record.record_type)}`}>
                    {formatRecordType(record.record_type)}
                  </span>

                  <h2 className='mt-3 text-2xl font-bold'>
                    {record.title}
                  </h2>

                  {record.description && (
                    <p className='mt-2 text-sm leading-7 text-gray-300'>
                      {record.description}
                    </p>
                  )}
                </div>

                <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4 text-sm text-gray-300 md:min-w-48'>
                  {record.event_date && (
                    <p>
                      <span className='text-yellow-400'>Date:</span> {record.event_date}
                    </p>
                  )}

                  {record.status && (
                    <p className='mt-1'>
                      <span className='text-yellow-400'>Status:</span> {record.status}
                    </p>
                  )}

                  {record.record_type === 'contribution' && (
                    <p className='mt-1'>
                      <span className='text-yellow-400'>Amount:</span>{' '}
                      {record.currency || 'EUR'} {Number(record.amount || 0).toFixed(2)}
                    </p>
                  )}

                  {record.purpose && (
                    <p className='mt-1'>
                      <span className='text-yellow-400'>Purpose:</span> {record.purpose}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}

          {records?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No records have been added for your account yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}