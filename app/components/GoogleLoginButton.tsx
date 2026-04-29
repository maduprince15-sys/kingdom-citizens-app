'use client'

import { createClient } from '../../lib/supabase/client'

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

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}auth/callback`,
      },
    })
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