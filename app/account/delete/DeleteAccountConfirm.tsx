'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function DeleteAccountConfirm() {
  const router = useRouter()
  const supabase = createClient()

  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const canDelete = confirmText.trim() === 'DELETE MY ACCOUNT'

  async function handleDelete() {
    setMessage('')

    if (!canDelete) {
      setMessage('You must type DELETE MY ACCOUNT exactly before deleting.')
      return
    }

    const confirmed = window.confirm(
      'This will delete your account. This action cannot be undone. Continue?'
    )

    if (!confirmed) return

    setLoading(true)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
      })

      let result: any = {}

      try {
        result = await response.json()
      } catch {
        result = {}
      }

      if (!response.ok) {
        setMessage(result.error || `Account deletion failed (${response.status}).`)
        setLoading(false)
        return
      }

      await supabase.auth.signOut()
      router.replace('/')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Network error.')
      setLoading(false)
    }
  }

  return (
    <div className='rounded-2xl border border-red-900/40 bg-[#120707] p-5 md:p-6'>
      <p className='text-xs uppercase tracking-[0.25em] text-red-400'>
        Dangerous Action
      </p>

      <h2 className='mt-2 text-2xl font-bold text-red-300'>
        Delete Your Account
      </h2>

      <p className='mt-3 text-sm leading-6 text-gray-300'>
        This will remove your Kingdom Citizens account access. This action should only be used intentionally.
      </p>

      <div className='mt-5 rounded-xl border border-red-900/40 bg-black/40 p-4'>
        <p className='text-sm leading-6 text-gray-300'>
          To continue, type:
        </p>

        <p className='mt-2 rounded bg-red-950/40 p-3 font-bold tracking-wide text-red-200'>
          DELETE MY ACCOUNT
        </p>
      </div>

      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className='mt-5 w-full rounded border border-gray-300 bg-white p-3 text-black'
        placeholder='Type DELETE MY ACCOUNT'
      />

      <button
        onClick={handleDelete}
        disabled={!canDelete || loading}
        className='mt-5 rounded-full bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {loading ? 'Deleting...' : 'Delete My Account'}
      </button>

      {message && (
        <p className='mt-4 rounded-xl border border-red-900/40 bg-black/30 p-4 text-sm text-red-300'>
          {message}
        </p>
      )}
    </div>
  )
}