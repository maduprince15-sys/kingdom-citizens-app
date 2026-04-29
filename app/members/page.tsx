import Link from 'next/link'
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

  const totalMembers = members?.length ?? 0
  const owners = members?.filter((member) => member.role === 'owner').length ?? 0
  const admins = members?.filter((member) => member.role === 'admin').length ?? 0
  const moderators = members?.filter((member) => member.role === 'moderator').length ?? 0
  const teachers = members?.filter((member) => member.role === 'teacher').length ?? 0

  function getRoleBadgeClass(role: string | null) {
    if (role === 'owner') return 'border-yellow-500/70 bg-yellow-500/10 text-yellow-300'
    if (role === 'admin') return 'border-red-500/70 bg-red-500/10 text-red-300'
    if (role === 'moderator') return 'border-blue-500/70 bg-blue-500/10 text-blue-300'
    if (role === 'teacher') return 'border-purple-500/70 bg-purple-500/10 text-purple-300'
    return 'border-gray-600 bg-gray-900/60 text-gray-300'
  }

  if (error) {
    return (
      <main className='min-h-screen bg-[#050303] p-4 text-white md:p-8'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='text-3xl font-bold'>Members</h1>
          <p className='mt-4 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading members: {error.message}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-6xl'>
          <div className='flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
                The Kingdom Citizens
              </p>

              <h1 className='mt-3 text-4xl font-black md:text-6xl'>
                Members
              </h1>

              <p className='mt-3 max-w-3xl text-sm leading-7 text-gray-300'>
                View member records, manage roles, and protect the order of the Kingdom Citizens community.
              </p>
            </div>

            <Link
              href='/dashboard'
              className='w-fit rounded-full border border-yellow-700/70 px-5 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-900/20'
            >
              Dashboard
            </Link>
          </div>

          <div className='mt-8 grid grid-cols-2 gap-4 md:grid-cols-5'>
            <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
              <p className='text-xs uppercase tracking-[0.2em] text-gray-400'>Total</p>
              <p className='mt-2 text-3xl font-bold text-white'>{totalMembers}</p>
            </div>

            <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
              <p className='text-xs uppercase tracking-[0.2em] text-gray-400'>Owners</p>
              <p className='mt-2 text-3xl font-bold text-yellow-300'>{owners}</p>
            </div>

            <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
              <p className='text-xs uppercase tracking-[0.2em] text-gray-400'>Admins</p>
              <p className='mt-2 text-3xl font-bold text-red-300'>{admins}</p>
            </div>

            <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
              <p className='text-xs uppercase tracking-[0.2em] text-gray-400'>Moderators</p>
              <p className='mt-2 text-3xl font-bold text-blue-300'>{moderators}</p>
            </div>

            <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
              <p className='text-xs uppercase tracking-[0.2em] text-gray-400'>Teachers</p>
              <p className='mt-2 text-3xl font-bold text-purple-300'>{teachers}</p>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        <div className='mb-5 rounded-2xl border border-yellow-900/30 bg-[#120707] p-5'>
          <p className='text-sm leading-7 text-gray-300'>
            Signed in as <span className='font-bold text-yellow-300'>{actorRole}</span>.{' '}
            {showRoleControls
              ? 'You can manage permitted member roles from this page.'
              : 'You can view members, but role management is restricted.'}
          </p>
        </div>

        <div className='space-y-4 md:hidden'>
          {members?.map((member) => (
            <article
              key={member.id}
              className='rounded-2xl border border-yellow-900/40 bg-gradient-to-br from-[#120707] to-black p-5 shadow-lg shadow-black/30'
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <h2 className='text-xl font-bold'>
                    {member.full_name || 'No name yet'}
                  </h2>

                  <p className='mt-1 break-all text-sm text-gray-400'>
                    {member.email}
                  </p>
                </div>

                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getRoleBadgeClass(member.role)}`}>
                  {member.role || 'member'}
                </span>
              </div>

              <div className='mt-5 grid grid-cols-1 gap-4'>
                <div className='rounded-xl border border-yellow-900/20 bg-black/30 p-4'>
                  <p className='text-xs uppercase tracking-[0.2em] text-gray-500'>
                    Phone
                  </p>
                  <p className='mt-2 text-sm text-gray-200'>
                    {member.phone || '-'}
                  </p>
                </div>

                <div className='rounded-xl border border-yellow-900/20 bg-black/30 p-4'>
                  <p className='text-xs uppercase tracking-[0.2em] text-gray-500'>
                    Role
                  </p>

                  <div className='mt-2'>
                    {showRoleControls && member.id !== user.id ? (
                      <RoleSelect
                        userId={member.id}
                        email={member.email}
                        currentRole={member.role}
                        actorRole={actorRole}
                      />
                    ) : (
                      <p className='text-sm text-gray-200'>{member.role}</p>
                    )}
                  </div>
                </div>
              </div>

              {(showRoleControls || showDeleteControls) && (
                <div className='mt-5 border-t border-yellow-900/30 pt-4'>
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
            </article>
          ))}
        </div>

        <div className='hidden overflow-hidden rounded-2xl border border-yellow-900/40 bg-[#090303] shadow-2xl shadow-black/40 md:block'>
          <div className='overflow-x-auto'>
            <table className='min-w-full'>
              <thead className='bg-[#160707]'>
                <tr>
                  <th className='px-5 py-4 text-left text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    Full Name
                  </th>
                  <th className='px-5 py-4 text-left text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    Email
                  </th>
                  <th className='px-5 py-4 text-left text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    Phone
                  </th>
                  <th className='px-5 py-4 text-left text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    Role
                  </th>
                  {(showRoleControls || showDeleteControls) && (
                    <th className='px-5 py-4 text-left text-xs uppercase tracking-[0.25em] text-yellow-500'>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {members?.map((member) => (
                  <tr
                    key={member.id}
                    className='border-t border-yellow-900/20 hover:bg-yellow-900/10'
                  >
                    <td className='px-5 py-4 align-top'>
                      <p className='font-semibold text-white'>
                        {member.full_name || 'No name yet'}
                      </p>
                      {member.id === user.id && (
                        <p className='mt-1 text-xs text-yellow-500'>Current account</p>
                      )}
                    </td>

                    <td className='px-5 py-4 align-top'>
                      <p className='break-all text-sm text-gray-300'>
                        {member.email}
                      </p>
                    </td>

                    <td className='px-5 py-4 align-top'>
                      <p className='text-sm text-gray-300'>
                        {member.phone || '-'}
                      </p>
                    </td>

                    <td className='px-5 py-4 align-top'>
                      {showRoleControls && member.id !== user.id ? (
                        <RoleSelect
                          userId={member.id}
                          email={member.email}
                          currentRole={member.role}
                          actorRole={actorRole}
                        />
                      ) : (
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getRoleBadgeClass(member.role)}`}>
                          {member.role}
                        </span>
                      )}
                    </td>

                    {(showRoleControls || showDeleteControls) && (
                      <td className='px-5 py-4 align-top'>
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
        </div>

        {members?.length === 0 && (
          <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
            No members found.
          </div>
        )}
      </section>
    </main>
  )
}