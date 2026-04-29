'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Book = {
  id: string
  title: string
  pdf_path: string | null
}

type Member = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

type Access = {
  id: string
  book_id: string
  user_id: string
}

type Props = {
  books: Book[]
  members: Member[]
  accessRecords: Access[]
  currentUserId: string
}

export default function BookAccessManager({
  books,
  members,
  accessRecords,
  currentUserId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [bookId, setBookId] = useState('')
  const [userId, setUserId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function approveAccess() {
    setLoading(true)
    setMessage('')

    if (!bookId || !userId) {
      setMessage('Select a book and a member.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('book_access').insert({
      book_id: bookId,
      user_id: userId,
      approved_by: currentUserId,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Book access approved.')
    setLoading(false)
    router.refresh()
  }

  async function revokeAccess(accessId: string) {
    const confirmed = window.confirm('Remove this member’s book access?')
    if (!confirmed) return

    const { error } = await supabase
      .from('book_access')
      .delete()
      .eq('id', accessId)

    if (error) {
      setMessage(error.message)
      return
    }

    router.refresh()
  }

  function getBookTitle(id: string) {
    return books.find((book) => book.id === id)?.title || 'Unknown book'
  }

  function getMemberName(id: string) {
    const member = members.find((item) => item.id === id)
    return member?.full_name || member?.email || 'Unknown member'
  }

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]'>
      <div className='h-fit rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
        <h2 className='text-2xl font-bold'>Approve Book Access</h2>

        <p className='mt-2 text-sm leading-6 text-gray-400'>
          Select a book and a member. The member will be able to download the private PDF.
        </p>

        <div className='mt-5 space-y-4'>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            <option value=''>Select book</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} {book.pdf_path ? '' : '(No PDF uploaded)'}
              </option>
            ))}
          </select>

          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            <option value=''>Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || member.email} — {member.role || 'member'}
              </option>
            ))}
          </select>

          <button
            onClick={approveAccess}
            disabled={loading}
            className='w-full rounded-full bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50'
          >
            {loading ? 'Approving...' : 'Approve Access'}
          </button>

          {message && <p className='text-sm text-yellow-300'>{message}</p>}
        </div>
      </div>

      <div className='space-y-4'>
        <h2 className='text-2xl font-bold'>Approved Downloads</h2>

        {accessRecords.map((record) => (
          <article
            key={record.id}
            className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'
          >
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Approved
            </p>

            <h3 className='mt-2 text-xl font-bold'>
              {getBookTitle(record.book_id)}
            </h3>

            <p className='mt-2 text-sm text-gray-300'>
              Member: {getMemberName(record.user_id)}
            </p>

            <button
              onClick={() => revokeAccess(record.id)}
              className='mt-4 rounded bg-red-700 px-3 py-1 text-sm text-white'
            >
              Revoke Access
            </button>
          </article>
        ))}

        {accessRecords.length === 0 && (
          <p className='text-gray-400'>No approved downloads yet.</p>
        )}
      </div>
    </div>
  )
}