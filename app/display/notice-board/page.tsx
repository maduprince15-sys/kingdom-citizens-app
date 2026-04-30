import NoticeBoardSlider from '../../components/NoticeBoardSlider'
import { createClient } from '../../../lib/supabase/server'

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
  const date =
    item.event_date ||
    item.meeting_date ||
    item.project_date ||
    item.created_at ||
    null

  const time = item.event_time || item.meeting_time || null

  if (!date && !time) return null
  if (date && time) return `${date} · ${time}`
  return date || time
}

export default async function NoticeBoardPage() {
  const supabase = await createClient()

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
    .limit(5)

  const { data: pinnedPosts } = await supabase
    .from('app_posts')
    .select('*')
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: pinnedEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('is_pinned', true)
    .order('event_date', { ascending: true })
    .limit(5)

  const { data: pinnedProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('is_pinned', true)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: true })
    .limit(3)

  const birthdaySlides =
    birthdayProfiles?.map((profile: any) => ({
      id: `birthday-${profile.id}`,
      type: 'birthday',
      label: "Today's Birthday",
      title: profile.full_name || profile.email || 'Citizen',
      subtitle: 'The Kingdom Citizens celebrates you.',
      description: 'May you grow in Christ, in grace, in wisdom, and in the purpose of God.',
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

  const eventSlides =
    pinnedEvents?.map((item: any) => ({
      id: `event-${item.id}`,
      type: 'event',
      label: 'Pinned Event',
      title: getText(item.title) || 'Event',
      subtitle: getText(item.location),
      description: getText(item.description),
      image_url: item.image_url || null,
      avatar_url: null,
      date_text: getDateText(item),
      link_url: item.event_url || item.external_url || null,
    })) || []

  const projectSlides =
    pinnedProjects?.map((item: any) => ({
      id: `project-${item.id}`,
      type: 'project',
      label: 'Pinned Project',
      title: getText(item.title) || 'Project',
      subtitle: getText(item.project_status),
      description: getText(item.description),
      image_url: item.image_url || null,
      avatar_url: null,
      date_text: getDateText(item),
      link_url: item.project_url || item.external_url || null,
    })) || []

  const meetingSlides =
    meetings?.map((item: any) => ({
      id: `meeting-${item.id || `${item.title}-${item.meeting_date}`}`,
      type: 'meeting',
      label: 'Upcoming Meeting',
      title: getText(item.title) || 'Meeting',
      subtitle: getText(item.platform),
      description: getText(item.description),
      image_url: null,
      avatar_url: null,
      date_text: getDateText(item),
      link_url: item.meeting_url || null,
    })) || []

  const slides = [
    ...birthdaySlides,
    ...announcementSlides,
    ...postSlides,
    ...eventSlides,
    ...projectSlides,
    ...meetingSlides,
  ]

  return <NoticeBoardSlider slides={slides} intervalMs={15000} />
}