import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicPostsPage() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('app_posts')
    .select('id, title, content, image_url, video_url, author_name, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className='min-h-screen bg-black p-4 text-white md:p-6'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold'>Public Posts</h1>
          <Link href='/' className='text-cyan-400 underline'>Back to Home</Link>
        </div>

        {error && <p className='text-red-400'>Error loading posts: {error.message}</p>}

        <div className='space-y-4'>
          {posts?.map((item) => (
            <article key={item.id} className='rounded border border-gray-700 p-4'>
              <h2 className='text-xl font-semibold'>{item.title}</h2>
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

          {posts?.length === 0 && (
            <p className='text-gray-400'>No posts yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}