'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { startAndroidGoogleOAuth } from '../../lib/android-google-auth'
import { isAndroidNativeApp } from '../../lib/mobile-runtime'

const getURL = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (siteUrl) {
    return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`
  }

  return 'http://localhost:3000/'
}

export default function GoogleLoginButton() {
  const supabase = useMemo(() => createClient(), [])
  const [androidNative, setAndroidNative] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setAndroidNative(isAndroidNativeApp())
  }, [])

  async function handleGoogleLogin() {
    setLoading(true)
    setMessage(androidNative ? 'Opening Google sign-in...' : null)

    if (androidNative) {
      try {
        await startAndroidGoogleOAuth(supabase)
        setMessage('Waiting for Android return...')
        setLoading(false)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Google sign-in failed.')
        setLoading(false)
      }

      return
    }

    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getURL()}auth/callback`,
        },
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.')
      setLoading(false)
    }
  }

  return (
    <div className='space-y-2'>
      <button
        type='button'
        onClick={handleGoogleLogin}
        disabled={loading}
        className='w-full rounded border border-gray-300 bg-white p-3 font-semibold text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60'
      >
        {loading ? 'Opening Google...' : 'Continue with Google'}
      </button>

      {message && (
        <p className='rounded border border-red-800 bg-red-950/40 p-3 text-sm text-red-200'>
          {message}
        </p>
      )}
    </div>
  )
}
