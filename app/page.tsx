'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [status, setStatus] = useState('Testing connection...')

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase.from('profiles').select('id').limit(1)

      if (error) {
        setStatus(`Supabase connected, but query error: ${error.message}`)
      } else {
        setStatus('Supabase connected successfully.')
      }
    }

    testConnection()
  }, [])

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Kingdom Citizens App</h1>
      <p>{status}</p>
    </main>
  )
}