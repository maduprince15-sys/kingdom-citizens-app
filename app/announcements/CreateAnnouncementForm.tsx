'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

const BUCKET = 'content-media'

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-')
}

export default function CreateAnnouncementForm() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function uploadImageIfNeeded() {
    if (!imageFile) return null

    const filePath = `announcements/${Date.now()}-${safeFileName(imageFile.name)}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const image_url = await uploadImageIfNeeded()

      const response = await fetch('/api/announcements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          image_url,
          video_url: videoUrl,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.error || 'Failed to create announcement.')
        setLoading(false)
        return
      }

      setTitle('')
      setContent('')
      setVideoUrl('')
      setExpiresAt('')
      setImageFile(null)
      setMessage('Announcement posted.')
      setLoading(false)
      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed.'
      setMessage(msg)
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='mb-8 space-y-5 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 shadow-lg shadow-black/30 md:p-6'
    >
      <div>
        <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
          Announcement Manager
        </p>

        <h2 className='mt-2 text-2xl font-bold text-white'>
          Create Announcement
        </h2>

        <p className='mt-2 text-sm leading-6 text-gray-400'>
          Create an official notice. You can set an expiry date for meeting notices,
          temporary updates, and time-sensitive announcements.
        </p>
      </div>

      <div>
        <label className='mb-2 block text-sm text-gray-300'>
          Title
        </label>

        <input
          type='text'
          placeholder='Announcement title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black'
          required
        />
      </div>

      <div>
        <label className='mb-2 block text-sm text-gray-300'>
          Announcement
        </label>

        <textarea
          placeholder='Write the announcement here'
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className='min-h-36 w-full rounded border border-gray-300 bg-white p-3 text-black'
          required
        />
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          <label className='mb-2 block text-sm text-gray-300'>
            Image Optional
          </label>

          <input
            type='file'
            accept='image/png,image/jpeg,image/webp,image/gif'
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className='w-full rounded border border-gray-300 bg-white p-3 text-black'
          />
        </div>

        <div>
          <label className='mb-2 block text-sm text-gray-300'>
            Video Link Optional
          </label>

          <input
            type='url'
            placeholder='YouTube, Vimeo, Drive, etc.'
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className='w-full rounded border border-gray-300 bg-white p-3 text-black'
          />
        </div>
      </div>

      <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
        <label className='mb-2 block text-sm font-bold text-yellow-300'>
          Expiry Date Optional
        </label>

        <input
          type='datetime-local'
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black'
        />

        <p className='mt-2 text-xs leading-5 text-gray-400'>
          Use this for meeting announcements or temporary notices. After this date,
          the announcement will stop showing to ordinary members, but leadership can still see it.
        </p>
      </div>

      <button
        type='submit'
        disabled={loading}
        className='rounded-full bg-yellow-500 px-5 py-3 text-sm font-black text-black hover:bg-yellow-400 disabled:opacity-50'
      >
        {loading ? 'Posting...' : 'Post Announcement'}
      </button>

      {message && (
        <p className='rounded-xl border border-yellow-900/40 bg-black/30 p-3 text-sm text-yellow-300'>
          {message}
        </p>
      )}
    </form>
  )
}