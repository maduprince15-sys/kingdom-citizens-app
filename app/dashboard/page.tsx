import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import LogoutButton from './LogoutButton'
import DashboardNoticePreview from '../components/DashboardNoticePreview'
import PushNotificationManager from '../components/PushNotificationManager'

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function getMonthName(month: number | null | undefined) {
  if (!month || month < 1 || month > 12) return ''
  return months[month - 1]
}

function getText(value: any) {
  if (!value) return null
  return String(value)
}

function getDateText(item: any) {
  const date = item.created_at || null
  return date
}

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

  const { count: unreadMessageCount } = await supabase
    .from('app_messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .is('read_at', null)
    .is('recipient_archived_at', null)

  const { count: unreadNotificationCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  const { data: birthdayProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, birthday_month, birthday_day, show_birthday, avatar_url')
    .eq('show_birthday', true)
    .eq('birthday_month', currentMonth)
    .eq('birthday_day', currentDay)

  const { data: pinnedAnnouncements } = await supabase
    .from('app_announcements')
    .select('*')
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: pinnedPosts } = await supabase
    .from('app_posts')
    .select('*')
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(3)

  const birthdaySlides =
    birthdayProfiles?.map((profile: any) => ({
      id: `birthday-${profile.id}`,
      type: 'birthday',
      label: "Today's Birthday",
      title: profile.full_name || profile.email || 'Citizen',
      subtitle: 'The Kingdom Citizens celebrates you.',
      description:
        'May you grow in Christ, in grace, in wisdom, and in the purpose of God.',
      avatar_url: profile.avatar_url || null,
      image_url: null,
      date_text: `${getMonthName(profile.birthday_month)} ${profile.birthday_day}`,
      link_url: null,
    })) || []

  const announcementSlides =
    pinnedAnnouncements?.map((item: any) => ({
      id: `announcement-${item.id}`,
      type: 'announcement',
      label: 'Pinned Announcement',
      title: getText(item.title) || 'Announcement',
      subtitle: null,
      description: getText(item.content || item.description),
      image_url: item.image_url || null,
      avatar_url: null,
      date_text: getDateText(item),
      link_url: item.video_url || null,
    })) || []

  const postSlides =
    pinnedPosts?.map((item: any) => ({
      id: `post-${item.id}`,
      type: 'post',
      label: 'Pinned Post',
      title: getText(item.title) || 'Pinned Post',
      subtitle: null,
      description: getText(item.content || item.body || item.description),
      image_url: item.image_url || null,
      avatar_url: null,
      date_text: getDateText(item),
      link_url: item.video_url || null,
    })) || []

  const noticeSlides = [
    ...birthdaySlides,
    ...announcementSlides,
    ...postSlides,
  ]

  const memberCards = [
    {
      title: 'Profile',
      description: 'Update your full name, phone number, email address, birthday details, and member information.',
      href: '/profile',
      label: 'Member profile',
    },
    {
      title: `Notifications${unreadNotificationCount ? ` (${unreadNotificationCount} unread)` : ''}`,
      description: 'View app notifications, reminders, approvals, and important Citizens updates.',
      href: '/notifications',
      label: 'Alerts',
    },
    {
      title: `Messages${unreadMessageCount ? ` (${unreadMessageCount} unread)` : ''}`,
      description: 'Read private messages, sent messages, and access the Citizens group chat.',
      href: '/messages',
      label: 'Communication',
    },
    {
      title: 'Study Center',
      description: 'Study Bible lessons, doctrine resources, Scripture notes, teaching materials, and read the Bible.',
      href: '/study',
      label: 'Study',
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
      title: 'Books',
      description: 'Access The Kingdom Citizens book and teaching resource area.',
      href: '/books',
      label: 'Bookstore',
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
      title: 'Manage Citizen Records',
      description: 'Add and manage member contribution, attendance, task, service, and training records.',
      href: '/admin/member-records',
      label: 'Records',
    },
    {
      title: 'Contact Messages',
      description: 'Read and manage messages sent from the public contact box.',
      href: '/admin/contact-messages',
      label: 'Public messages',
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
      title: 'Manage Study Center',
      description: 'Create and manage Bible study resources, doctrine lessons, and teaching materials.',
      href: '/admin/study',
      label: 'Study resources',
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
      title: 'Contact Messages',
      description: 'Read and manage messages sent from the public contact box.',
      href: '/admin/contact-messages',
      label: 'Public messages',
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
      title: 'Manage Study Center',
      description: 'Create and manage Bible study resources, doctrine lessons, and teaching materials.',
      href: '/admin/study',
      label: 'Study resources',
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
    <main className='kc-mobile-shell min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
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

            <div className='kc-mobile-actions'>
              <Link
                href='/notifications'
                className='relative rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm font-bold text-yellow-300 hover:bg-yellow-700/20'
              >
                🔔 Notifications
                {unreadNotificationCount ? (
                  <span className='ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-black text-black'>
                    {unreadNotificationCount}
                  </span>
                ) : null}
              </Link>

              <Link
                href='/'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-center text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                View Public Site
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        <PushNotificationManager />

        <DashboardNoticePreview slides={noticeSlides} intervalMs={12000} />

        {unreadNotificationCount ? (
          <Link
            href='/notifications'
            className='mb-8 block rounded-2xl border border-yellow-600/60 bg-yellow-500 p-5 text-black shadow-lg shadow-yellow-950/40 transition hover:bg-yellow-400'
          >
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='text-xs font-black uppercase tracking-[0.25em]'>
                  New Notifications
                </p>

                <h2 className='mt-2 text-2xl font-black'>
                  You have {unreadNotificationCount} unread notification
                  {unreadNotificationCount === 1 ? '' : 's'}.
                </h2>

                <p className='mt-2 text-sm font-semibold'>
                  Open your notification center to view recent messages, reminders, and Citizens updates.
                </p>
              </div>

              <div className='rounded-full bg-black px-5 py-3 text-center text-sm font-black text-yellow-300'>
                Open Notifications →
              </div>
            </div>
          </Link>
        ) : null}

        <div className='mb-6 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-6'>
          <h2 className='text-xl font-bold text-yellow-300'>
            Member Tools
          </h2>

          <p className='mt-2 text-sm leading-6 text-gray-300'>
            General tools available for your Kingdom Citizens account.
          </p>
        </div>

        <div className='kc-dashboard-grid'>
          {memberCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className='kc-mobile-card group rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-[#050303] p-5 shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-yellow-600/70'
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

            <div className='kc-dashboard-grid'>
              {managementCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className='kc-mobile-card group rounded-2xl border border-red-900/40 bg-gradient-to-br from-[#180707] to-[#050303] p-5 shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-red-500/70'
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

          <div className='kc-mobile-actions mt-5'>
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
