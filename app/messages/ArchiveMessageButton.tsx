'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  id: string
  box?: 'inbox' | 'sent'
}

export default function ArchiveMessageButton({ id, box = 'inbox' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleArchive() {
    const confirmed = window.confirm('Archive this message?')
    if (!confirmed) return

    setLoading(true)
    setMessage('')

    const response = await fetch('/api/messages/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, box }),
    })

    const result = await response.json()

    if (!response.ok) {
      setMessage(result.error || 'Archive failed.')
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleArchive}
        disabled={loading}
        className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20 disabled:opacity-50'
      >
        {loading ? 'Archiving...' : 'Archive'}
      </button>

      {message && <p className='mt-2 text-xs text-red-400'>{message}</p>}
    </div>
  )
}