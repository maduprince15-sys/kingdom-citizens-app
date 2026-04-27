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
  const canPin = role === 'owner' || role === 'moderator'

  const { data: announcements, error } = await supabase
    .from('app_announcements')
    .select('id, title, content, image_url, video_url, author_id, author_name, created_at, is_pinned, pinned_at')
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className='p-4 md:p-6 text-white'>
        <h1 className='text-2xl font-bold'>Announcements</h1>
        <p className='mt-4'>Error loading announcements: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='p-4 md:p-6 text-white'>
      <h1 className='text-2xl font-bold'>Announcements</h1>
      <p className='mt-2 text-sm text-gray-300'>Official notices and ministry updates.</p>

      {canPostAnnouncements(role) && <CreateAnnouncementForm />}

      <div className='space-y-4'>
        {announcements?.map((item) => {
          const canDelete = canModeratePosts(role) || item.author_id === user.id
          const canEdit = canModeratePosts(role) || item.author_id === user.id

          return (
            <article key={item.id} className='rounded border border-gray-700 p-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-xl font-semibold'>{item.title}</h2>
                {item.is_pinned && (
                  <span className='rounded bg-amber-700 px-2 py-1 text-xs text-white'>
                    Pinned
                  </span>
                )}
              </div>

              <p className='mt-2 whitespace-pre-wrap text-gray-200'>{item.content}</p>

              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className='mt-4 max-h-96 w-full rounded object-cover'
                />
              )}

              {item.video_url && (
                <p className='mt-4'>
                  <a
                    href={item.video_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-cyan-400 underline'
                  >
                    Watch attached video
                  </a>
                </p>
              )}

              <p className='mt-3 text-sm text-gray-400'>
                By {item.author_name || 'Kingdom Citizens'} · {new Date(item.created_at).toLocaleString()}
              </p>

              <div className='mt-4 flex flex-wrap gap-3'>
                {canEdit && (
                  <Link
                    href={`/announcements/edit/${item.id}`}
                    className='rounded bg-yellow-600 px-3 py-1 text-sm text-white'
                  >
                    Edit
                  </Link>
                )}

                {canDelete && <DeleteAnnouncementButton id={item.id} />}

                {canPin && <PinAnnouncementButton id={item.id} isPinned={Boolean(item.is_pinned)} />}
              </div>
            </article>
          )
        })}

        {announcements?.length === 0 && (
          <p className='text-gray-400'>No announcements yet.</p>
        )}
      </div>
    </main>
  )
}