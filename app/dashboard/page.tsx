import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import LogoutButton from './LogoutButton'

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

  const memberCards = [
    {
      title: 'Profile',
      description: 'Update your full name, phone number, email address, birthday details, and member information.',
      href: '/profile',
      label: 'Member profile',
    },
{
  title: 'My Citizen Records',
  description: 'View your attendance, contribution, task, service, and training records.',
  href: '/my-records',
  label: 'My records',
},
{
  title: 'My Groups',
  description: 'View your Bible study, training, prayer, and service groups.',
  href: '/groups',
  label: 'Groups',
},
    {
      title: `Messages${unreadCount ? ` (${unreadCount} unread)` : ''}`,
      description: 'Read inbox messages and send messages to board members.',
      href: '/messages',
      label: 'Inbox',
    },
    {
      title: 'Books',
      description: 'Access The Kingdom Citizens book and teaching resource area.',
      href: '/books',
      label: 'Bookstore',
    },
    {
      title: 'Connect',
      description: 'Access official ministry links and channels.',
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
      description: 'Read official announcements and ministry updates.',
      href: '/announcements',
      label: 'Official notices',
    },
    {
      title: 'Posts',
      description: 'Read and engage with teaching or community posts.',
      href: '/posts',
      label: 'Teaching posts',
    },
    {
      title: 'Prayer Wall',
      description: 'Share prayer requests and stand with members in prayer.',
      href: '/prayers',
      label: 'Prayer',
    },
    {
      title: 'Calendar',
      description: 'View important dates, programs, meetings, and appointments.',
      href: '/calendar',
      label: 'Important dates',
    },
  ]

  const ownerCards = [
    {
      title: 'Members',
      description: 'Govern admin appointments and remove admin privileges when needed.',
      href: '/members',
      label: 'Governance',
    },
  ]

  const adminCards = [
    {
      title: 'Members',
      description: 'View members and appoint lower offices such as finance, moderator, teacher, and member.',
      href: '/members',
      label: 'Manage community',
    },
{
  title: 'Manage Groups',
  description: 'Create and manage Bible study groups, training groups, prayer teams, and service groups.',
  href: '/admin/groups',
  label: 'Groups',
},
    {
      title: 'Manage Announcements',
      description: 'Create, edit, pin, unpin, and delete official announcements.',
      href: '/announcements',
      label: 'Admin notices',
    },
    {
      title: 'Announcement Display',
      description: 'Open a public display screen for pinned announcements.',
      href: '/display/announcements',
      label: 'Pinned display',
    },
    {
      title: 'Manage Posts',
      description: 'Create, edit, and remove teaching or community posts.',
      href: '/posts',
      label: 'Admin posts',
    },
    {
      title: 'Manage Books',
      description: 'Add, edit, hide, update bookstore resources, and upload book covers.',
      href: '/admin/books',
      label: 'Admin books',
    },
    {
      title: 'Manage Book Access',
      description: 'Manually approve members to download private book PDFs.',
      href: '/admin/book-access',
      label: 'PDF access',
    },
    {
      title: 'Manage Giving',
      description: 'Add, edit, hide, or remove official giving options.',
      href: '/admin/giving',
      label: 'Giving portal',
    },
{
  title: 'Manage Citizen Records',
  description: 'Add and manage member contribution, attendance, task, service, and training records.',
  href: '/admin/member-records',
  label: 'Records',
},
    {
      title: 'Manage Connect',
      description: 'Add, edit, hide, or remove official ministry links.',
      href: '/admin/connect',
      label: 'Admin links',
    },
    {
      title: 'Manage Meetings',
      description: 'Add, edit, or remove live meeting links and schedules.',
      href: '/admin/meetings',
      label: 'Admin meetings',
    },
    {
      title: 'Manage Calendar',
      description: 'Add, edit, or remove important dates and event reminders.',
      href: '/admin/calendar',
      label: 'Calendar manager',
    },
  ]

  const financeCards = [
    {
      title: 'Manage Giving',
      description: 'Manage the Giving portal and future financial contribution records.',
      href: '/admin/giving',
      label: 'Finance office',
    },
{
  title: 'Contribution Records',
  description: 'Add and manage financial contribution records for members.',
  href: '/admin/member-records',
  label: 'Finance records',
},
  ]

  const moderatorCards = [
{
  title: 'Manage Groups',
  description: 'Create and manage community, prayer, service, and training groups.',
  href: '/admin/groups',
  label: 'Groups',
},
{
  title: 'Manage Attendance and Tasks',
  description: 'Add and manage attendance, task, service, and training records.',
  href: '/admin/member-records',
  label: 'Records',
},   
    {
      title: 'Manage Announcements',
      description: 'Create, edit, pin, unpin, and delete official announcements.',
      href: '/announcements',
      label: 'Moderator notices',
    },
    {
      title: 'Announcement Display',
      description: 'Open a public display screen for pinned announcements.',
      href: '/display/announcements',
      label: 'Pinned display',
    },
    {
      title: 'Manage Posts',
      description: 'Create, edit, and remove teaching or community posts.',
      href: '/posts',
      label: 'Moderator posts',
    },
    {
      title: 'Manage Meetings',
      description: 'Add, edit, or remove live meeting links and schedules.',
      href: '/admin/meetings',
      label: 'Meeting manager',
    },
 {
      title: 'Manage Calendar',
      description: 'Add, edit, or remove important dates and event reminders.',
      href: '/admin/calendar',
      label: 'Calendar manager',
    },
  ]

  const teacherCards = [
{
  title: 'Training and Teaching Records',
  description: 'Add and manage training, service, and teaching task records.',
  href: '/admin/member-records',
  label: 'Teaching records',
},
{
  title: 'Manage Study Groups',
  description: 'Create and manage Bible study, teaching, and training groups.',
  href: '/admin/groups',
  label: 'Study groups',
},
   {
      title: 'Manage Announcements',
      description: 'Create and manage teaching or ministry announcements.',
      href: '/announcements',
      label: 'Teacher notices',
    },
    {
      title: 'Announcement Display',
      description: 'Open a public display screen for pinned announcements.',
      href: '/display/announcements',
      label: 'Pinned display',
    },
    {
      title: 'Manage Posts',
      description: 'Create and manage teaching posts.',
      href: '/posts',
      label: 'Teacher posts',
    },
  ]

  const managementCards =
    role === 'owner'
      ? ownerCards
      : role === 'admin'
        ? adminCards
        : role === 'finance'
          ? financeCards
          : role === 'moderator'
            ? moderatorCards
            : role === 'teacher'
              ? teacherCards
              : []

  const managementTitle =
    role === 'owner'
      ? 'Governance Tools'
      : role === 'finance'
        ? 'Finance Tools'
        : 'Management Tools'

  const managementDescription =
    role === 'owner'
      ? 'Owner tools are limited to governance: appointing or removing admins.'
      : role === 'finance'
        ? 'Finance tools are for Giving portal management and future financial records.'
        : 'These controls are for assigned leadership and should be used carefully.'

  return (
    <main className='min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
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

                <span className='break-all rounded-full border border-yellow-800 px-3 py-1 text-gray-300'>
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
            Member Tools
          </h2>

          <p className='mt-2 text-sm leading-6 text-gray-300'>
            General tools available for your Kingdom Citizens account.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {memberCards.map((card) => (
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

        {managementCards.length > 0 && (
          <>
            <div className='my-10 border-t border-yellow-900/40' />

            <div className='mb-6 rounded-2xl border border-red-900/40 bg-[#160707] p-5 md:p-6'>
              <h2 className='text-xl font-bold text-red-300'>
                {managementTitle}
              </h2>

              <p className='mt-2 text-sm leading-6 text-gray-300'>
                {managementDescription}
              </p>
            </div>

            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
              {managementCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className='group rounded-2xl border border-red-900/40 bg-gradient-to-br from-[#180707] to-[#050303] p-5 shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-red-500/70'
                >
                  <p className='text-xs uppercase tracking-[0.25em] text-red-400'>
                    {card.label}
                  </p>

                  <h2 className='mt-3 text-2xl font-bold text-white'>
                    {card.title}
                  </h2>

                  <p className='mt-3 text-sm leading-6 text-gray-300'>
                    {card.description}
                  </p>

                  <p className='mt-5 text-sm font-semibold text-red-300 group-hover:text-red-200'>
                    Manage →
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className='mt-10 rounded-2xl border border-red-900/40 bg-[#120707] p-5'>
          <h2 className='text-xl font-bold text-red-300'>
            Account Controls
          </h2>

          <p className='mt-2 text-sm leading-6 text-gray-400'>
            Use these controls carefully. Account deletion cannot be undone.
          </p>

          <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center'>
  <LogoutButton />

  <Link
    href='/account/delete'
    className='rounded-full border border-red-700 px-5 py-3 text-center text-sm font-bold text-red-300 hover:bg-red-900/20'
  >
    Delete Account
  </Link>
</div>
        </div>
      </section>
    </main>
  )
}