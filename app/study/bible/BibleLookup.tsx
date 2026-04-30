'use client'

import { FormEvent, useState } from 'react'

type BibleVerse = {
  book_name?: string
  chapter?: number
  verse?: number
  text?: string
}

type BibleResult = {
  reference?: string
  text?: string
  translation_id?: string
  translation_name?: string
  translation_note?: string
  verses?: BibleVerse[]
}

export default function BibleLookup() {
  const [reference, setReference] = useState('John 3:16')
  const [translation, setTranslation] = useState('kjv')
  const [result, setResult] = useState<BibleResult | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function lookupPassage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setResult(null)

    if (!reference.trim()) {
      setMessage('Enter a Bible reference.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `https://bible-api.com/${encodeURIComponent(reference.trim())}?translation=${encodeURIComponent(translation)}`
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage(data?.error || 'Could not load Bible passage.')
        setLoading(false)
        return
      }

      setResult(data)
      setLoading(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bible lookup failed.')
      setLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      <form
        onSubmit={lookupPassage}
        className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5 md:p-6'
      >
        <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
          Bible Reader
        </p>

        <h2 className='mt-2 text-2xl font-bold'>
          Search Scripture
        </h2>

        <p className='mt-2 text-sm leading-6 text-gray-400'>
          Enter a Bible reference to read the passage. This first version uses KJV lookup.
        </p>

        <div className='mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]'>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
            placeholder='John 3:16'
          />

          <select
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            className='w-full rounded bg-white p-3 text-black'
          >
            <option value='kjv'>KJV</option>
            <option value='web'>WEB</option>
          </select>
        </div>

        <button
          disabled={loading}
          className='mt-5 rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400 disabled:opacity-50'
        >
          {loading ? 'Loading...' : 'Read Passage'}
        </button>

        {message && (
          <p className='mt-4 rounded-xl border border-yellow-900/40 bg-black/30 p-3 text-sm text-yellow-300'>
            {message}
          </p>
        )}
      </form>

      {result && (
        <article className='rounded-3xl border border-yellow-900/40 bg-[#120707] p-5 md:p-8'>
          <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
            {result.translation_name || result.translation_id || translation.toUpperCase()}
          </p>

          <h2 className='mt-2 text-3xl font-bold md:text-4xl'>
            {result.reference}
          </h2>

          {result.verses && result.verses.length > 0 ? (
            <div className='mt-6 space-y-4'>
              {result.verses.map((verse, index) => (
                <p key={`${verse.book_name}-${verse.chapter}-${verse.verse}-${index}`} className='text-base leading-8 text-gray-200 md:text-lg'>
                  <sup className='mr-2 text-yellow-400'>
                    {verse.verse}
                  </sup>
                  {verse.text}
                </p>
              ))}
            </div>
          ) : (
            <p className='mt-6 whitespace-pre-wrap text-base leading-8 text-gray-200 md:text-lg'>
              {result.text}
            </p>
          )}

          <p className='mt-6 text-xs leading-5 text-gray-500'>
            Scripture text is retrieved from an external Bible API for reading and study.
          </p>
        </article>
      )}
    </div>
  )
}