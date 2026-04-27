'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  id: number | string
  isPinned: boolean
}

export default function PinAnnouncementButton({ id, isPinned }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleToggle() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/announcements/toggle-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_pinned: !isPinned }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.error || 'Pin update failed.')
        setLoading(false)
        return
      }

      setLoading(false)
      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Network error.'
      setMessage(msg)
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className='rounded bg-amber-600 px-3 py-1 text-sm text-white disabled:opacity-50'
      >
        {loading ? 'Saving...' : isPinned ? 'Unpin' : 'Pin'}
      </button>
      {message && <p className='mt-1 text-xs text-red-400'>{message}</p>}
    </div>
  )
}