'use client'

import { useEffect, useMemo, useState } from 'react'

type NoticeSlide = {
  id: string
  type: string
  label: string
  title: string
  subtitle?: string | null
  description?: string | null
  image_url?: string | null
  avatar_url?: string | null
  date_text?: string | null
  link_url?: string | null
}

type Props = {
  slides: NoticeSlide[]
  intervalMs?: number
}

export default function NoticeBoardSlider({
  slides,
  intervalMs = 15000,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const safeSlides = useMemo(() => slides || [], [slides])
  const currentSlide = safeSlides[currentIndex]

  useEffect(() => {
    if (safeSlides.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % safeSlides.length)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [safeSlides.length, intervalMs])

  if (!currentSlide) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-black p-8 text-white'>
        <div className='max-w-3xl rounded-[2rem] border border-yellow-900/40 bg-[#120707] p-10 text-center'>
          <img
            src='/kingdom-citizens-logo.png'
            alt='The Kingdom Citizens'
            className='mx-auto h-32 w-32 rounded-full object-cover'
          />

          <p className='mt-8 text-xs uppercase tracking-[0.45em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <h1 className='mt-4 text-5xl font-black md:text-7xl'>
            Notice Board
          </h1>

          <p className='mt-6 text-xl leading-8 text-gray-300'>
            No active notices are available yet.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className='relative flex min-h-screen overflow-hidden bg-black text-white'>
      <div className='absolute inset-0 bg-gradient-to-br from-[#260909] via-black to-[#120707]' />

      <div className='absolute inset-0 opacity-20'>
        <div className='absolute right-10 top-10 h-96 w-96 rounded-full bg-yellow-500 blur-[150px]' />
        <div className='absolute bottom-0 left-10 h-96 w-96 rounded-full bg-red-900 blur-[160px]' />
      </div>

      <section className='relative z-10 flex min-h-screen w-full items-center justify-center px-5 py-8 md:px-10'>
        <div className='w-full max-w-7xl'>
          <div className='mb-8 flex items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <img
                src='/kingdom-citizens-logo.png'
                alt='The Kingdom Citizens'
                className='h-20 w-20 rounded-full object-cover md:h-28 md:w-28'
              />

              <div>
                <p className='text-xs uppercase tracking-[0.4em] text-yellow-500'>
                  The Kingdom Citizens
                </p>

                <h1 className='mt-2 text-3xl font-black md:text-5xl'>
                  Notice Board
                </h1>
              </div>
            </div>

            {safeSlides.length > 1 && (
              <div className='rounded-full border border-yellow-900/50 bg-black/40 px-5 py-2 text-sm text-yellow-300'>
                {currentIndex + 1} / {safeSlides.length}
              </div>
            )}
          </div>

          <div className='grid min-h-[560px] grid-cols-1 gap-8 rounded-[2rem] border border-yellow-900/40 bg-[#080303]/90 p-6 shadow-2xl shadow-black/60 md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center'>
            <div className='flex items-center justify-center'>
              {currentSlide.image_url ? (
                <img
                  src={currentSlide.image_url}
                  alt={currentSlide.title}
                  className='max-h-[520px] w-full rounded-[2rem] object-cover shadow-2xl shadow-black/50'
                />
              ) : currentSlide.avatar_url ? (
                <img
                  src={currentSlide.avatar_url}
                  alt={currentSlide.title}
                  className='h-72 w-72 rounded-full border-4 border-yellow-500 object-cover shadow-2xl shadow-yellow-900/30 md:h-96 md:w-96'
                />
              ) : (
                <div className='flex h-72 w-72 items-center justify-center rounded-full border-4 border-yellow-700 bg-[#120707] shadow-2xl shadow-yellow-900/30 md:h-96 md:w-96'>
                  <span className='text-8xl font-black text-yellow-500 md:text-9xl'>
                    {currentSlide.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className='inline-flex rounded-full bg-yellow-500 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-black'>
                {currentSlide.label}
              </div>

              {currentSlide.date_text && (
                <p className='mt-6 text-xl font-bold text-yellow-300 md:text-2xl'>
                  {currentSlide.date_text}
                </p>
              )}

              <h2 className='mt-6 text-5xl font-black leading-tight md:text-7xl'>
                {currentSlide.title}
              </h2>

              {currentSlide.subtitle && (
                <p className='mt-5 text-2xl font-bold text-yellow-200 md:text-3xl'>
                  {currentSlide.subtitle}
                </p>
              )}

              {currentSlide.description && (
                <p className='mt-6 whitespace-pre-wrap text-xl leading-9 text-gray-200 md:text-2xl md:leading-10'>
                  {currentSlide.description}
                </p>
              )}

              {currentSlide.link_url && (
                <a
                  href={currentSlide.link_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-8 inline-block rounded-full bg-yellow-500 px-6 py-3 text-base font-black text-black hover:bg-yellow-400'
                >
                  Open Link
                </a>
              )}
            </div>
          </div>

          {safeSlides.length > 1 && (
            <div className='mt-8 flex justify-center gap-3'>
              {safeSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type='button'
                  onClick={() => setCurrentIndex(index)}
                  className={
                    index === currentIndex
                      ? 'h-3 w-12 rounded-full bg-yellow-400'
                      : 'h-3 w-3 rounded-full bg-gray-600'
                  }
                  aria-label={`Show notice ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}