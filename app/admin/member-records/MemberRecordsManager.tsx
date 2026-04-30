'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Member = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
}

type RecordItem = {
  id: string
  user_id: string
  record_type: string
  title: string
  description: string | null
  amount: number | null
  currency: string | null
  purpose: string | null
  event_date: string | null
  status: string | null
  created_at: string
}

type Props = {
  members: Member[]
  records: RecordItem[]
  actorRole: string
  currentUserId: string
}

const recordTypes = [
  { value: 'contribution', label: 'Contribution' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'task', label: 'Task' },
  { value: 'service_role', label: 'Service Role' },
  { value: 'training', label: 'Training' },
  { value: 'note', label: 'Note' },
]

const statuses = [
  'recorded',
  'present',
  'absent',
  'late',
  'excused',
  'assigned',
  'accepted',
  'completed',
  'missed',
  'cancelled',
  'paid',
  'pending',
]

export default function MemberRecordsManager({
  members,
  records,
  actorRole,
  currentUserId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState('')
  const [recordType, setRecordType] = useState('attendance')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [purpose, setPurpose] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [status, setStatus] = useState('recorded')
  const [filterType, setFilterType] = useState('all')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const allowedRecordTypes = useMemo(() => {
    if (actorRole === 'finance') {
      return recordTypes.filter((type) => type.value === 'contribution')
    }

    if (actorRole === 'teacher') {
      return recordTypes.filter((type) =>
        ['task', 'service_role', 'training', 'note'].includes(type.value)
      )
    }

    if (actorRole === 'moderator') {
      return recordTypes.filter((type) =>
        ['attendance', 'task', 'service_role', 'training', 'note'].includes(type.value)
      )
    }

    return recordTypes
  }, [actorRole])

  const filteredRecords =
    filterType === 'all'
      ? records
      : records.filter((record) => record.record_type === filterType)

  function getMemberName(id: string) {
    const member = members.find((item) => item.id === id)
    return member?.full_name || member?.email || 'Unknown member'
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!userId || !recordType || !title.trim()) {
      setMessage('Select a member, record type, and title.')
      setLoading(false)
      return
    }

    const isAllowed = allowedRecordTypes.some((type) => type.value === recordType)

    if (!isAllowed) {
      setMessage('Your role cannot create this type of record.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('member_activity_records').insert({
      user_id: userId,
      record_type: recordType,
      title: title.trim(),
      description: description.trim() || null,
      amount: recordType === 'contribution' && amount ? Number(amount) : null,
      currency: recordType === 'contribution' ? currency || 'EUR' : null,
      purpose: purpose.trim() || null,
      event_date: eventDate || null,
      status: status || 'recorded',
      created_by: currentUserId,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage('Record added.')
    setLoading(false)
    setTitle('')
    setDescription('')
    setAmount('')
    setPurpose('')
    setEventDate('')
    setStatus('recorded')
    router.refresh()
  }

  async function deleteRecord(id: string) {
    const confirmed = window.confirm('Delete this record?')
    if (!confirmed) return

    const { error } = await supabase
      .from('member_activity_records')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    router.refresh()
  }

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]'>
      <form
        onSubmit={handleSubmit}
        className='h-fit space-y-4 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'
      >
        <div>
          <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
            Add Record
          </p>
          <h2 className='mt-2 text-2xl font-bold'>Citizen Record Entry</h2>
          <p className='mt-2 text-sm leading-6 text-gray-400'>
            Add contribution, attendance, task, service, training, or note records according to your role permission.
          </p>
        </div>

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

        <select
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
          className='w-full rounded bg-white p-3 text-black'
        >
          {allowedRecordTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Title e.g. September opening prayer'
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className='min-h-28 w-full rounded bg-white p-3 text-black'
          placeholder='Description / notes'
        />

        {recordType === 'contribution' && (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='w-full rounded bg-white p-3 text-black'
              placeholder='Amount'
              type='number'
              step='0.01'
            />

            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className='w-full rounded bg-white p-3 text-black'
              placeholder='Currency'
            />
          </div>
        )}

        <input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Purpose e.g. Giving, Book support, Attendance, Prayer'
        />

        <input
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className='w-full rounded bg-white p-3 text-black'
          type='date'
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className='w-full rounded bg-white p-3 text-black'
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button
          disabled={loading}
          className='w-full rounded-full bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50'
        >
          {loading ? 'Saving...' : 'Add Record'}
        </button>

        {message && <p className='text-sm text-yellow-300'>{message}</p>}
      </form>

      <div>
        <div className='mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-2xl font-bold'>Recent Records</h2>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className='rounded bg-white p-3 text-black'
          >
            <option value='all'>All record types</option>
            {recordTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className='space-y-4'>
          {filteredRecords.map((record) => (
            <article
              key={record.id}
              className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'
            >
              <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    {record.record_type}
                  </p>

                  <h3 className='mt-2 text-xl font-bold'>
                    {record.title}
                  </h3>

                  <p className='mt-1 text-sm text-gray-400'>
                    Member: {getMemberName(record.user_id)}
                  </p>

                  {record.description && (
                    <p className='mt-3 text-sm leading-6 text-gray-300'>
                      {record.description}
                    </p>
                  )}
                </div>

                <div className='rounded-xl border border-yellow-900/30 bg-black/30 p-4 text-sm text-gray-300 md:min-w-48'>
                  {record.event_date && <p>Date: {record.event_date}</p>}
                  {record.status && <p>Status: {record.status}</p>}
                  {record.record_type === 'contribution' && (
                    <p>
                      Amount: {record.currency || 'EUR'} {Number(record.amount || 0).toFixed(2)}
                    </p>
                  )}
                  {record.purpose && <p>Purpose: {record.purpose}</p>}

                  <button
                    onClick={() => deleteRecord(record.id)}
                    className='mt-4 rounded bg-red-700 px-3 py-1 text-xs text-white'
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filteredRecords.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No records found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}