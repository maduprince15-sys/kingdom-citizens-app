'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  userId: string
  email: string | null
}

export default function DeleteUserButton({ userId, email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${email ?? 'this user'}? This cannot be undone.`
    )

    if (!confirmed) return

    setLoading(true)
    setMessage('')

    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetUserId: userId }),
    })

    const result = await response.json()

    if (!response.ok) {
      setMessage(result.error || 'Failed to delete user.')
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className='rounded bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50'
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>

      {message && <p className='mt-1 text-xs text-red-400'>{message}</p>}
    </div>
  )
}
