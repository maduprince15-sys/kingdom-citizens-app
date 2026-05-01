import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import NotificationsManager from './NotificationsManager'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: notifications, error: notificationsError } = await supabase
    .from('notifications')
    .select('id, title, message, notification_type, link_url, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const unreadCount =
    notifications?.filter((item) => !item.is_read).length ?? 0

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
                Notifications
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base'>
                View app notifications, messages, reminders, approvals, and important Citizens updates.
              </p>

              <div className='mt-4 inline-flex rounded-full border border-yellow-900/40 bg-black/30 px-4 py-2 text-sm text-yellow-300'>
                {unreadCount} unread
              </div>
            </div>

            <Link
              href='/dashboard'
              className='rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm text-yellow-300 hover:bg-yellow-700/20'
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        {notificationsError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading notifications: {notificationsError.message}
          </div>
        )}

        <NotificationsManager notifications={notifications || []} />
      </section>
    </main>
  )
}