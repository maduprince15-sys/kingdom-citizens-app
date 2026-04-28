'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function PrayerForm() {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

    const { error } = await supabase.from('prayer_requests').insert({
      author_id: user.id,
      author_name: authorName,
      title,
      body,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setTitle('')
    setBody('')
    setMessage('Prayer request posted.')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className='h-fit space-y-4 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
      <h2 className='text-2xl font-bold'>Add Prayer Request</h2>

      <input
        className='w-full rounded bg-white p-3 text-black'
        placeholder='Prayer title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className='min-h-40 w-full rounded bg-white p-3 text-black'
        placeholder='Write the prayer request'
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      <button
        disabled={loading}
        className='rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-50'
      >
        {loading ? 'Posting...' : 'Post Prayer'}
      </button>

      {message && <p className='text-sm text-yellow-300'>{message}</p>}
    </form>
  )
}