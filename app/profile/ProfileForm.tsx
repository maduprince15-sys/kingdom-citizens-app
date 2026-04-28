'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Props = {
  initialFullName: string
  initialPhone: string
  email: string
  role: string
}

export default function ProfileForm({
  initialFullName,
  initialPhone,
  email,
  role,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('You must be logged in to update your profile.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
      })
      .eq('id', user.id)

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Profile updated successfully.')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      <div>
        <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
          Member Profile
        </p>

        <h2 className='mt-2 text-2xl font-bold'>Your Information</h2>

        <p className='mt-2 text-sm text-gray-400'>
          Keep your name and phone number current for The Kingdom Citizens member records.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div>
          <label className='mb-2 block text-sm text-gray-300'>
            Full Name
          </label>
          <input
            type='text'
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className='w-full rounded border border-gray-300 bg-white p-3 text-black'
            placeholder='Enter your full name'
          />
        </div>

        <div>
          <label className='mb-2 block text-sm text-gray-300'>
            Phone Number
          </label>
          <input
            type='text'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className='w-full rounded border border-gray-300 bg-white p-3 text-black'
            placeholder='Enter your phone number'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
          <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
            Email
          </p>
          <p className='mt-2 break-all text-gray-200'>{email}</p>
        </div>

        <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
          <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
            Role
          </p>
          <p className='mt-2 capitalize text-gray-200'>{role}</p>
        </div>
      </div>

      <button
        type='submit'
        disabled={loading}
        className='rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400 disabled:opacity-50'
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>

      {message && (
        <p className='text-sm text-yellow-300'>
          {message}
        </p>
      )}
    </form>
  )
}