'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase/client'
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
  const supabase = createClient()
  const [androidNative, setAndroidNative] = useState(false)

  useEffect(() => {
    setAndroidNative(isAndroidNativeApp())
  }, [])

  async function handleGoogleLogin() {
    if (androidNative) return

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}auth/callback`,
      },
    })
  }

  if (androidNative) {
    return (
      <div className='rounded-xl border border-yellow-800 bg-yellow-950/30 p-3 text-sm leading-6 text-yellow-200'>
        Google sign-in in the Android app needs native return setup. Use email login for now.
      </div>
    )
  }

  return (
    <button
      type='button'
      onClick={handleGoogleLogin}
      className='w-full rounded border border-gray-300 bg-white p-3 font-semibold text-black hover:bg-gray-100'
    >
      Continue with Google
    </button>
  )
}
