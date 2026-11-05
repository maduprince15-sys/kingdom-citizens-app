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


  const mainHrefs = new Set(['/study', '/meetings', '/messages', '/notifications', '/prayers', '/books'])
  const primaryCards = memberCards.filter((card) => mainHrefs.has(card.href))
  const secondaryCards = memberCards.filter((card) => !mainHrefs.has(card.href))

  return (
    <main className="kc-site kc-mobile-shell min-h-screen bg-[#050303] pb-14 text-white">
      <header className="border-b border-[#c5a56d]/20 bg-gradient-to-br from-[#1e0b0f] to-[#080405] px-4 py-6 md:px-8 md:py-9">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c5a46c]">The Kingdom Citizens</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {displayName}</h1>
            <p className="mt-1 text-xs capitalize text-[#bdb0ab]">{role} account</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/notifications" className="rounded-full border border-[#c7a16a]/30 bg-[#48252b]/45 px-4 py-2.5 text-sm font-semibold text-[#f1d7a5]">
              Notifications{unreadNotificationCount ? ' · ' + unreadNotificationCount : ''}
            </Link>
            <Link href="/" className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-[#e8d9d4]">Public site</Link>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl space-y-7 px-4 py-8 md:px-8">
        <PushNotificationManager />
        {noticeSlides.length > 0 && (
          <div className="kc-glass rounded-[1.75rem] p-3 sm:p-5">
            <DashboardNoticePreview slides={noticeSlides} intervalMs={12000} />
          </div>
        )}
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Your community</h2>
            {unreadMessageCount ? <Link href="/messages" className="text-xs font-semibold text-[#e2c28e]">{unreadMessageCount} unread messages</Link> : null}
          </div>
          <div className="kc-dashboard-grid">
            {primaryCards.map((card) => (
              <Link key={card.href} href={card.href}
                className="kc-glass kc-mobile-card group rounded-2xl px-5 py-5 transition hover:border-[#d4b47d]/55 hover:bg-[#4b292f]">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#be9e6c]">{card.label}</p>
                <h3 className="mt-2 text-lg font-semibold">{card.title}</h3>
                <span className="mt-4 block text-xs font-semibold text-[#dcc092] group-hover:text-white">Open →</span>
              </Link>
            ))}
          </div>
        </div>
        {secondaryCards.length > 0 && (
          <details className="kc-glass rounded-[1.75rem] p-5">
            <summary className="cursor-pointer text-lg font-semibold text-[#ecd3b4]">More member tools</summary>
            <div className="kc-dashboard-grid mt-5">
              {secondaryCards.map((card) => (
                <Link key={card.href} href={card.href} className="rounded-xl border border-[#c2a06a]/18 bg-[#210e12]/70 px-4 py-4 hover:border-[#d6b77c]/55">
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="mt-2 text-xs text-[#c4a878]">{card.label} →</p>
                </Link>
              ))}
            </div>
          </details>
        )}
        {managementCards.length > 0 && (
          <details className="kc-glass rounded-[1.75rem] p-5">
            <summary className="cursor-pointer text-lg font-semibold text-[#ecd3b4]">{managementTitle}</summary>
            <p className="mt-2 text-xs text-[#b8a9a5]">{managementDescription}</p>
            <div className="kc-dashboard-grid mt-5">
              {managementCards.map((card) => (
                <Link key={card.href} href={card.href} className="rounded-xl border border-[#c2a06a]/18 bg-[#210e12]/70 px-4 py-4 hover:border-[#d6b77c]/55">
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="mt-2 text-xs text-[#c4a878]">{card.label} →</p>
                </Link>
              ))}
            </div>
          </details>
        )}
        <details className="rounded-2xl border border-[#c1a068]/15 bg-[#160a0d]/60 p-5">
          <summary className="cursor-pointer text-sm font-semibold text-[#d7c5ad]">Account options</summary>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LogoutButton />
            <Link href="/account/delete" className="rounded-full border border-red-700/40 px-5 py-3 text-sm font-semibold text-red-200 hover:bg-red-950/30">Delete account</Link>
          </div>
        </details>
      </section>
    </main>
  )
}
