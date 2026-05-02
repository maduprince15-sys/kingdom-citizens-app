import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { canModeratePosts, canPostAnnouncements } from '../../lib/permissions'
import CreateAnnouncementForm from './CreateAnnouncementForm'
import DeleteAnnouncementButton from './DeleteAnnouncementButton'
import PinAnnouncementButton from './PinAnnouncementButton'

export default async function AnnouncementsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'member'

  const canCreate = canPostAnnouncements(role)
  const canModerate = canModeratePosts(role)
  const canManageAnnouncements = canCreate || canModerate
  const canPin = role === 'admin' || role === 'moderator'

  const { data: rawAnnouncements, error } = await supabase
    .from('app_announcements')
    .select(
      'id, title, content, image_url, video_url, author_id, author_name, created_at, is_pinned, pinned_at, expires_at, is_archived'
    )
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className='min-h-screen bg-[#050303] p-4 text-white md:p-6'>
        <div className='mx-auto max-w-5xl'>
          <h1 className='text-3xl font-bold'>Announcements</h1>
          <p className='mt-4 text-red-400'>
            Error loading announcements: {error.message}
          </p>
        </div>
      </main>
    )
  }

  const now = new Date()

  const announcements =
    rawAnnouncements?.filter((item) => {
      const expired = item.expires_at
        ? new Date(item.expires_at).getTime() <= now.getTime()
        : false

      const archived = Boolean(item.is_archived)

      if (canManageAnnouncements) {
        return true
      }

      return !archived && !expired
    }) || []

  return (
    <main className='min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-5xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold md:text-5xl'>
                Announcements
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                Official notices, ministry updates, and important Citizens announcements.
              </p>

              {canManageAnnouncements && (
                <p className='mt-3 max-w-2xl text-xs leading-5 text-yellow-300'>
                  Management view: you can see active, expired, and archived announcements.
                </p>
              )}
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                href='/dashboard'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Dashboard
              </Link>

              <Link
                href='/display/notice-board'
                className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
              >
                Notice Board
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-5xl px-4 py-8 md:px-8'>
        {canCreate && <CreateAnnouncementForm />}

        <div className='mt-6 space-y-5'>
          {announcements.map((item) => {
            const expired = item.expires_at
              ? new Date(item.expires_at).getTime() <= now.getTime()
              : false

            const archived = Boolean(item.is_archived)
            const canDelete = canModerate || item.author_id === user.id
            const canEdit = canModerate || item.author_id === user.id

            return (
              <article
                key={item.id}
                className={
                  archived || expired
                    ? 'rounded-2xl border border-red-900/40 bg-[#120707] p-5 opacity-75 shadow-lg shadow-black/30'
                    : 'rounded-2xl border border-yellow-900/40 bg-gradient-to-br from-[#120707] to-[#050303] p-5 shadow-lg shadow-black/30'
                }
              >
                <div className='flex flex-wrap items-center gap-2'>
                  <h2 className='text-2xl font-bold text-white'>
                    {item.title}
                  </h2>

                  {item.is_pinned && (
                    <span className='rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black'>
                      Pinned
                    </span>
                  )}

                  {expired && (
                    <span className='rounded-full bg-red-700 px-3 py-1 text-xs font-bold text-white'>
                      Expired
                    </span>
                  )}

                  {archived && (
                    <span className='rounded-full bg-gray-700 px-3 py-1 text-xs font-bold text-white'>
                      Archived
                    </span>
                  )}
                </div>

                <p className='mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-200 md:text-base'>
                  {item.content}
                </p>

                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className='mt-5 max-h-96 w-full rounded-2xl object-cover'
                  />
                )}

                {item.video_url && (
                  <p className='mt-5'>
                    <a
                      href={item.video_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='rounded-full border border-yellow-700 px-4 py-2 text-sm font-bold text-yellow-300 hover:bg-yellow-900/20'
                    >
                      Watch attached video
                    </a>
                  </p>
                )}

                <div className='mt-4 space-y-1 text-xs text-gray-500'>
                  <p>
                    By {item.author_name || 'Kingdom Citizens'} ·{' '}
                    {new Date(item.created_at).toLocaleString()}
                  </p>

                  {item.expires_at && (
                    <p>
                      Expires: {new Date(item.expires_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className='mt-5 flex flex-wrap gap-3'>
                  {canEdit && (
                    <Link
                      href={`/announcements/edit/${item.id}`}
                      className='rounded-full bg-yellow-600 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-500'
                    >
                      Edit
                    </Link>
                  )}

                  {canDelete && <DeleteAnnouncementButton id={item.id} />}

                  {canPin && (
                    <PinAnnouncementButton
                      id={item.id}
                      isPinned={Boolean(item.is_pinned)}
                    />
                  )}
                </div>
              </article>
            )
          })}

          {announcements.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 bg-[#120707] p-6 text-gray-400'>
              No active announcements yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}