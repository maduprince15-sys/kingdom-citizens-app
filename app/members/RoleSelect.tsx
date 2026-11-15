'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getAssignableRoles } from '../../lib/permissions'

type Props = {
  userId: string
  email: string | null
  currentRole: string | null
  actorRole: string | null
}

export default function RoleSelect({
  userId,
  email,
  currentRole,
  actorRole,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const options = getAssignableRoles(actorRole)

  async function handleChange(nextRole: string) {
    if (nextRole === currentRole) return

    const confirmed = window.confirm(
      `Change ${email ?? 'this user'} from ${currentRole ?? 'member'} to ${nextRole}?`
    )

    if (!confirmed) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: userId,
          newRole: nextRole,
        }),
      })

      let result: { error?: string } = {}

      try {
        result = await response.json()
      } catch {
        result = {}
      }

      if (!response.ok) {
        setMessage(result.error || `Role change failed (${response.status})`)
        setLoading(false)
        return
      }

      setMessage('Role updated.')
      setLoading(false)
      router.refresh()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Network error.'
      setMessage(msg)
      setLoading(false)
    }
  }

  if (options.length === 0) {
    return <p className='text-sm text-gray-400'>{currentRole ?? 'member'}</p>
  }

  return (
    <div>
      <select
        defaultValue={currentRole ?? 'member'}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value)}
        className='rounded border border-gray-600 bg-gray-900 px-2 py-1 text-white'
      >
        <option value={currentRole ?? 'member'}>
          {currentRole ?? 'member'}
        </option>

        {options
          .filter((role) => role !== currentRole)
          .map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
      </select>

      {message && <p className='mt-1 text-xs text-green-400'>{message}</p>}
    </div>
  )
}