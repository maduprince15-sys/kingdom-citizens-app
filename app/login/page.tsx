'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className='mx-auto max-w-md p-6'>
      <h1 className='mb-6 text-2xl font-bold text-white'>Login</h1>

      <form onSubmit={handleLogin} className='space-y-4'>
        <input
          type='email'
          placeholder='Enter your email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
          required
        />

        <input
          type='password'
          placeholder='Enter your password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
          required
        />

        <button
          type='submit'
          disabled={loading}
          className='w-full rounded bg-green-600 p-3 text-white disabled:opacity-50'
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className='mt-4'>
        <Link href='/forgot-password' className='text-sm text-white underline'>
          Forgot password?
        </Link>
      </div>

      {message && <p className='mt-4 text-sm text-white'>{message}</p>}

      <p className='mt-6 text-sm text-white'>
        No account yet? <Link href='/register' className='underline'>Register</Link>
      </p>
    </main>
  )
}
