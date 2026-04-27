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
    <form onSubmit={handleSubmit} className='mb-8 space-y-4 rounded border border-gray-700 p-4'>
      <h2 className='text-xl font-bold'>Create Announcement</h2>

      <input
        type='text'
        placeholder='Title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className='w-full rounded border border-gray-300 bg-white p-3 text-black'
        required
      />

      <textarea
        placeholder='Write the announcement here'
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className='min-h-36 w-full rounded border border-gray-300 bg-white p-3 text-black'
        required
      />

      <input
        type='file'
        accept='image/png,image/jpeg,image/webp,image/gif'
        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        className='w-full rounded border border-gray-300 bg-white p-3 text-black'
      />

      <input
        type='url'
        placeholder='Video link (YouTube, Vimeo, Drive, etc.)'
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        className='w-full rounded border border-gray-300 bg-white p-3 text-black'
      />

      <button
        type='submit'
        disabled={loading}
        className='rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50'
      >
        {loading ? 'Posting...' : 'Post Announcement'}
      </button>

      {message && <p className='text-sm text-green-400'>{message}</p>}
    </form>
  )
}
