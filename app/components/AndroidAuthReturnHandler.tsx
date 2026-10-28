'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import {
  completeNativeProfileSetup,
  handleAndroidGoogleCallback,
} from '../../lib/android-google-auth'
import { isAndroidNativeApp } from '../../lib/mobile-runtime'

export default function AndroidAuthReturnHandler() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!isAndroidNativeApp()) return

    let active = true
    let listener: { remove: () => Promise<void> } | undefined
    let processing = false

    async function handleUrl(url: string) {
      if (!url.startsWith('kingdomcitizens://auth/callback') || processing) return
      processing = true
      setStatus('Completing Google sign-in...')

      try {
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
        setStatus(null)
        router.replace('/dashboard')
        router.refresh()
      } catch (error) {
        if (active) {
          setStatus(error instanceof Error ? error.message : 'Google sign-in could not be completed.')
        }
      } finally {
        processing = false
      }
    }

    async function setupListener() {
      const { App } = await import('@capacitor/app')
      listener = await App.addListener('appUrlOpen', ({ url }) => {
        void handleUrl(url)
      })

      const launch = await App.getLaunchUrl()
      if (launch?.url) await handleUrl(launch.url)
    }

    setupListener().catch(() => {
      if (active) setStatus('Could not listen for the Google sign-in return link.')
    })

    return () => {
      active = false
      void listener?.remove()
    }
  }, [router, supabase])

  if (!status) return null

  return (
    <div role='alert' className='fixed bottom-3 left-3 right-3 z-50 rounded border border-yellow-700 bg-black/90 px-4 py-3 text-sm text-yellow-200 shadow-lg md:left-auto md:right-3 md:max-w-sm'>
      {status}
    </div>
  )
}
