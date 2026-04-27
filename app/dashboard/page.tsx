import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import LogoutButton from './LogoutButton'
import DeleteAccountButton from './DeleteAccountButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <main className='p-6 text-white'>
      <h1 className='text-2xl font-bold'>Dashboard</h1>
      <p className='mt-2'>You are logged in as: {user.email}</p>

      <div className='mt-6 flex flex-wrap gap-4'>
        <Link href='/members' className='rounded bg-blue-600 px-4 py-2 text-white'>Members</Link>
        <Link href='/books' className='rounded bg-green-600 px-4 py-2 text-white'>Books</Link>
        <Link href='/connect' className='rounded bg-purple-600 px-4 py-2 text-white'>Connect</Link>
        <Link href='/meetings' className='rounded bg-yellow-600 px-4 py-2 text-white'>Meetings</Link>
      </div>

      <div className='mt-6 flex flex-wrap gap-4'>
        <LogoutButton />
        <DeleteAccountButton />
      </div>
    </main>
  )
}
