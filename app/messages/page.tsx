import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import ArchiveMessageButton from './ArchiveMessageButton'

export default async function MessagesPage() {
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
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'member'
  const canSend = ['owner', 'admin', 'moderator', 'teacher', 'member'].includes(role)

  const { data: messages, error } = await supabase
    .from('app_messages')
    .select('id, subject, body, read_at, created_at, sender_name, sender_id, recipient_id')
    .eq('recipient_id', user.id)
    .is('recipient_archived_at', null)
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
              <h1 className='text-3xl font-bold md:text-5xl'>Inbox</h1>
              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                Your member inbox for official and board communications.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                href='/dashboard'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Dashboard
              </Link>

              <Link
                href='/messages/sent'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Sent
              </Link>

              {canSend && (
                <Link
                  href='/messages/new'
                  className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
                >
                  New Message
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-5xl px-4 py-8 md:px-8'>
        {error && (
          <div className='rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading messages: {error.message}
          </div>
        )}

        <div className='space-y-4'>
          {messages?.map((message) => {
            const unread = !message.read_at

            return (
              <article
                key={message.id}
                className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-[#050303] p-5 shadow-lg shadow-black/30'
              >
                <Link href={`/messages/${message.id}`} className='block'>
                  <div className='flex flex-wrap items-center gap-2'>
                    {unread && (
                      <span className='rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold uppercase text-black'>
                        Unread
                      </span>
                    )}

                    <span className='rounded-full border border-yellow-900/60 px-3 py-1 text-xs text-yellow-300'>
                      Inbox
                    </span>
                  </div>

                  <h2 className='mt-4 text-xl font-bold'>{message.subject}</h2>

                  <p className='mt-2 text-sm text-gray-400'>
                    From: {message.sender_name || 'The Kingdom Citizens'}
                  </p>

                  <p className='mt-2 line-clamp-2 text-sm leading-6 text-gray-300'>
                    {message.body}
                  </p>

                  <p className='mt-4 text-xs text-gray-500'>
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </Link>

                <div className='mt-4'>
                  <ArchiveMessageButton id={message.id} box='inbox' />
                </div>
              </article>
            )
          })}

          {messages?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No inbox messages.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}