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
    <main className='p-4 md:p-6 text-white'>
      <h1 className='text-2xl font-bold'>Dashboard</h1>
      <p className='mt-2 break-all text-sm md:text-base'>
        You are logged in as: {user.email}
      </p>

      <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <Link href='/members' className='rounded bg-blue-600 px-4 py-3 text-center text-white'>Members</Link>
        <Link href='/books' className='rounded bg-green-600 px-4 py-3 text-center text-white'>Books</Link>
        <Link href='/connect' className='rounded bg-purple-600 px-4 py-3 text-center text-white'>Connect</Link>
        <Link href='/meetings' className='rounded bg-yellow-600 px-4 py-3 text-center text-white'>Meetings</Link>
        <Link href='/announcements' className='rounded bg-cyan-600 px-4 py-3 text-center text-white'>Announcements</Link>
        <Link href='/posts' className='rounded bg-pink-600 px-4 py-3 text-center text-white'>Posts</Link>
      </div>

      <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
        <LogoutButton />
        <DeleteAccountButton />
      </div>
    </main>
  )
}