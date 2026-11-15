import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import ChatRoom from '../../chat/ChatRoom'

export default async function StudyDiscussionPage() {
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
    .eq('chat_room', 'study-general')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <main className='min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-6xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            Study Center
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold md:text-5xl'>
                Bible Study Discussion
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base'>
                A members-only discussion room for Bible study, doctrine questions,
                lesson reflections, and spiritual formation conversations.
              </p>

              <p className='mt-3 max-w-2xl text-xs leading-5 text-gray-500'>
                Public visitors can read Study Center resources, but discussion is available
                only to signed-in Citizens.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                href='/study'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Study Center
              </Link>

              <Link
                href='/dashboard'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        {messagesError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Could not load study discussion. Please try again.
          </div>
        )}

        <ChatRoom
          messages={messages || []}
          currentUserId={user.id}
          currentUserName={currentUserName}
          currentUserRole={role}
          canModerate={canModerate}
          chatRoom='study-general'
          label='Bible Study Discussion'
          title='Study Center Group Discussion'
          subtitle='Members-only Bible study discussion'
          badgeText='BS'
          placeholder='Ask a study question or share a reflection...'
        />
      </section>
    </main>
  )
}