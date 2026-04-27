'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '../../../../lib/supabase/client'

const BUCKET = 'content-media'

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export default function EditPostPage() {
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [existingImageUrl, setExistingImageUrl] = useState('')
  const [newImage, setNewImage] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  useEffect(() => {
    async function loadPost() {
      setLoading(true)
      setMessage('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? 'member'

      const { data: post, error } = await supabase
        .from('app_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !post) {
        setMessage('Post not found.')
        setLoading(false)
        return
      }

      const canEdit =
        role === 'owner' ||
        role === 'moderator' ||
        post.author_id === user.id

      if (!canEdit) {
        setMessage('You do not have permission to edit this post.')
        setLoading(false)
        return
      }

      setTitle(post.title || '')
      setContent(post.content || '')
      setVideoUrl(post.video_url || '')
      setExistingImageUrl(post.image_url || '')
      setLoading(false)
    }

    loadPost()
  }, [id, router, supabase])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    let finalImageUrl = existingImageUrl

    if (removeImage) {
      finalImageUrl = ''
    }

    if (newImage) {
      const filePath = `posts/${Date.now()}-${safeFileName(newImage.name)}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, newImage, {
          cacheControl: '3600',
          upsert: true,
          contentType: newImage.type,
        })

      if (uploadError) {
        setMessage(uploadError.message)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
      finalImageUrl = data.publicUrl
    }

    const { error } = await supabase
      .from('app_posts')
      .update({
        title,
        content,
        image_url: finalImageUrl || null,
        video_url: videoUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Post updated successfully.')
    setSaving(false)

    setTimeout(() => {
      router.push('/posts')
      router.refresh()
    }, 1000)
  }

  if (loading) {
    return (
      <main className='mx-auto max-w-2xl p-6 text-white'>
        <p>Loading...</p>
      </main>
    )
  }

  if (
    message === 'Post not found.' ||
    message === 'You do not have permission to edit this post.'
  ) {
    return (
      <main className='mx-auto max-w-2xl p-6 text-white'>
        <h1 className='mb-4 text-3xl font-bold'>Edit Post</h1>
        <p className='mb-4 text-red-400'>{message}</p>
        <Link href='/posts' className='text-blue-400 underline'>
          Back to Posts
        </Link>
      </main>
    )
  }

  return (
    <main className='mx-auto max-w-2xl p-6 text-white'>
      <h1 className='mb-6 text-3xl font-bold'>Edit Post</h1>

      <form onSubmit={handleSave} className='space-y-4'>
        <input
          type='text'
          placeholder='Title'
          className='w-full rounded border border-gray-300 bg-white p-3 text-black'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder='Write your post here'
          className='min-h-40 w-full rounded border border-gray-300 bg-white p-3 text-black'
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        {existingImageUrl && !removeImage && (
          <div>
            <p className='mb-2 text-sm text-gray-300'>Current image:</p>
            <img
              src={existingImageUrl}
              alt='Current post'
              className='max-h-80 rounded border'
            />
          </div>
        )}

        <label className='block text-sm text-gray-300'>
          <input
            type='checkbox'
            checked={removeImage}
            onChange={(e) => setRemoveImage(e.target.checked)}
            className='mr-2'
          />
          Remove current image
        </label>

        <input
          type='file'
          accept='image/png,image/jpeg,image/webp,image/gif'
          className='w-full rounded border border-gray-300 bg-white p-3 text-black'
          onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
        />

        <input
          type='url'
          placeholder='Video link (YouTube, Vimeo, Drive, etc.)'
          className='w-full rounded border border-gray-300 bg-white p-3 text-black'
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        <button
          type='submit'
          disabled={saving}
          className='w-full rounded bg-green-600 p-3 text-white disabled:opacity-50'
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {message && <p className='mt-4 text-sm text-yellow-300'>{message}</p>}

      <div className='mt-6'>
        <Link href='/posts' className='text-blue-400 underline'>
          Back to Posts
        </Link>
      </div>
    </main>
  )
}