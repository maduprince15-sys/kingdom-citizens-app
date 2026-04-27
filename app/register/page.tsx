'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

export default function RegisterPage() {
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Account created successfully. Check your email and confirm your signup.')
    setLoading(false)
  }

  return (
    <main className='mx-auto max-w-md p-6 text-white'>
      <h1 className='mb-6 text-2xl font-bold'>Register</h1>

      <form onSubmit={handleRegister} className='space-y-4'>
        <input
          type='text'
          placeholder='Enter your full name'
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
          required
        />

        <input
          type='text'
          placeholder='Enter your phone number'
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
        />

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
          className='w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50'
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {message && <p className='mt-4 text-sm text-white'>{message}</p>}

      <p className='mt-6 text-sm text-white'>
        Already have an account? <Link href='/login' className='underline'>Login</Link>
      </p>
    </main>
  )
}
