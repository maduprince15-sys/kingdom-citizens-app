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
  const canCreate = canCreatePosts(role)
  const canModerate = canModeratePosts(role)
  const canManagePosts = canCreate || canModerate

  const { data: rawPosts, error } = await supabase
    .from('app_posts')
    .select('id, title, content, image_url, video_url, author_id, author_name, created_at, is_pinned, pinned_at, expires_at, is_archived')
    .order('is_pinned', { ascending: false })
    .order('pinned_at', { ascending: false })
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
      <main className='min-h-screen bg-[#050303] p-4 text-white md:p-6'>
        <div className='mx-auto max-w-5xl'>
          <h1 className='text-3xl font-bold'>Posts</h1>
          <p className='mt-4 text-red-400'>
            Error loading posts: {error.message}
          </p>
        </div>
      </main>
    )
  }

  const now = new Date()

  const posts =
    rawPosts?.filter((item) => {
      const expired = item.expires_at
        ? new Date(item.expires_at).getTime() <= now.getTime()
        : false

      const archived = Boolean(item.is_archived)

      if (canManagePosts) {
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
                Posts
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                Community posts, teaching posts, reflections, and Citizens engagement.
              </p>

              {canManagePosts && (
                <p className='mt-3 max-w-2xl text-xs leading-5 text-yellow-300'>
                  Management view: you can see active, expired, and archived posts.
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
                href='/'
                className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
              >
                Public Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-5xl px-4 py-8 md:px-8'>
        {canCreate && <CreatePostForm />}

        <div className='mt-6 space-y-5'>
          {posts.map((item) => {
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
                      href={`/posts/edit/${item.id}`}
                      className='rounded-full bg-yellow-600 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-500'
                    >
                      Edit
                    </Link>
                  )}

                  {canDelete && <DeletePostButton id={item.id} />}
                </div>

                {!archived && !expired && (
                  <PostEngagement
                    postId={item.id}
                    comments={getComments(item.id)}
                    counts={getReactionCounts(item.id)}
                    canModerate={canModerate}
                    currentUserId={user.id}
                  />
                )}
              </article>
            )
          })}

          {posts.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 bg-[#120707] p-6 text-gray-400'>
              No active posts yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}