import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function MessageDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: message, error } = await supabase
    .from('app_messages')
    .select('id, subject, body, read_at, created_at, sender_id, recipient_id')
    .eq('id', id)
    .single()

  if (error || !message) {
    return (
      <main className='min-h-screen bg-[#050303] p-4 text-white md:p-8'>
        <div className='mx-auto max-w-3xl'>
          <h1 className='text-3xl font-bold'>Message not found</h1>
          <Link href='/messages' className='mt-4 inline-block text-yellow-300 underline'>
            Back to Messages
          </Link>
        </div>
      </main>
    )
  }

  if (message.recipient_id === user.id && !message.read_at) {
    await supabase
      .from('app_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', message.id)
      .eq('recipient_id', user.id)
  }

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-4xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <h1 className='mt-3 text-3xl font-bold md:text-5xl'>
            Message
          </h1>

          <p className='mt-3 text-sm text-gray-400'>
            {new Date(message.created_at).toLocaleString()}
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 py-8 md:px-8'>
        <article className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-7'>
          <h2 className='text-2xl font-bold md:text-4xl'>{message.subject}</h2>

          <div className='mt-6 whitespace-pre-wrap text-base leading-8 text-gray-200'>
            {message.body}
          </div>
        </article>

        <Link href='/messages' className='mt-6 inline-block text-yellow-300 underline'>
          Back to Messages
        </Link>
      </section>
    </main>
  )
}