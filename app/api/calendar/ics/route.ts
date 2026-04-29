import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

function cleanText(value: string | null | undefined) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
}

function dateToICS(date: string) {
  return date.replace(/-/g, '')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing event id.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  const eventDate = dateToICS(event.event_date)
  const uid = `${event.id}@kingdom-citizens-app`
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const descriptionParts = [
    event.description,
    event.meeting_url ? `Link: ${event.meeting_url}` : '',
  ].filter(Boolean)

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Kingdom Citizens//Calendar//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${eventDate}`,
    `SUMMARY:${cleanText(event.title)}`,
    `DESCRIPTION:${cleanText(descriptionParts.join('\n'))}`,
    event.location ? `LOCATION:${cleanText(event.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.title || 'calendar-event'}.ics"`,
    },
  })
}