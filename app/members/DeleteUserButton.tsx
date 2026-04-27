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

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: userId }),
      })

      let result: any = {}
      try {
        result = await response.json()
      } catch {
        result = {}
      }

      if (!response.ok) {
        setMessage(result.error || `Delete failed (${response.status})`)
        setLoading(false)
        return
      }

      setMessage('User deleted successfully.')
      setLoading(false)
      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Network error during delete.'
      setMessage(msg)
      setLoading(false)
    }
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
