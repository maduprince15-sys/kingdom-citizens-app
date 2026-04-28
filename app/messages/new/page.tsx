import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import MessageForm from './MessageForm'

type Props = {
  searchParams: Promise<{
    recipient?: string
    subject?: string
    parent?: string
  }>
}

export default async function NewMessagePage({ searchParams }: Props) {
  const params = await searchParams
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
  const canBroadcast = role === 'owner' || role === 'admin'

  const query = supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .neq('id', user.id)
    .order('created_at', { ascending: false })

  const { data: recipients } = canBroadcast
    ? await query
    : await query.in('role', ['owner', 'admin', 'moderator', 'teacher'])

  const defaultSubject = params.subject
    ? decodeURIComponent(params.subject)
    : ''

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-4xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <h1 className='mt-3 text-3xl font-bold md:text-5xl'>
            Send Message
          </h1>

          <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
            {canBroadcast
              ? 'Send a direct message to one member or broadcast to all members.'
              : 'Send a message to The Kingdom Citizens board members.'}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 py-8 md:px-8'>
        <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-7'>
          <MessageForm
            recipients={recipients || []}
            canBroadcast={canBroadcast}
            defaultRecipientId={params.recipient || (canBroadcast ? 'all' : recipients?.[0]?.id || '')}
            defaultSubject={defaultSubject}
            parentMessageId={params.parent}
          />
        </div>

        <Link href='/messages' className='mt-6 inline-block text-yellow-300 underline'>
          Back to Messages
        </Link>
      </section>
    </main>
  )
}