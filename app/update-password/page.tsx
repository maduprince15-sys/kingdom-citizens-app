'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient, supabaseConfigured } from '../../lib/supabase/client'

export default function UpdatePasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!supabaseConfigured) return
    let active = true
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (!active) return
      setAuthenticated(Boolean(user && !error))
      if (!user || error) setMessage('Open the newest password recovery email to continue.')
    }).catch(() => {
      if (active) setMessage('Could not verify your recovery session. Please request a new link.')
    })
    return () => { active = false }
  }, [supabase])

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!authenticated) return
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setMessage('Password updated successfully. Redirecting...')
      setLoading(false)

      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1000)
    } catch {
      setMessage('Unable to reach sign-in services. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='mx-auto max-w-md p-6 text-white'>
      <h1 className='mb-6 text-2xl font-bold'>Update Password</h1>

      <form onSubmit={handleUpdatePassword} className='space-y-4'>
        <input
          type='password'
          minLength={8}
          autoComplete='new-password'
          placeholder='Enter new password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
          required
        />

        <input
          type='password'
          minLength={8}
          autoComplete='new-password'
          placeholder='Confirm new password'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className='w-full rounded border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
          required
        />

        <button
          type='submit'
          disabled={loading || !authenticated}
          className='w-full rounded bg-green-600 p-3 text-white disabled:opacity-50'
        >
          {loading ? 'Updating password...' : 'Update password'}
        </button>
      </form>

      {message && <p className='mt-4 text-sm text-white'>{message}</p>}

      <p className='mt-6 text-sm text-white'>
        Back to <Link href='/login' className='underline'>Login</Link>
      </p>
    </main>
  )
}
