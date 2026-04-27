'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function DeleteAccountButton() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )

    if (!confirmed) return

    setLoading(true)
    setMessage('')

    const response = await fetch('/api/account/delete', {
      method: 'POST',
    })

    const result = await response.json()

    if (!response.ok) {
      setMessage(result.error || 'Failed to delete account.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className='mt-6'>
      <button
        onClick={handleDelete}
        disabled={loading}
        className='rounded bg-red-700 px-4 py-2 text-white disabled:opacity-50'
      >
        {loading ? 'Deleting account...' : 'Delete My Account'}
      </button>

      {message && <p className='mt-3 text-sm text-red-400'>{message}</p>}
    </div>
  )
}
