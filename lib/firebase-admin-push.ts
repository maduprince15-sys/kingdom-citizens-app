import 'server-only'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

export const ANDROID_NOTIFICATION_CHANNEL_ID = 'kingdom_citizens_default'

type PushPayload = {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}

type MultiPushPayload = Omit<PushPayload, 'token'> & {
  tokens: string[]
}

function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson)
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  }
}

export function isFirebasePushConfigured() {
  return Boolean(getServiceAccount())
}

function getFirebaseMessaging() {
  const serviceAccount = getServiceAccount()

  if (!serviceAccount) {
    throw new Error('Firebase push is not configured.')
  }

  const app =
    getApps()[0] ||
    initializeApp({
      credential: cert(serviceAccount),
    })

  return getMessaging(app)
}

export async function sendPushToToken(input: PushPayload) {
  const messaging = getFirebaseMessaging()

  return messaging.send({
    token: input.token,
    notification: {
      title: input.title,
      body: input.body,
    },
    data: input.data,
    android: {
      priority: 'high',
      notification: {
        channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
      },
    },
  })
}

export async function sendPushToTokens(input: MultiPushPayload) {
  const uniqueTokens = Array.from(new Set(input.tokens.filter(Boolean)))

  if (uniqueTokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      invalidTokens: [] as string[],
    }
  }

  const messaging = getFirebaseMessaging()
  const response = await messaging.sendEachForMulticast({
    tokens: uniqueTokens,
    notification: {
      title: input.title,
      body: input.body,
    },
    data: input.data,
    android: {
      priority: 'high',
      notification: {
        channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
      },
    },
  })

  const invalidTokens = response.responses
    .map((item, index) => ({ item, token: uniqueTokens[index] }))
    .filter(({ item }) => {
      const code = item.error?.code || ''
      return (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      )
    })
    .map(({ token }) => token)

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  }
}
