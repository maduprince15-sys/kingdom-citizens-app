'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingUser, setCheckingUser] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.replace('/dashboard')
        return
      }

      setCheckingUser(false)
    }

    checkUser()
  }, [router, supabase])

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

  if (checkingUser) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-[#050303] p-6 text-white'>
        <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-6 text-center'>
          <p className='text-yellow-300'>Checking account...</p>
        </div>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <section className='flex min-h-screen items-center justify-center px-4 py-10'>
        <div className='w-full max-w-md overflow-hidden rounded-3xl border border-yellow-900/40 bg-[#120707] shadow-2xl shadow-black/50'>
          <div className='bg-gradient-to-br from-black via-[#180707] to-[#260909] p-6 text-center'>
            <img
              src='/kingdom-citizens-logo.png'
              alt='The Kingdom Citizens'
              className='mx-auto h-24 w-24 rounded-full object-cover'
            />

            <p className='mt-4 text-xs uppercase tracking-[0.35em] text-yellow-500'>
              The Kingdom Citizens
            </p>

            <h1 className='mt-2 text-3xl font-black'>
              Member Login
            </h1>

            <p className='mt-3 text-sm leading-6 text-gray-300'>
              Enter the Kingdom Citizens dashboard, messages, calendar, prayer wall, and member tools.
            </p>
          </div>

          <div className='p-6'>
            <form onSubmit={handleLogin} className='space-y-4'>
              <div>
                <label className='mb-2 block text-sm text-gray-300'>
                  Email
                </label>
                <input
                  type='email'
                  placeholder='Enter your email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full rounded-xl border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
                  required
                />
              </div>

              <div>
                <label className='mb-2 block text-sm text-gray-300'>
                  Password
                </label>
                <input
                  type='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full rounded-xl border border-gray-300 bg-white p-3 text-black placeholder-gray-500'
                  required
                />
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full rounded-full bg-yellow-500 p-3 font-bold text-black hover:bg-yellow-400 disabled:opacity-50'
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className='my-5 flex items-center gap-3'>
              <div className='h-px flex-1 bg-yellow-900/50' />
              <span className='text-sm text-gray-400'>or</span>
              <div className='h-px flex-1 bg-yellow-900/50' />
            </div>

            <GoogleLoginButton />

            {message && (
              <p className='mt-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-300'>
                {message}
              </p>
            )}

            <div className='mt-6 space-y-3 text-center text-sm'>
              <p className='text-gray-300'>
                Don&apos;t have an account?{' '}
                <Link href='/register' className='font-bold text-yellow-300 underline'>
                  Register
                </Link>
              </p>

              <p>
                <Link href='/forgot-password' className='text-gray-400 underline'>
                  Forgot password?
                </Link>
              </p>

              <p>
                <Link href='/' className='text-gray-500 underline'>
                  Back to public site
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}