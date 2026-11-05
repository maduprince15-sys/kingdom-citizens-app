import Link from 'next/link'
import PublicHeader from './components/PublicHeader'
import PublicFooter from './components/PublicFooter'
import PinnedAnnouncementSlider from './components/PinnedAnnouncementSlider'
import { createClient, supabaseServerConfigured } from '../lib/supabase/server'

const sections = [
  { href: '/public/posts', title: 'Teachings', detail: 'Scripture and reflections' },
  { href: '/public/books', title: 'Library', detail: 'Books and study resources' },
  { href: '/public/meetings', title: 'Gatherings', detail: 'Bible study and fellowship' },
  { href: '/public/connect', title: 'Connect', detail: 'Official ministry channels' },
]
export default async function HomePage() {
  let meetings: { title: string; meeting_date: string | null; meeting_time: string | null; platform: string | null }[] | null = null
  let notices: { id: string; title: string; content: string; image_url: string | null; video_url: string | null; created_at: string }[] | null = null

  // Public Preview deliberately remains disconnected until a separate test
  // Supabase project is configured. Never fall back to Production credentials.
  if (supabaseServerConfigured) {
    const supabase = await createClient()
    const [meetingResult, noticeResult] = await Promise.all([
      supabase.from('meetings').select('title, meeting_date, meeting_time, platform')
        .order('meeting_date', { ascending: true }).limit(2),
      supabase.from('app_announcements')
        .select('id, title, content, image_url, video_url, created_at')
        .eq('is_pinned', true).order('created_at', { ascending: false }).limit(5),
    ])
    meetings = meetingResult.data
    notices = noticeResult.data
  }

  return (
    <main className="kc-site kc-mobile-shell min-h-screen bg-[#050303] text-white">
      <PublicHeader />
      <section className="relative isolate overflow-hidden border-b border-[#b68a53]/20 px-4 py-14 sm:py-20 md:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_77%_28%,rgba(142,45,54,.23),transparent_40%),radial-gradient(circle_at_14%_84%,rgba(157,118,58,.12),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-[#d5b476]">A Christ-centered community</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-[-.04em] text-white sm:text-6xl">
              The Kingdom<br /><span className="text-[#e6cd9a]">Citizens</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-[#dfd3cf]">Already seated in heaven, walking here on earth. Growing together in Christ through Scripture, prayer and fellowship.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="rounded-full bg-[#c7a366] px-6 py-3 text-sm font-bold text-[#1a0a0c] hover:bg-[#e2c48a]">Join the community</Link>
              <Link href="/public/posts" className="rounded-full border border-[#d8bb83]/35 bg-white/[.04] px-6 py-3 text-sm font-semibold text-[#f1d8a7]">Explore teachings</Link>
            </div>
          </div>
          <div className="kc-glass relative mx-auto flex w-full max-w-sm flex-col items-center rounded-[2rem] px-7 py-10 text-center">
            <div className="pointer-events-none absolute inset-x-16 top-4 h-40 rounded-full bg-[#b27a4c]/15 blur-[58px]" />
            <img src="/kingdom-citizens-logo.png" alt="The Kingdom Citizens emblem" className="relative h-44 w-44 rounded-full border border-[#dfc48e]/35 object-cover shadow-[0_0_52px_rgba(190,143,78,.15)]" />
            <p className="relative mt-7 text-xs font-semibold uppercase tracking-[.2em] text-[#cfb27e]">Our address is in Christ</p>
            <p className="relative mt-3 text-xl font-medium">One family. One hope.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Explore our community</h2>
          <Link href="/login" className="text-sm font-semibold text-[#e2c28e]">Member area</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((item) => (
            <Link key={item.href} href={item.href} className="kc-glass group rounded-2xl px-5 py-6 transition hover:border-[#d8b57c]/60">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[#bdb0ab]">{item.detail}</p>
              <span className="mt-6 block text-sm font-semibold text-[#d6b77f]">Explore →</span>
            </Link>
          ))}
        </div>
      </section>
      {(notices?.length || meetings?.length) ? (
        <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-14 md:grid-cols-2 md:px-8">
          {notices && notices.length > 0 && (
            <div className="kc-glass min-w-0 rounded-[1.75rem] p-5">
              <h2 className="mb-3 text-lg font-semibold text-[#f0dfbd]">Community notices</h2>
              <PinnedAnnouncementSlider announcements={notices} intervalMs={15000} />
            </div>
          )}
          {meetings && meetings.length > 0 && (
            <div className="kc-glass rounded-[1.75rem] p-6">
              <h2 className="text-lg font-semibold text-[#f0dfbd]">Upcoming gatherings</h2>
              <div className="mt-4 space-y-3">
                {meetings.map((item, index) => (
                  <div key={item.title + '-' + index} className="flex items-start justify-between gap-4 rounded-xl border border-[#c6a26b]/15 bg-[#1b0c0e]/60 p-4">
                    <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-[#bfb1ac]">{item.platform || 'Community gathering'}</p></div>
                    <p className="shrink-0 text-right text-xs text-[#e2c48c]">{item.meeting_date || 'Date to be announced'}{item.meeting_time ? ' · ' + item.meeting_time : ''}</p>
                  </div>
                ))}
              </div>
              <Link href="/public/meetings" className="mt-4 inline-block text-sm font-semibold text-[#ddbf87]">All meetings →</Link>
            </div>
          )}
        </section>
      ) : null}
      <PublicFooter />
    </main>
  )
}
