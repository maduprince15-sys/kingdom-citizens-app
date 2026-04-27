import Link from 'next/link'
import { createClient } from '../lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('app_announcements')
    .select('id, title, content, created_at, is_pinned')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: posts } = await supabase
    .from('app_posts')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <main className='min-h-screen bg-black px-4 py-8 text-white md:px-8'>
      <div className='mx-auto max-w-5xl'>
        <header className='mb-10'>
          <h1 className='text-4xl font-bold md:text-5xl'>Kingdom Citizens</h1>
          <p className='mt-3 max-w-2xl text-gray-300'>
            Our address is in Christ. Read ministry updates, browse community posts,
            connect with the ministry, and join meetings.
          </p>

          <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
            <Link href='/login' className='rounded bg-blue-600 px-5 py-3 text-center text-white'>
              Login
            </Link>
            <Link href='/register' className='rounded bg-green-600 px-5 py-3 text-center text-white'>
              Register
            </Link>
          </div>
        </header>

        <section className='mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Link href='/public/announcements' className='rounded border border-gray-700 p-4 hover:bg-gray-900'>
            <h2 className='text-xl font-semibold'>Announcements</h2>
            <p className='mt-2 text-sm text-gray-400'>Official notices and ministry updates.</p>
          </Link>

          <Link href='/public/posts' className='rounded border border-gray-700 p-4 hover:bg-gray-900'>
            <h2 className='text-xl font-semibold'>Posts</h2>
            <p className='mt-2 text-sm text-gray-400'>Community and teaching posts.</p>
          </Link>

          <Link href='/public/connect' className='rounded border border-gray-700 p-4 hover:bg-gray-900'>
            <h2 className='text-xl font-semibold'>Connect</h2>
            <p className='mt-2 text-sm text-gray-400'>Official ministry links and channels.</p>
          </Link>

          <Link href='/public/meetings' className='rounded border border-gray-700 p-4 hover:bg-gray-900'>
            <h2 className='text-xl font-semibold'>Meetings</h2>
            <p className='mt-2 text-sm text-gray-400'>Join upcoming Kingdom Citizens meetings.</p>
          </Link>
        </section>

        <section className='mb-10'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>Latest Announcements</h2>
            <Link href='/public/announcements' className='text-cyan-400 underline'>
              View all
            </Link>
          </div>

          <div className='space-y-4'>
            {announcements?.map((item) => (
              <article key={item.id} className='rounded border border-gray-700 p-4'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='text-xl font-semibold'>{item.title}</h3>
                  {item.is_pinned && (
                    <span className='rounded bg-amber-700 px-2 py-1 text-xs text-white'>Pinned</span>
                  )}
                </div>
                <p className='mt-2 text-gray-300'>
                  {item.content?.length > 180 ? `${item.content.slice(0, 180)}...` : item.content}
                </p>
              </article>
            ))}

            {announcements?.length === 0 && <p className='text-gray-400'>No announcements yet.</p>}
          </div>
        </section>

        <section>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>Latest Posts</h2>
            <Link href='/public/posts' className='text-cyan-400 underline'>
              View all
            </Link>
          </div>

          <div className='space-y-4'>
            {posts?.map((item) => (
              <article key={item.id} className='rounded border border-gray-700 p-4'>
                <h3 className='text-xl font-semibold'>{item.title}</h3>
                <p className='mt-2 text-gray-300'>
                  {item.content?.length > 180 ? `${item.content.slice(0, 180)}...` : item.content}
                </p>
              </article>
            ))}

            {posts?.length === 0 && <p className='text-gray-400'>No posts yet.</p>}
          </div>
        </section>
      </div>
    </main>
  )
}