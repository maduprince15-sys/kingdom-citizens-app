import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicAnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements, error } = await supabase
    .from('app_announcements')
    .select('id, title, content, image_url, video_url, author_name, created_at, is_pinned')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className='min-h-screen bg-black p-4 text-white md:p-6'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold'>Public Announcements</h1>
          <Link href='/' className='text-cyan-400 underline'>Back to Home</Link>
        </div>

        {error && <p className='text-red-400'>Error loading announcements: {error.message}</p>}

        <div className='space-y-4'>
          {announcements?.map((item) => (
            <article key={item.id} className='rounded border border-gray-700 p-4'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-xl font-semibold'>{item.title}</h2>
                {item.is_pinned && (
                  <span className='rounded bg-amber-700 px-2 py-1 text-xs text-white'>Pinned</span>
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
            </article>
          ))}

          {announcements?.length === 0 && (
            <p className='text-gray-400'>No announcements yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}