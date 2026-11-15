import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import ChatRoom from './ChatRoom'

export default async function ChatPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  const role = profile.role || 'member'
  const canModerate = role === 'admin' || role === 'moderator'
  const currentUserName =
    profile.full_name ||
    profile.email ||
    user.email ||
    'Citizen'

  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('id, sender_id, sender_name, sender_role, body, chat_room, is_deleted, created_at')
    .eq('chat_room', 'general')
    .order('created_at', { ascending: false })
    .limit(100)

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
                Group Chat
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base'>
                A members-only group discussion room for The Kingdom Citizens.
              </p>

              <p className='mt-3 max-w-2xl text-xs leading-5 text-gray-500'>
                Privacy model: authenticated-only access, Supabase RLS, HTTPS transport,
                and admin/moderator moderation.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                href='/dashboard'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Dashboard
              </Link>

              <Link
                href='/messages'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Private Messages
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        {messagesError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Could not load chat messages. Please try again.
          </div>
        )}

        <ChatRoom
  messages={messages || []}
  currentUserId={user.id}
  currentUserName={currentUserName}
  currentUserRole={role}
  canModerate={canModerate}
  chatRoom='general'
  label='General Group Chat'
  title='Citizens Discussion'
  subtitle='Members-only chat'
  badgeText='KC'
  placeholder='Write a message to the Citizens...'
/>
      </section>
    </main>
  )
}