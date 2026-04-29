'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

type Book = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  cover_url: string | null
  purchase_url: string | null
  status: string | null
  price: string | null
  display_order: number | null
  is_public: boolean | null
}

type Props = {
  books: Book[]
}

export default function BookForm({ books }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [editingId, setEditingId] = useState<string | null>(null)
  const editingBook = books.find((book) => book.id === editingId)

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [purchaseUrl, setPurchaseUrl] = useState('')
  const [status, setStatus] = useState('Coming Soon')
  const [price, setPrice] = useState('')
  const [displayOrder, setDisplayOrder] = useState('0')
  const [isPublic, setIsPublic] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setSubtitle('')
    setDescription('')
    setCoverUrl('')
    setCoverFile(null)
    setPurchaseUrl('')
    setStatus('Coming Soon')
    setPrice('')
    setDisplayOrder('0')
    setIsPublic(true)
    setMessage('')
  }

  function startEdit(book: Book) {
    setEditingId(book.id)
    setTitle(book.title || '')
    setSubtitle(book.subtitle || '')
    setDescription(book.description || '')
    setCoverUrl(book.cover_url || '')
    setCoverFile(null)
    setPurchaseUrl(book.purchase_url || '')
    setStatus(book.status || 'Coming Soon')
    setPrice(book.price || '')
    setDisplayOrder(String(book.display_order ?? 0))
    setIsPublic(Boolean(book.is_public))
    setMessage('')
  }

  async function uploadCoverIfNeeded() {
    if (!coverFile) return coverUrl || null

    if (!coverFile.type.startsWith('image/')) {
      throw new Error('Please upload an image file for the book cover.')
    }

    const maxSize = 5 * 1024 * 1024

    if (coverFile.size > maxSize) {
      throw new Error('Book cover image is too large. Maximum size is 5MB.')
    }

    const fileExt = coverFile.name.split('.').pop() || 'png'
    const safeTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60)

    const fileName = `${safeTitle || 'book'}-${Date.now()}.${fileExt}`
    const filePath = `covers/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, coverFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const finalCoverUrl = await uploadCoverIfNeeded()

      const payload = {
        title,
        subtitle: subtitle || null,
        description: description || null,
        cover_url: finalCoverUrl,
        purchase_url: purchaseUrl || null,
        status: status || 'Coming Soon',
        price: price || null,
        display_order: Number(displayOrder) || 0,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      }

      const { error } = editingId
        ? await supabase.from('books').update(payload).eq('id', editingId)
        : await supabase.from('books').insert(payload)

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setMessage(editingId ? 'Book updated.' : 'Book added.')
      setLoading(false)
      resetForm()
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Cover upload failed.')
      setLoading(false)
    }
  }

  async function deleteBook(id: string) {
    const confirmed = window.confirm('Delete this book?')
    if (!confirmed) return

    const { error } = await supabase.from('books').delete().eq('id', id)

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
          {editingBook ? 'Edit Book' : 'Add Book'}
        </h2>

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Subtitle'
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
        />

        <textarea
          className='min-h-32 w-full rounded bg-white p-3 text-black'
          placeholder='Description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className='rounded-xl border border-yellow-900/40 bg-black/30 p-4'>
          <label className='mb-2 block text-sm font-semibold text-yellow-300'>
            Book Cover
          </label>

          <input
            type='file'
            accept='image/*'
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            className='w-full rounded bg-white p-3 text-black'
          />

          <p className='mt-3 text-xs text-gray-400'>
            Upload a cover image, or paste a cover image URL below. Maximum upload size: 5MB.
          </p>

          <input
            className='mt-3 w-full rounded bg-white p-3 text-black'
            placeholder='Cover image URL'
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />

          {(coverFile || coverUrl) && (
            <div className='mt-4'>
              <p className='mb-2 text-xs uppercase tracking-[0.2em] text-yellow-500'>
                Preview
              </p>

              {coverFile ? (
                <p className='text-sm text-gray-300'>
                  Selected file: {coverFile.name}
                </p>
              ) : (
                <img
                  src={coverUrl}
                  alt='Book cover preview'
                  className='max-h-72 rounded-xl object-cover'
                />
              )}
            </div>
          )}
        </div>

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Purchase URL'
          value={purchaseUrl}
          onChange={(e) => setPurchaseUrl(e.target.value)}
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Status'
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Price'
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          className='w-full rounded bg-white p-3 text-black'
          placeholder='Display order'
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
        />

        <label className='flex items-center gap-2 text-sm text-gray-300'>
          <input
            type='checkbox'
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Publicly visible
        </label>

        <div className='flex flex-wrap gap-3'>
          <button
            disabled={loading}
            className='rounded-full bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50'
          >
            {loading ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
          </button>

          {editingBook && (
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
        {books.map((book) => (
          <article key={book.id} className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            {book.cover_url && (
              <img
                src={book.cover_url}
                alt={book.title}
                className='mb-4 max-h-80 w-full rounded-xl object-cover'
              />
            )}

            <h3 className='text-xl font-bold'>{book.title}</h3>

            {book.subtitle && (
              <p className='mt-1 text-yellow-300'>{book.subtitle}</p>
            )}

            {book.description && (
              <p className='mt-2 text-sm leading-6 text-gray-300'>
                {book.description}
              </p>
            )}

            <p className='mt-3 text-xs text-gray-400'>
              Status: {book.status} · Price: {book.price || '-'} · Order: {book.display_order}
            </p>

            <p className='mt-2 text-xs text-gray-500'>
              Public: {book.is_public ? 'Yes' : 'No'}
            </p>

            <div className='mt-4 flex flex-wrap gap-3'>
              <button
                onClick={() => startEdit(book)}
                className='rounded bg-yellow-600 px-3 py-1 text-sm text-white'
              >
                Edit
              </button>

              <button
                onClick={() => deleteBook(book.id)}
                className='rounded bg-red-700 px-3 py-1 text-sm text-white'
              >
                Delete
              </button>
            </div>
          </article>
        ))}

        {books.length === 0 && <p className='text-gray-400'>No books yet.</p>}
      </div>
    </div>
  )
}