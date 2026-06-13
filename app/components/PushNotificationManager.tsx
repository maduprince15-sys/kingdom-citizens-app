'use client'

import { useEffect, useState } from 'react'
import { isNativeMobileApp } from '../../lib/mobile-runtime'

type PushStatus =
  | 'checking'
  | 'web'
  | 'ready'
  | 'requesting'
  | 'enabled'
  | 'blocked'
  | 'failed'

const DENIED_STORAGE_KEY = 'kingdom-citizens:push-permission-denied'
const CHANNEL_ID = 'kingdom_citizens_default'
const DEV = process.env.NODE_ENV === 'development'

export default function PushNotificationManager() {
  const [nativeApp, setNativeApp] = useState(false)
  const [status, setStatus] = useState<PushStatus>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const native = isNativeMobileApp()
    setNativeApp(native)

    if (!native) {
      setStatus('web')
      return
    }

    async function checkPermission() {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const permission = await PushNotifications.checkPermissions()

      if (permission.receive === 'granted') {
        setStatus('enabled')
        setMessage('Notifications enabled')
        await setupPushRegistration()
      } else if (
        permission.receive === 'denied' ||
        window.localStorage.getItem(DENIED_STORAGE_KEY) === 'true'
      ) {
        setStatus('blocked')
        setMessage('Notifications blocked in Android settings')
      } else {
        setStatus('ready')
      }
    }

    checkPermission().catch(() => {
      setStatus('failed')
      setMessage('Could not check notification permission.')
    })
  }, [])

  async function createNotificationChannels() {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    await PushNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Kingdom Citizens',
      description: 'Kingdom Citizens app notifications',
      importance: 5,
      visibility: 1,
    }).catch(() => undefined)

    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Kingdom Citizens',
      description: 'Kingdom Citizens app notifications',
      importance: 5,
      visibility: 1,
    }).catch(() => undefined)
  }

  async function registerToken(value: string) {
    const response = await fetch('/api/notifications/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: value,
        platform: 'android',
        deviceLabel: navigator.userAgent.slice(0, 120),
      }),
    })

    if (!response.ok) {
      setStatus('failed')
      setMessage('Notification token registration failed.')
      return
    }

    window.localStorage.removeItem(DENIED_STORAGE_KEY)
    setStatus('enabled')
    setMessage('Notifications enabled')

    if (DEV) {
      setMessage('Notifications enabled. FCM token saved for this user.')
    }
  }

  async function setupPushRegistration() {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    await createNotificationChannels()
    await PushNotifications.removeAllListeners()

    await PushNotifications.addListener('registration', ({ value }) => {
      void registerToken(value)
    })

    await PushNotifications.addListener('registrationError', () => {
      setStatus('failed')
      setMessage('Notification registration failed.')
    })

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      void LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: notification.title || 'Kingdom Citizens',
            body: notification.body || 'New notification',
            channelId: CHANNEL_ID,
            extra: notification.data,
            schedule: { at: new Date(Date.now() + 250) },
          },
        ],
      })
    })

    await PushNotifications.register()
  }

  async function enableNotifications() {
    setStatus('requesting')
    setMessage('Requesting notification permission...')

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      let permission = await PushNotifications.checkPermissions()

      if (permission.receive !== 'granted') {
        permission = await PushNotifications.requestPermissions()
      }

      const localPermission = await LocalNotifications.requestPermissions()

      if (permission.receive !== 'granted' || localPermission.display !== 'granted') {
        window.localStorage.setItem(DENIED_STORAGE_KEY, 'true')
        setStatus('blocked')
        setMessage('Notifications blocked in Android settings')
        return
      }

      await setupPushRegistration()
    } catch {
      setStatus('failed')
      setMessage('Could not enable notifications.')
    }
  }

  if (!nativeApp || status === 'web' || status === 'checking') return null

  return (
    <div className='mb-8 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-6'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl font-bold text-yellow-300'>
            Push Notifications
          </h2>

          <p className='mt-2 text-sm leading-6 text-gray-300'>
            {message || 'Enable Android notifications for messages and Citizens updates.'}
          </p>
        </div>

        {status === 'ready' || status === 'failed' ? (
          <button
            type='button'
            onClick={enableNotifications}
            className='rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400'
          >
            Enable notifications
          </button>
        ) : (
          <span className='rounded-full border border-yellow-800 px-4 py-2 text-sm text-yellow-300'>
            {status === 'requesting' ? 'Requesting...' : status === 'blocked' ? 'Blocked' : 'Enabled'}
          </span>
        )}
      </div>
    </div>
  )
}
