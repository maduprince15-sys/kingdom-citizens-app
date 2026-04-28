import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, email, phone, role')
    .eq('id', user.id)
    .single()

  if (error) {
    return (
      <main className='min-h-screen bg-[#050303] p-4 text-white md:p-6'>
        <div className='mx-auto max-w-2xl'>
          <h1 className='text-3xl font-bold'>Profile</h1>
          <p className='mt-4 text-red-400'>Error loading profile: {error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-4xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <h1 className='mt-3 text-3xl font-bold md:text-5xl'>
            Profile Settings
          </h1>

          <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base'>
            Update your member information. Your email is used for login and confirmation;
            your phone number is only displayed in your member profile.
          </p>
        </div>
      </section>

      <section className='mx-auto max-w-4xl px-4 py-8 md:px-8'>
        <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-6'>
          <ProfileForm
            initialFullName={profile?.full_name || ''}
            initialPhone={profile?.phone || ''}
            email={profile?.email || user.email || ''}
            role={profile?.role || 'member'}
          />
        </div>
      </section>
    </main>
  )
}