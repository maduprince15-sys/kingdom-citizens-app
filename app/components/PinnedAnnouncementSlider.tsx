'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Announcement = {
  id: string
  title: string
  content: string
  image_url: string | null
  video_url: string | null
  created_at: string
}

type Props = {
  announcements: Announcement[]
  intervalMs?: number
}

export default function PinnedAnnouncementSlider({
  announcements,
  intervalMs = 15000,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (announcements.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % announcements.length)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [announcements.length, intervalMs])

  if (announcements.length === 0) {
    return null
  }

  const announcement = announcements[currentIndex]

  return (
    <div className='transition-all duration-700'>
      {announcement.image_url && (
        <img
          src={announcement.image_url}
          alt={announcement.title}
          className='mt-6 max-h-72 w-full rounded-2xl object-cover'
        />
      )}

      <div className='mt-6 rounded-2xl bg-[#7c2630] p-5'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-xs uppercase tracking-[0.25em] text-yellow-200'>
            Announcement
          </p>

          {announcements.length > 1 && (
            <p className='rounded-full bg-black/30 px-3 py-1 text-xs text-yellow-100'>
              {currentIndex + 1} / {announcements.length}
            </p>
          )}
        </div>

        <h3 className='mt-3 text-2xl font-black'>
          {announcement.title}
        </h3>
      </div>

      <div className='mt-5 rounded-2xl border border-yellow-900/40 bg-black/40 p-4'>
        <p className='text-xs uppercase tracking-[0.25em] text-yellow-400'>
          Pinned Message
        </p>

        <p className='mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-300'>
          {announcement.content}
        </p>

        <div className='mt-4 flex flex-wrap gap-3'>
          {announcement.video_url && (
            <a
              href={announcement.video_url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-block rounded-full border border-yellow-700 px-4 py-2 text-sm font-bold text-yellow-300 hover:bg-yellow-900/20'
            >
              Open Video
            </a>
          )}

          <Link
            href='/public/announcements'
            className='inline-block rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
          >
            View All
          </Link>
        </div>

        {announcements.length > 1 && (
          <div className='mt-5 flex gap-2'>
            {announcements.map((item, index) => (
              <button
                key={item.id}
                type='button'
                onClick={() => setCurrentIndex(index)}
                className={
                  index === currentIndex
                    ? 'h-2 w-8 rounded-full bg-yellow-400'
                    : 'h-2 w-2 rounded-full bg-gray-600'
                }
                aria-label={`Show announcement ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}