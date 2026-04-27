import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { canCreatePosts, canModeratePosts } from '../../lib/permissions'
import CreatePostForm from './CreatePostForm'
import DeletePostButton from './DeletePostButton'

export default async function PostsPage() {
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

  const { data: posts, error } = await supabase
    .from('app_posts')
    .select('id, title, content, image_url, video_url, author_id, author_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className='p-6 text-white'>
        <h1 className='text-2xl font-bold'>Posts</h1>
        <p className='mt-4'>Error loading posts: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='p-6 text-white'>
      <h1 className='text-2xl font-bold'>Posts</h1>
      <p className='mt-2 text-sm text-gray-300'>Community and teaching posts.</p>

      {canCreatePosts(role) && <CreatePostForm />}

      <div className='space-y-4'>
        {posts?.map((item) => {
          const canDelete = canModeratePosts(role) || item.author_id === user.id

          return (
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

              {canDelete && (
                <div className='mt-4'>
                  <DeletePostButton id={item.id} />
                </div>
              )}
            </article>
          )
        })}

        {posts?.length === 0 && (
          <p className='text-gray-400'>No posts yet.</p>
        )}
      </div>
    </main>
  )
}
