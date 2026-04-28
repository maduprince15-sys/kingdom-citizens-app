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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || user.email
  const role = profile?.role || 'member'
const { count: unreadCount } = await supabase
  .from('app_messages')
  .select('id', { count: 'exact', head: true })
  .eq('recipient_id', user.id)
  .is('read_at', null)
  .is('recipient_archived_at', null)

  const cards = [
 {
  title: 'Profile',
  description: 'Update your full name, phone number, and member information.',
  href: '/profile',
  label: 'Member profile',
 },
{
  title: `Messages${unreadCount ? ` (${unreadCount} unread)` : ''}`,
  description: 'Read inbox messages and send messages to board members.',
  href: '/messages',
  label: 'Inbox',
},    {
      title: 'Members',
      description: 'View members, roles, and membership information.',
      href: '/members',
      label: 'Manage community',
    },
    {
      title: 'Books',
      description: 'Access The Kingdom Citizens book and teaching resource area.',
      href: '/books',
      label: 'Bookstore',
    },
{
  title: 'Manage Books',
  description: 'Add, edit, hide, or update bookstore resources.',
  href: '/admin/books',
  label: 'Admin books',
},
    {
      title: 'Connect',
      description: 'Manage or access official ministry links and channels.',
      href: '/connect',
      label: 'Media links',
    },
    {
      title: 'Meetings',
      description: 'Access meeting links, fellowship gatherings, and live sessions.',
      href: '/meetings',
      label: 'Join live',
    },
    {
      title: 'Announcements',
      description: 'Create, read, edit, pin, and manage official announcements.',
      href: '/announcements',
      label: 'Official notices',
    },
    {
      title: 'Posts',
      description: 'Create, read, edit, and manage teaching or community posts.',
      href: '/posts',
      label: 'Teaching posts',
    },
  ]

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-6xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold md:text-5xl'>
                Dashboard
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base'>
                Welcome, {displayName}. This is your Kingdom Citizens control center.
              </p>

              <div className='mt-4 flex flex-wrap gap-3 text-sm'>
                <span className='rounded-full border border-yellow-800 px-3 py-1 text-yellow-300'>
                  Role: {role}
                </span>

                <span className='rounded-full border border-yellow-800 px-3 py-1 text-gray-300 break-all'>
                  {user.email}
                </span>
              </div>
            </div>

            <Link
              href='/'
              className='rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm text-yellow-300 hover:bg-yellow-700/20'
            >
              View Public Site
            </Link>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        <div className='mb-6 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-6'>
          <h2 className='text-xl font-bold text-yellow-300'>
            Ministry Workspace
          </h2>

          <p className='mt-2 text-sm leading-6 text-gray-300'>
            Use these tools to manage community life, teaching content, public updates,
            meetings, links, books, and member access.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className='group rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-[#050303] p-5 shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-yellow-600/70'
            >
              <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                {card.label}
              </p>

              <h2 className='mt-3 text-2xl font-bold text-white'>
                {card.title}
              </h2>

              <p className='mt-3 text-sm leading-6 text-gray-300'>
                {card.description}
              </p>

              <p className='mt-5 text-sm font-semibold text-yellow-400 group-hover:text-yellow-300'>
                Open →
              </p>
            </Link>
          ))}
        </div>

        <div className='mt-8 rounded-2xl border border-red-900/40 bg-[#120707] p-5'>
          <h2 className='text-xl font-bold text-red-300'>
            Account Controls
          </h2>

          <p className='mt-2 text-sm leading-6 text-gray-400'>
            Use these controls carefully. Account deletion cannot be undone.
          </p>

          <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <LogoutButton />
            <DeleteAccountButton />
          </div>
        </div>
      </section>
    </main>
  )
}