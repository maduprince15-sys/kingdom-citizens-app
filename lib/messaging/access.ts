import type { SupabaseClient } from '@supabase/supabase-js'

export const resourceIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export type AttachmentScope = 'messages' | 'groups'

// Always use the caller's authenticated client. No service key bypass.
export async function canAccessResource(client: SupabaseClient, userId: string, scope: AttachmentScope, id: string) {
  if (!resourceIdPattern.test(id)) return false
  if (scope === 'messages') {
    const { data, error } = await client.from('app_messages')
      .select('sender_id, recipient_id').eq('id', id).maybeSingle()
    return !error && Boolean(data && (data.sender_id === userId || data.recipient_id === userId))
  }
  const { data: group, error: groupError } = await client.from('citizen_groups')
    .select('id, is_active').eq('id', id).eq('is_active', true).maybeSingle()
  if (groupError || !group?.is_active) return false
  const { data: membership, error } = await client.from('citizen_group_members')
    .select('id').eq('group_id', id).eq('user_id', userId).maybeSingle()
  return !error && Boolean(membership)
}

export function isolatedAttachmentsEnabled() {
  const ref = process.env.KC_ISOLATED_TEST_PROJECT_REF
  // Explicit deployment opt-in; never silently enable against the known live project.
  return process.env.KC_PRIVATE_ATTACHMENTS_ENABLED === 'isolated-test-only' &&
    process.env.VERCEL_ENV !== 'production' && Boolean(ref && ref !== 'jngbhejfqbyjletfknkh' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL === `https://${ref}.supabase.co`)
}
