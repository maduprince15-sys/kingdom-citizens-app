'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Comment = {
  id: string
  author_id: string
  author_name: string | null
  content: string
  created_at: string
}

type ReactionCounts = {
  amen: number
  praying: number
  thank_god: number
}

type Props = {
  postId: string
  comments: Comment[]
  counts: ReactionCounts
  canModerate: boolean
  currentUserId: string
}

export default function PostEngagement({
  postId,
  comments,
  counts,
  canModerate,
  currentUserId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function addReaction(reactionType: 'amen' | 'praying' | 'thank_god') {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase.from('app_post_reactions').insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: reactionType,
    })

    if (!error) {
      router.refresh()
    }
  }

  async function addComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('You must be logged in.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const authorName = profile?.full_name || profile?.email || user.email || 'Member'

    const { error } = await supabase.from('app_post_comments').insert({
      post_id: postId,
      author_id: user.id,
      author_name: authorName,
      content,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setContent('')
    setLoading(false)
    router.refresh()
  }

  async function deleteComment(id: string) {
    const confirmed = window.confirm('Delete this comment?')
    if (!confirmed) return

    const { error } = await supabase
      .from('app_post_comments')
      .delete()
      .eq('id', id)

    if (!error) {
      router.refresh()
    }
  }

  return (
    <div className='mt-6 border-t border-yellow-900/30 pt-5'>
      <div className='flex flex-wrap gap-3'>
        <button
          onClick={() => addReaction('amen')}
          className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black'
        >
          Amen ({counts.amen})
        </button>

        <button
          onClick={() => addReaction('praying')}
          className='rounded-full border border-yellow-700 px-4 py-2 text-sm text-yellow-300'
        >
          Praying ({counts.praying})
        </button>

        <button
          onClick={() => addReaction('thank_god')}
          className='rounded-full border border-yellow-700 px-4 py-2 text-sm text-yellow-300'
        >
          Thank God ({counts.thank_god})
        </button>
      </div>

      <form onSubmit={addComment} className='mt-5 space-y-3'>
        <textarea
          className='min-h-24 w-full rounded bg-white p-3 text-black'
          placeholder='Write a comment'
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50'
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>

        {message && <p className='text-sm text-red-400'>{message}</p>}
      </form>

      <div className='mt-6 space-y-3'>
        <h3 className='text-lg font-bold text-yellow-300'>Comments</h3>

        {comments.map((comment) => {
          const canDelete = canModerate || comment.author_id === currentUserId

          return (
            <div key={comment.id} className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
              <p className='text-sm text-yellow-300'>
                {comment.author_name || 'Member'}
              </p>

              <p className='mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300'>
                {comment.content}
              </p>

              <p className='mt-2 text-xs text-gray-500'>
                {new Date(comment.created_at).toLocaleString()}
              </p>

              {canDelete && (
                <button
                  onClick={() => deleteComment(comment.id)}
                  className='mt-3 text-xs text-red-400 underline'
                >
                  Delete comment
                </button>
              )}
            </div>
          )
        })}

        {comments.length === 0 && (
          <p className='text-sm text-gray-500'>No comments yet.</p>
        )}
      </div>
    </div>
  )
}