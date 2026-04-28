import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import MessageForm from './MessageForm'

export default async function NewMessagePage() {
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

  if (!['owner', 'admin'].includes(role)) {
    return (
      <main className='min-h-screen bg-[#050303] p-4 text-white md:p-8'>
        <div className='mx-auto max-w-3xl'>
          <h1 className='text-3xl font-bold'>Access denied</h1>
          <p className='mt-3 text-gray-300'>
            Only owners and admins can send messages.
          </p>
          <Link href='/messages' className='mt-4 inline-block text-yellow-300 underline'>
            Back to Messages
          </Link>
        </div>
      </main>
    )
  }

  const { data: recipients } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .order('created_at', { ascending: false })

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
            Send a message to one member or broadcast to all members.
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 py-8 md:px-8'>
        <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-7'>
          <MessageForm recipients={recipients || []} />
        </div>

        <Link href='/messages' className='mt-6 inline-block text-yellow-300 underline'>
          Back to Messages
        </Link>
      </section>
    </main>
  )
}