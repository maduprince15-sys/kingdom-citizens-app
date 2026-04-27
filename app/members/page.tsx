import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import DeleteUserButton from './DeleteUserButton'

export default async function MembersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = currentProfile?.role === 'admin'

  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className='p-6 text-white'>
        <h1 className='text-2xl font-bold'>Members</h1>
        <p className='mt-4'>Error loading members: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='p-6 text-white'>
      <h1 className='text-2xl font-bold'>Members</h1>

      <div className='mt-6 overflow-x-auto'>
        <table className='min-w-full border border-gray-700'>
          <thead className='bg-gray-800'>
            <tr>
              <th className='border border-gray-700 px-4 py-2 text-left'>Full Name</th>
              <th className='border border-gray-700 px-4 py-2 text-left'>Email</th>
              <th className='border border-gray-700 px-4 py-2 text-left'>Phone</th>
              <th className='border border-gray-700 px-4 py-2 text-left'>Role</th>
              {isAdmin && (
                <th className='border border-gray-700 px-4 py-2 text-left'>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => (
              <tr key={member.id}>
                <td className='border border-gray-700 px-4 py-2'>{member.full_name || 'No name yet'}</td>
                <td className='border border-gray-700 px-4 py-2'>{member.email}</td>
                <td className='border border-gray-700 px-4 py-2'>{member.phone || '-'}</td>
                <td className='border border-gray-700 px-4 py-2'>{member.role}</td>
                {isAdmin && (
                  <td className='border border-gray-700 px-4 py-2'>
                    {member.id === user.id ? (
                      <span className='text-sm text-gray-400'>Use dashboard delete</span>
                    ) : (
                      <DeleteUserButton userId={member.id} email={member.email} />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
