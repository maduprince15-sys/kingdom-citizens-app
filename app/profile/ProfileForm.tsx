'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../lib/supabase/client'

type Props = {
  initialFullName: string
  initialPhone: string
  initialBirthdayMonth: number | null
  initialBirthdayDay: number | null
  initialShowBirthday: boolean
  initialAvatarUrl: string
  email: string
  role: string
}

const getURL = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (siteUrl) {
    return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`
  }

  return 'http://localhost:3000/'
}

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const days = Array.from({ length: 31 }, (_, index) => String(index + 1))

function getMonthName(monthValue: string) {
  return months.find((month) => month.value === monthValue)?.label || ''
}

export default function ProfileForm({
  initialFullName,
  initialPhone,
  initialBirthdayMonth,
  initialBirthdayDay,
  initialShowBirthday,
  initialAvatarUrl,
  email,
  role,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState(initialFullName)
  const [phone, setPhone] = useState(initialPhone)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [birthdayMonth, setBirthdayMonth] = useState(
    initialBirthdayMonth ? String(initialBirthdayMonth) : ''
  )
  const [birthdayDay, setBirthdayDay] = useState(
    initialBirthdayDay ? String(initialBirthdayDay) : ''
  )
  const [showBirthday, setShowBirthday] = useState(initialShowBirthday)

  const [newEmail, setNewEmail] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [message, setMessage] = useState('')

  async function uploadAvatarIfNeeded(userId: string) {
    if (!avatarFile) return avatarUrl || null

    if (!avatarFile.type.startsWith('image/')) {
      throw new Error('Please upload an image file.')
    }

    const maxSize = 5 * 1024 * 1024

    if (avatarFile.size > maxSize) {
      throw new Error('Profile photo is too large. Maximum size is 5MB.')
    }

    const fileExt = avatarFile.name.split('.').pop() || 'png'
    const filePath = `${userId}/profile-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingProfile(true)
    setMessage('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('You must be logged in to update your profile.')
        setLoadingProfile(false)
        return
      }

      const monthNumber = birthdayMonth ? Number(birthdayMonth) : null
      const dayNumber = birthdayDay ? Number(birthdayDay) : null

      if ((monthNumber && !dayNumber) || (!monthNumber && dayNumber)) {
        setMessage('Please select both birthday month and birthday day, or leave both empty.')
        setLoadingProfile(false)
        return
      }

      const finalAvatarUrl = await uploadAvatarIfNeeded(user.id)

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          avatar_url: finalAvatarUrl,
          birthday_month: monthNumber,
          birthday_day: dayNumber,
          show_birthday: showBirthday,
        })
        .eq('id', user.id)

      if (error) {
        setMessage(error.message)
        setLoadingProfile(false)
        return
      }

      setAvatarUrl(finalAvatarUrl || '')
      setAvatarFile(null)
      setMessage('Profile updated successfully.')
      setLoadingProfile(false)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Profile update failed.')
      setLoadingProfile(false)
    }
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoadingEmail(true)
    setMessage('')

    if (!newEmail.trim()) {
      setMessage('Enter a new email address.')
      setLoadingEmail(false)
      return
    }

    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setMessage('This is already your current email address.')
      setLoadingEmail(false)
      return
    }

    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      {
        emailRedirectTo: `${getURL()}auth/callback`,
      }
    )

    if (error) {
      setMessage(error.message)
      setLoadingEmail(false)
      return
    }

    setMessage(
      'Verification email sent. Open your new email inbox and confirm the change.'
    )
    setNewEmail('')
    setLoadingEmail(false)
  }

  const birthdayText =
    birthdayMonth && birthdayDay
      ? `${getMonthName(birthdayMonth)} ${birthdayDay}`
      : 'Not set'

  return (
    <div className='space-y-8'>
      <form onSubmit={handleProfileSubmit} className='space-y-5'>
        <div>
          <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
            Member Profile
          </p>

          <h2 className='mt-2 text-2xl font-bold'>Your Information</h2>

          <p className='mt-2 text-sm text-gray-400'>
            Keep your name, profile photo, optional phone number, and birthday celebration details current for The Kingdom Citizens member records.
          </p>
        </div>

        <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
          <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
            Profile Photo
          </p>

          <h3 className='mt-2 text-xl font-bold'>
            Your Photo
          </h3>

          <p className='mt-2 text-sm leading-6 text-gray-400'>
            Upload a profile photo. This can be used for birthday celebrations, group records, and member identity inside the app.
          </p>

          <div className='mt-5 flex flex-col gap-5 md:flex-row md:items-center'>
            <div className='flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-yellow-900/40 bg-[#120707]'>
              {avatarFile ? (
                <p className='px-3 text-center text-xs text-yellow-300'>
                  New photo selected
                </p>
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'Profile photo'}
                  className='h-full w-full object-cover'
                />
              ) : (
                <span className='text-4xl font-bold text-yellow-500'>
                  {(fullName || email || 'C').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className='flex-1'>
              <input
                type='file'
                accept='image/*'
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className='w-full rounded border border-gray-300 bg-white p-3 text-black'
              />

              <p className='mt-2 text-xs text-gray-500'>
                Maximum file size: 5MB. Image files only.
              </p>

              {avatarFile && (
                <p className='mt-2 text-sm text-yellow-300'>
                  Selected: {avatarFile.name}
                </p>
              )}
            </div>
          </div>
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
              Phone Number Optional
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

        <div className='rounded-2xl border border-yellow-900/40 bg-black/30 p-4'>
          <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
            Birthday
          </p>

          <h3 className='mt-2 text-xl font-bold'>
            Birthday Celebration Details
          </h3>

          <p className='mt-2 text-sm leading-6 text-gray-400'>
            Only month and day are stored. No birth year is collected.
          </p>

          <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm text-gray-300'>
                Birthday Month
              </label>
              <select
                value={birthdayMonth}
                onChange={(e) => setBirthdayMonth(e.target.value)}
                className='w-full rounded border border-gray-300 bg-white p-3 text-black'
              >
                <option value=''>Select month</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm text-gray-300'>
                Birthday Day
              </label>
              <select
                value={birthdayDay}
                onChange={(e) => setBirthdayDay(e.target.value)}
                className='w-full rounded border border-gray-300 bg-white p-3 text-black'
              >
                <option value=''>Select day</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className='mt-4 flex items-start gap-3 text-sm text-gray-300'>
            <input
              type='checkbox'
              checked={showBirthday}
              onChange={(e) => setShowBirthday(e.target.checked)}
              className='mt-1'
            />
            <span>
              Allow The Kingdom Citizens to show my birthday month/day for birthday celebration.
            </span>
          </label>

          <div className='mt-4 rounded-xl border border-yellow-900/30 bg-[#120707] p-4'>
            <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
              Current Birthday Display
            </p>
            <p className='mt-2 text-gray-200'>
              {birthdayText}
              {birthdayText !== 'Not set' && !showBirthday ? ' hidden from public birthday lists' : ''}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4'>
            <p className='text-xs uppercase tracking-[0.2em] text-yellow-500'>
              Current Email
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
          disabled={loadingProfile}
          className='rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400 disabled:opacity-50'
        >
          {loadingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <form
        onSubmit={handleEmailSubmit}
        className='space-y-5 border-t border-yellow-900/40 pt-8'
      >
        <div>
          <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
            Account Email
          </p>

          <h2 className='mt-2 text-2xl font-bold'>Change Email Address</h2>

          <p className='mt-2 text-sm leading-6 text-gray-400'>
            Enter a new email address. A confirmation link will be sent to the new email.
            Your email will change only after confirmation.
          </p>
        </div>

        <div>
          <label className='mb-2 block text-sm text-gray-300'>
            New Email Address
          </label>
          <input
            type='email'
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className='w-full rounded border border-gray-300 bg-white p-3 text-black'
            placeholder='Enter new email address'
          />
        </div>

        <button
          type='submit'
          disabled={loadingEmail}
          className='rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50'
        >
          {loadingEmail ? 'Sending verification...' : 'Send Verification Email'}
        </button>
      </form>

      {message && (
        <p className='rounded-xl border border-yellow-900/40 bg-black/30 p-4 text-sm text-yellow-300'>
          {message}
        </p>
      )}
    </div>
  )
}