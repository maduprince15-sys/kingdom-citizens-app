'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type ChatMessage = {
  id: string
  sender_id: string
  sender_name: string | null
  sender_role: string | null
  body: string
  chat_room: string
  is_deleted: boolean
  created_at: string
}

type Props = {
  messages: ChatMessage[]
  currentUserId: string
  currentUserName: string
  currentUserRole: string
  canModerate: boolean
}

export default function ChatRoom({
  messages,
  currentUserId,
  currentUserName,
  currentUserRole,
  canModerate,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(messages)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const orderedMessages = useMemo(() => {
    return [...chatMessages].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [chatMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [orderedMessages.length])

  useEffect(() => {
    const channel = supabase
      .channel('general-chat-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'chat_room=eq.general',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage

          setChatMessages((current) => {
            const alreadyExists = current.some((item) => item.id === newMessage.id)

            if (alreadyExists) {
              return current
            }

            return [...current, newMessage]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: 'chat_room=eq.general',
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage

          setChatMessages((current) =>
            current.map((item) =>
              item.id === updatedMessage.id ? updatedMessage : item
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const cleanBody = body.trim()

    if (!cleanBody) {
      setMessage('Write a message first.')
      setLoading(false)
      return
    }

    if (cleanBody.length > 2000) {
      setMessage('Message is too long. Maximum is 2000 characters.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('chat_messages').insert({
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      body: cleanBody,
      chat_room: 'general',
      is_deleted: false,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setBody('')
    setMessage('')
    setLoading(false)
  }

 async function deleteMessage(id: string, mine: boolean) {
  const confirmed = window.confirm(
    mine
      ? 'Delete your message from the group chat?'
      : 'Remove this chat message from the group chat?'
  )

  if (!confirmed) return

  const response = await fetch('/api/chat/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messageId: id,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    alert(result.error || 'Could not delete message.')
    return
  }

  setChatMessages((current) =>
    current.map((item) =>
      item.id === id
        ? {
            ...item,
            is_deleted: true,
          }
        : item
    )
  )

  router.refresh()
}

  return (
    <div className='mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-yellow-900/40 bg-[#080404] shadow-2xl shadow-black/50'>
      <div className='border-b border-yellow-900/40 bg-gradient-to-r from-[#230909] via-[#120707] to-black p-5'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              General Group Chat
            </p>

            <h2 className='mt-1 text-2xl font-black text-white'>
              Citizens Discussion
            </h2>

            <p className='mt-1 text-xs text-gray-400'>
              Members-only chat · posting as {currentUserName}
            </p>
          </div>

          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-xl font-black text-black'>
            KC
          </div>
        </div>
      </div>

      <div className='h-[62vh] overflow-y-auto bg-gradient-to-b from-[#050303] via-[#0b0505] to-black p-4 md:p-6'>
        <div className='space-y-4'>
          {orderedMessages.map((item) => {
            const mine = item.sender_id === currentUserId

            return (
              <div
                key={item.id}
                className={mine ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    mine
                      ? 'max-w-[85%] rounded-3xl rounded-br-md border border-yellow-600/40 bg-yellow-500 px-4 py-3 text-black shadow-lg shadow-black/30 md:max-w-[70%]'
                      : item.is_deleted
                        ? 'max-w-[85%] rounded-3xl rounded-bl-md border border-red-900/40 bg-red-950/30 px-4 py-3 text-red-200 md:max-w-[70%]'
                        : 'max-w-[85%] rounded-3xl rounded-bl-md border border-yellow-900/35 bg-[#180707] px-4 py-3 text-white shadow-lg shadow-black/30 md:max-w-[70%]'
                  }
                >
                  <div className='mb-1 flex flex-wrap items-center gap-2'>
                    {!mine && (
                      <p className='text-xs font-black text-yellow-300'>
                        {item.sender_name || 'Citizen'}
                      </p>
                    )}

                    {!mine && (
                      <span className='rounded-full border border-yellow-900/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-gray-400'>
                        {item.sender_role || 'member'}
                      </span>
                    )}

                    {mine && (
                      <p className='text-xs font-black text-black/70'>
                        You
                      </p>
                    )}
                  </div>

                  <p
                    className={
                      mine
                        ? 'whitespace-pre-wrap break-words text-sm leading-6 text-black md:text-base'
                        : 'whitespace-pre-wrap break-words text-sm leading-6 text-gray-100 md:text-base'
                    }
                  >
                    {item.is_deleted
                      ? 'This message was removed by a moderator.'
                      : item.body}
                  </p>

                  <div className='mt-2 flex items-center justify-between gap-3'>
                    <p
                      className={
                        mine
                          ? 'text-[11px] font-semibold text-black/60'
                          : 'text-[11px] text-gray-500'
                      }
                    >
                      {new Date(item.created_at).toLocaleString()}
                    </p>

                    {(canModerate || mine) && !item.is_deleted && (
  <button
    onClick={() => deleteMessage(item.id, mine)}
    className={
      mine
        ? 'text-[11px] font-bold text-red-900 underline'
        : 'text-[11px] font-bold text-red-300 underline'
    }
  >
    {mine ? 'Delete' : 'Remove'}
  </button>
)}
                  </div>
                </div>
              </div>
            )
          })}

          {orderedMessages.length === 0 && (
            <div className='rounded-3xl border border-yellow-900/30 bg-[#120707] p-6 text-center text-gray-400'>
              No group chat messages yet. Start the first discussion.
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form
        onSubmit={sendMessage}
        className='border-t border-yellow-900/40 bg-[#120707] p-4'
      >
        <div className='flex flex-col gap-3 md:flex-row md:items-end'>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className='min-h-16 flex-1 resize-none rounded-2xl border border-yellow-900/40 bg-white p-3 text-black outline-none focus:border-yellow-500'
            placeholder='Write a message...'
          />

          <button
            disabled={loading}
            className='rounded-2xl bg-yellow-500 px-6 py-4 text-sm font-black text-black hover:bg-yellow-400 disabled:opacity-50'
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {message && (
          <p className='mt-3 rounded-xl border border-yellow-900/40 bg-black/30 p-3 text-sm text-yellow-300'>
            {message}
          </p>
        )}

        <p className='mt-3 text-xs text-gray-500'>
          Protected group chat: logged-in members only. Admins and moderators can remove harmful messages.
        </p>
      </form>
    </div>
  )
}