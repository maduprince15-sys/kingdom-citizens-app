'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000/'

  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  return url
}

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleResetRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getURL()}auth/callback?next=/update-password`,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Password reset email sent. Check your inbox and open the newest reset link.')
    setLoading(false)
  }

  return (
    <main className='mx-auto max-w-md p-6 text-white'>
      <h1 className='mb-6 text-2xl font-bold'>Forgot Password</h1>

      <form onSubmit={handleResetRequest} className='space-y-4'>
        <input
          type='email'
          placeholder='Enter your email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
          required
        />

        <button
          type='submit'
          disabled={loading}
          className='w-full rounded bg-orange-600 p-3 text-white disabled:opacity-50'
        >
          {loading ? 'Sending reset email...' : 'Send reset email'}
        </button>
      </form>

      {message && <p className='mt-4 text-sm text-white'>{message}</p>}

      <p className='mt-6 text-sm text-white'>
        Back to <Link href='/login' className='underline'>Login</Link>
      </p>
    </main>
  )
}
