import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { canCreatePosts, canModeratePosts } from '../../lib/permissions'
import CreatePostForm from './CreatePostForm'
import DeletePostButton from './DeletePostButton'
import PostEngagement from './PostEngagement'

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
  const canModerate = canModeratePosts(role)

  const { data: posts, error } = await supabase
    .from('app_posts')
    .select('id, title, content, image_url, video_url, author_id, author_name, created_at')
    .order('created_at', { ascending: false })

  const { data: comments } = await supabase
    .from('app_post_comments')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: reactions } = await supabase
    .from('app_post_reactions')
    .select('post_id, reaction_type')

  function getComments(postId: string) {
    return comments?.filter((comment) => comment.post_id === postId) || []
  }

  function getReactionCounts(postId: string) {
    const postReactions = reactions?.filter((reaction) => reaction.post_id === postId) || []

    return {
      amen: postReactions.filter((reaction) => reaction.reaction_type === 'amen').length,
      praying: postReactions.filter((reaction) => reaction.reaction_type === 'praying').length,
      thank_god: postReactions.filter((reaction) => reaction.reaction_type === 'thank_god').length,
    }
  }

  if (error) {
    return (
      <main className='p-4 md:p-6 text-white'>
        <h1 className='text-2xl font-bold'>Posts</h1>
        <p className='mt-4'>Error loading posts: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='p-4 md:p-6 text-white'>
      <h1 className='text-2xl font-bold'>Posts</h1>
      <p className='mt-2 text-sm text-gray-300'>Community and teaching posts.</p>

      {canCreatePosts(role) && <CreatePostForm />}

      <div className='space-y-4'>
        {posts?.map((item) => {
          const canDelete = canModeratePosts(role) || item.author_id === user.id
          const canEdit = canModeratePosts(role) || item.author_id === user.id

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

              <div className='mt-4 flex flex-wrap gap-3'>
                {canEdit && (
                  <Link
                    href={`/posts/edit/${item.id}`}
                    className='rounded bg-yellow-600 px-3 py-1 text-sm text-white'
                  >
                    Edit
                  </Link>
                )}

                {canDelete && <DeletePostButton id={item.id} />}
              </div>

              <PostEngagement
                postId={item.id}
                comments={getComments(item.id)}
                counts={getReactionCounts(item.id)}
                canModerate={canModerate}
                currentUserId={user.id}
              />
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