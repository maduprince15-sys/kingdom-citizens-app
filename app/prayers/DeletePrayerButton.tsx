'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Props = {
  id: string
}

export default function DeletePrayerButton({ id }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm('Delete this prayer request?')
    if (!confirmed) return

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className='rounded-full border border-red-700 px-4 py-2 text-sm text-red-300 hover:bg-red-900/30 disabled:opacity-50'
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>

      {message && <p className='mt-2 text-xs text-red-400'>{message}</p>}
    </div>
  )
}