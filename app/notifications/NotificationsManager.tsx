'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

type NotificationItem = {
  id: string
  title: string
  message: string | null
  notification_type: string
  link_url: string | null
  is_read: boolean
  created_at: string
}

type Props = {
  notifications: NotificationItem[]
}

export default function NotificationsManager({ notifications }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    router.refresh()
  }

  async function markUnread(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: false,
        read_at: null,
      })
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    router.refresh()
  }

  async function deleteNotification(id: string) {
    const confirmed = window.confirm('Delete this notification?')
    if (!confirmed) return

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    router.refresh()
  }

  return (
    <div className='space-y-4'>
      {notifications.map((item) => (
        <article
          key={item.id}
          className={
            item.is_read
              ? 'rounded-2xl border border-yellow-900/30 bg-[#120707] p-5 opacity-75'
              : 'rounded-2xl border border-yellow-600/60 bg-[#170707] p-5 shadow-lg shadow-yellow-950/30'
          }
        >
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <span className='rounded-full border border-yellow-900/40 bg-black/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-yellow-400'>
                  {item.notification_type}
                </span>

                {!item.is_read && (
                  <span className='rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black'>
                    New
                  </span>
                )}
              </div>

              <h2 className='mt-3 text-2xl font-bold'>
                {item.title}
              </h2>

              {item.message && (
                <p className='mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-300'>
                  {item.message}
                </p>
              )}

              <p className='mt-3 text-xs text-gray-500'>
                {new Date(item.created_at).toLocaleString()}
              </p>

              {item.link_url && (
                <Link
                  href={item.link_url}
                  className='mt-4 inline-block rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
                >
                  Open →
                </Link>
              )}
            </div>

            <div className='flex flex-wrap gap-2 md:min-w-48 md:justify-end'>
              {item.is_read ? (
                <button
                  onClick={() => markUnread(item.id)}
                  className='rounded border border-yellow-700 px-3 py-2 text-sm text-yellow-300'
                >
                  Mark Unread
                </button>
              ) : (
                <button
                  onClick={() => markRead(item.id)}
                  className='rounded bg-yellow-600 px-3 py-2 text-sm font-bold text-white'
                >
                  Mark Read
                </button>
              )}

              <button
                onClick={() => deleteNotification(item.id)}
                className='rounded bg-red-700 px-3 py-2 text-sm font-bold text-white'
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}

      {notifications.length === 0 && (
        <div className='rounded-2xl border border-yellow-900/30 bg-[#120707] p-6 text-gray-400'>
          You have no notifications yet.
        </div>
      )}
    </div>
  )
}