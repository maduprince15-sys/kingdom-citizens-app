import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import DeleteAccountConfirm from './DeleteAccountConfirm'

export default async function DeleteAccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <main className='min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
      <section className='border-b border-red-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-4xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-red-400'>
            Account Protection
          </p>

          <h1 className='mt-3 text-3xl font-bold md:text-5xl'>
            Delete Account
          </h1>

          <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
            This page is separated from the main dashboard to prevent accidental account deletion.
          </p>

          <Link
            href='/dashboard'
            className='mt-5 inline-block rounded-full border border-yellow-700 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-900/20'
          >
            Back to Dashboard
          </Link>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 py-8 md:px-8'>
        <DeleteAccountConfirm />
      </section>
    </main>
  )
}