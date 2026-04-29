'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type CalendarEvent = {
  id: string
  title: string
  description: string | null
  event_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  meeting_url: string | null
  is_public: boolean | null
}

type Props = {
  events: CalendarEvent[]
}

export default function CalendarForm({ events }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setEventDate('')
    setStartTime('')
    setEndTime('')
    setLocation('')
    setMeetingUrl('')
    setIsPublic(true)
    setMessage('')
  }

  function startEdit(event: CalendarEvent) {
    setEditingId(event.id)
    setTitle(event.title || '')
    setDescription(event.description || '')
    setEventDate(event.event_date || '')
    setStartTime(event.start_time || '')
    setEndTime(event.end_time || '')
    setLocation(event.location || '')
    setMeetingUrl(event.meeting_url || '')
    setIsPublic(Boolean(event.is_public))
    setMessage('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const payload = {
      title,
      description: description || null,
      event_date: eventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location || null,
      meeting_url: meetingUrl || null,
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    }

    const { error } = editingId
      ? await supabase.from('calendar_events').update(payload).eq('id', editingId)
      : await supabase.from('calendar_events').insert(payload)

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setMessage(editingId ? 'Calendar event updated.' : 'Calendar event added.')
    setLoading(false)
    resetForm()
    router.refresh()
  }

  async function deleteEvent(id: string) {
    const confirmed = window.confirm('Delete this calendar event?')
    if (!confirmed) return

    const { error } = await supabase.from('calendar_events').delete().eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    router.refresh()
  }

  return (
    <div className='grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]'>
      <form onSubmit={handleSubmit} className='space-y-4 rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
        <h2 className='text-2xl font-bold'>
          {editingId ? 'Edit Calendar Event' : 'Add Calendar Event'}
        </h2>

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Event title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          className='min-h-32 w-full rounded bg-white p-3 text-black'
          placeholder='Description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type='date'
          className='w-full rounded bg-white p-3 text-black'
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Start time e.g. 8:00 PM'
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='End time e.g. 9:30 PM'
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Location'
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Meeting or event link'
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
        />

        <label className='flex items-center gap-2 text-sm text-gray-300'>
          <input
            type='checkbox'
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Visible to members
        </label>

        <div className='flex flex-wrap gap-3'>
          <button
            disabled={loading}
            className='rounded-full bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50'
          >
            {loading ? 'Saving...' : editingId ? 'Update Event' : 'Add Event'}
          </button>

          {editingId && (
            <button
              type='button'
              onClick={resetForm}
              className='rounded-full border border-yellow-700 px-5 py-3 text-yellow-300'
            >
              Cancel
            </button>
          )}
        </div>

        {message && <p className='text-sm text-yellow-300'>{message}</p>}
      </form>

      <div className='space-y-4'>
        {events.map((event) => (
          <article key={event.id} className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-xl font-bold'>{event.title}</h3>
              {!event.is_public && (
                <span className='rounded-full bg-red-800 px-2 py-1 text-xs text-white'>
                  Hidden
                </span>
              )}
            </div>

            <p className='mt-2 text-sm text-yellow-300'>
              {event.event_date} {event.start_time ? `· ${event.start_time}` : ''}
              {event.end_time ? ` - ${event.end_time}` : ''}
            </p>

            {event.description && (
              <p className='mt-2 text-sm leading-6 text-gray-300'>
                {event.description}
              </p>
            )}

            <div className='mt-4 flex flex-wrap gap-3'>
              <button
                onClick={() => startEdit(event)}
                className='rounded bg-yellow-600 px-3 py-1 text-sm text-white'
              >
                Edit
              </button>

              <button
                onClick={() => deleteEvent(event.id)}
                className='rounded bg-red-700 px-3 py-1 text-sm text-white'
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {events.length === 0 && <p className='text-gray-400'>No calendar events yet.</p>}
      </div>
    </div>
  )
}