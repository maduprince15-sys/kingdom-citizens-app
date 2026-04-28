'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Props = {
  id: string
  count: number
}

export default function PrayedButton({ id, count }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handlePrayed() {
    setLoading(true)

    const { error } = await supabase
      .from('prayer_requests')
      .update({ prayed_count: count + 1 })
      .eq('id', id)

    setLoading(false)

    if (!error) {
      router.refresh()
    }
  }

  return (
    <button
      onClick={handlePrayed}
      disabled={loading}
      className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black disabled:opacity-50'
    >
      {loading ? 'Saving...' : `I prayed (${count})`}
    </button>
  )
}