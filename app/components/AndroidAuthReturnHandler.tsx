'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import {
  completeNativeProfileSetup,
  handleAndroidGoogleCallback,
} from '../../lib/android-google-auth'
import { isAndroidNativeApp } from '../../lib/mobile-runtime'

const DEV = process.env.NODE_ENV === 'development'

export default function AndroidAuthReturnHandler() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!isAndroidNativeApp()) return

    let active = true
    let listener: { remove: () => Promise<void> } | undefined

    async function handleUrl(url: string) {
      if (!url.startsWith('kingdomcitizens://auth/callback')) return

      if (DEV) setStatus('Waiting for Android return...')

      const result = await handleAndroidGoogleCallback(supabase, url)

      if (!active || !result.handled) return

      if (result.error) {
        setStatus(result.error)
        return
      }

      const profileResult = await completeNativeProfileSetup(supabase)

      if (!active) return

      if (!profileResult.ok) {
        setStatus(profileResult.error)
        return
      }

      const { Browser } = await import('@capacitor/browser')
      await Browser.close().catch(() => undefined)

      if (DEV) setStatus('Google sign-in completed.')
      router.replace('/dashboard')
      router.refresh()
    }

    async function setupListener() {
      const { App } = await import('@capacitor/app')

      listener = await App.addListener('appUrlOpen', ({ url }) => {
        void handleUrl(url)
      })

      const launch = await App.getLaunchUrl()
      if (launch?.url) {
        await handleUrl(launch.url)
      }
    }

    setupListener().catch(() => {
      if (active) setStatus('Google sign-in did not return a session.')
    })

    return () => {
      active = false
      listener?.remove()
    }
  }, [router, supabase])

  if (!DEV || !status) return null

  return (
    <div className='fixed bottom-3 left-3 right-3 z-50 rounded border border-yellow-700 bg-black/90 px-4 py-3 text-sm text-yellow-200 shadow-lg md:left-auto md:right-3 md:max-w-sm'>
      {status}
    </div>
  )
}

