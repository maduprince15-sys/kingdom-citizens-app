import { notFound, redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { canAccessResource, isolatedAttachmentsEnabled } from '../../../lib/messaging/access'
import ChatRoom from '../../chat/ChatRoom'
import AttachmentPanel from '../../components/AttachmentPanel'

export default async function CitizenGroupChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) redirect('/login')
  if (!await canAccessResource(client, user.id, 'groups', id)) notFound()
  const { data: group } = await client.from('citizen_groups').select('name').eq('id', id).single()
  const { data: profile } = await client.from('profiles').select('full_name, role').eq('id', user.id).single()
  const { data: messages, error: messagesError } = await client.from('chat_messages')
    .select('id, sender_id, sender_name, sender_role, body, chat_room, is_deleted, created_at')
    .eq('chat_room', `group:${id}`).order('created_at', { ascending: false }).limit(100)
  return <main className="min-h-screen bg-[#050303] p-4 text-white">
    <h1 className="mb-4 text-2xl font-bold">{group?.name || 'Citizen group'}</h1>
    {messagesError ? <p>Group discussion is unavailable.</p> : <ChatRoom messages={messages || []} currentUserId={user.id}
      currentUserName={profile?.full_name || 'Citizen'} currentUserRole={profile?.role || 'member'}
      canModerate={['admin', 'moderator'].includes(profile?.role || '')} chatRoom={`group:${id}`} title={group?.name || 'Citizen group'} />}
    {isolatedAttachmentsEnabled() && <AttachmentPanel scope="groups" resourceId={id} currentUserId={user.id} />}
  </main>
}
