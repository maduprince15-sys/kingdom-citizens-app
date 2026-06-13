import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isFirebasePushConfigured,
  sendPushToTokens,
} from './firebase-admin-push'

type PushSendInput = {
  supabase: SupabaseClient
  userIds: string[]
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushToUsers(input: PushSendInput) {
  const userIds = Array.from(new Set(input.userIds.filter(Boolean)))

  if (!isFirebasePushConfigured()) {
    return {
      configured: false,
      successCount: 0,
      failureCount: 0,
      tokenCount: 0,
    }
  }

  if (userIds.length === 0) {
    return {
      configured: true,
      successCount: 0,
      failureCount: 0,
      tokenCount: 0,
    }
  }

  const { data: rows, error } = await input.supabase
    .from('user_push_tokens')
    .select('token')
    .in('user_id', userIds)

  if (error || !rows?.length) {
    return {
      configured: true,
      successCount: 0,
      failureCount: 0,
      tokenCount: 0,
    }
  }

  const tokens = rows.map((row) => row.token).filter(Boolean)
  const result = await sendPushToTokens({
    tokens,
    title: input.title,
    body: input.body,
    data: input.data,
  })

  if (result.invalidTokens.length > 0) {
    await input.supabase
      .from('user_push_tokens')
      .delete()
      .in('token', result.invalidTokens)
  }

  return {
    configured: true,
    successCount: result.successCount,
    failureCount: result.failureCount,
    tokenCount: tokens.length,
  }
}

export async function sendPrivateMessagePush(
  supabase: SupabaseClient,
  recipientIds: string[]
) {
  try {
    return await sendPushToUsers({
      supabase,
      userIds: recipientIds,
      title: 'Kingdom Citizens',
      body: 'New encrypted message',
      data: {
        type: 'private_message',
        href: '/messages',
      },
    })
  } catch {
    return {
      configured: isFirebasePushConfigured(),
      successCount: 0,
      failureCount: 1,
      tokenCount: 0,
    }
  }
}

