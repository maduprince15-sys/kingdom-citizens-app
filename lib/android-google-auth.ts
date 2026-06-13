'use client'

import type { SupabaseClient } from '@supabase/supabase-js'

export const ANDROID_GOOGLE_REDIRECT_URL = 'kingdomcitizens://auth/callback'

type NativeAuthResult =
  | { handled: true; error?: string }
  | { handled: false }

export async function startAndroidGoogleOAuth(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: ANDROID_GOOGLE_REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  })

  if (error) throw error
  if (!data.url) throw new Error('Google sign-in did not return an OAuth URL.')

  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url: data.url })
}

export async function handleAndroidGoogleCallback(
  supabase: SupabaseClient,
  callbackUrl: string
): Promise<NativeAuthResult> {
  const parsed = new URL(callbackUrl)

  if (parsed.protocol !== 'kingdomcitizens:' || parsed.hostname !== 'auth') {
    return { handled: false }
  }

  if (!parsed.pathname.startsWith('/callback')) {
    return { handled: false }
  }

  const oauthError =
    parsed.searchParams.get('error_description') ||
    parsed.searchParams.get('error')

  if (oauthError) {
    return { handled: true, error: oauthError }
  }

  const code = parsed.searchParams.get('code')

  if (!code) {
    return { handled: true, error: 'Google sign-in returned without an auth code.' }
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return { handled: true, error: error.message }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { handled: true, error: 'Google sign-in completed without an app session.' }
  }

  const profileResponse = await fetch('/api/auth/native-profile', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (!profileResponse.ok) {
    return { handled: true, error: 'Google sign-in completed, but profile setup failed.' }
  }

  const { Browser } = await import('@capacitor/browser')
  await Browser.close().catch(() => undefined)

  return { handled: true }
}
