'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        setMessage('Could not sign out. Please try again.')
        return
      }
      router.replace('/login')
      router.refresh()
    } catch {
      setMessage('Could not sign out. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
    <button
      disabled={loading}
      onClick={handleLogout}
      className='mt-4 rounded bg-red-600 px-4 py-2 text-white'
    >
      {loading ? 'Signing out...' : 'Logout'}
    </button>
    {message && <p role="alert">{message}</p>}
    </div>
  )
}
