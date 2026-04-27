import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { canDeleteUsers, canManageRoles } from '../../lib/permissions'
import DeleteUserButton from './DeleteUserButton'
import RoleSelect from './RoleSelect'

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

  const actorRole = currentProfile?.role ?? 'member'
  const showRoleControls = canManageRoles(actorRole)
  const showDeleteControls = canDeleteUsers(actorRole)

  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className='p-4 md:p-6 text-white'>
        <h1 className='text-2xl font-bold'>Members</h1>
        <p className='mt-4'>Error loading members: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='p-4 md:p-6 text-white'>
      <h1 className='text-2xl font-bold'>Members</h1>

      <div className='mt-6 space-y-4 md:hidden'>
        {members?.map((member) => (
          <div key={member.id} className='rounded border border-gray-700 p-4'>
            <div className='space-y-2'>
              <div>
                <p className='text-xs text-gray-400'>Full Name</p>
                <p>{member.full_name || 'No name yet'}</p>
              </div>

              <div>
                <p className='text-xs text-gray-400'>Email</p>
                <p className='break-all'>{member.email}</p>
              </div>

              <div>
                <p className='text-xs text-gray-400'>Phone</p>
                <p>{member.phone || '-'}</p>
              </div>

              <div>
                <p className='text-xs text-gray-400'>Role</p>
                {showRoleControls && member.id !== user.id ? (
                  <RoleSelect
                    userId={member.id}
                    email={member.email}
                    currentRole={member.role}
                    actorRole={actorRole}
                  />
                ) : (
                  <p>{member.role}</p>
                )}
              </div>

              {(showRoleControls || showDeleteControls) && (
                <div className='pt-2'>
                  {member.id === user.id ? (
                    <span className='text-sm text-gray-400'>Use dashboard delete</span>
                  ) : showDeleteControls ? (
                    member.role === 'owner' ? (
                      <span className='text-sm text-gray-400'>Protected owner</span>
                    ) : (
                      <DeleteUserButton userId={member.id} email={member.email} />
                    )
                  ) : (
                    <span className='text-sm text-gray-400'>Role management only</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className='mt-6 hidden overflow-x-auto md:block'>
        <table className='min-w-full border border-gray-700'>
          <thead className='bg-gray-800'>
            <tr>
              <th className='border border-gray-700 px-4 py-2 text-left'>Full Name</th>
              <th className='border border-gray-700 px-4 py-2 text-left'>Email</th>
              <th className='border border-gray-700 px-4 py-2 text-left'>Phone</th>
              <th className='border border-gray-700 px-4 py-2 text-left'>Role</th>
              {(showRoleControls || showDeleteControls) && (
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
                <td className='border border-gray-700 px-4 py-2'>
                  {showRoleControls && member.id !== user.id ? (
                    <RoleSelect
                      userId={member.id}
                      email={member.email}
                      currentRole={member.role}
                      actorRole={actorRole}
                    />
                  ) : (
                    member.role
                  )}
                </td>
                {(showRoleControls || showDeleteControls) && (
                  <td className='border border-gray-700 px-4 py-2'>
                    {member.id === user.id ? (
                      <span className='text-sm text-gray-400'>Use dashboard delete</span>
                    ) : showDeleteControls ? (
                      member.role === 'owner' ? (
                        <span className='text-sm text-gray-400'>Protected owner</span>
                      ) : (
                        <DeleteUserButton userId={member.id} email={member.email} />
                      )
                    ) : (
                      <span className='text-sm text-gray-400'>Role management only</span>
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