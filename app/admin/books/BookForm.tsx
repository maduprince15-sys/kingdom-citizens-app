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
    setPurchaseUrl(book.purchase_url || '')
    setStatus(book.status || 'Coming Soon')
    setPrice(book.price || '')
    setDisplayOrder(String(book.display_order ?? 0))
    setIsPublic(Boolean(book.is_public))
    setMessage('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const payload = {
      title,
      subtitle: subtitle || null,
      description: description || null,
      cover_url: coverUrl || null,
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

        <input className='w-full rounded bg-white p-3 text-black' placeholder='Title' value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input className='w-full rounded bg-white p-3 text-black' placeholder='Subtitle' value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <textarea className='min-h-32 w-full rounded bg-white p-3 text-black' placeholder='Description' value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className='w-full rounded bg-white p-3 text-black' placeholder='Cover image URL' value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        <input className='w-full rounded bg-white p-3 text-black' placeholder='Purchase URL' value={purchaseUrl} onChange={(e) => setPurchaseUrl(e.target.value)} />
        <input className='w-full rounded bg-white p-3 text-black' placeholder='Status' value={status} onChange={(e) => setStatus(e.target.value)} />
        <input className='w-full rounded bg-white p-3 text-black' placeholder='Price' value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className='w-full rounded bg-white p-3 text-black' placeholder='Display order' value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />

        <label className='flex items-center gap-2 text-sm text-gray-300'>
          <input type='checkbox' checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Publicly visible
        </label>

        <div className='flex flex-wrap gap-3'>
          <button disabled={loading} className='rounded-full bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-50'>
            {loading ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
          </button>

          {editingBook && (
            <button type='button' onClick={resetForm} className='rounded-full border border-yellow-700 px-5 py-3 text-yellow-300'>
              Cancel
            </button>
          )}
        </div>

        {message && <p className='text-sm text-yellow-300'>{message}</p>}
      </form>

      <div className='space-y-4'>
        {books.map((book) => (
          <article key={book.id} className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <h3 className='text-xl font-bold'>{book.title}</h3>
            {book.subtitle && <p className='mt-1 text-yellow-300'>{book.subtitle}</p>}
            <p className='mt-2 text-sm text-gray-300'>{book.description}</p>
            <p className='mt-3 text-xs text-gray-400'>Status: {book.status} · Order: {book.display_order}</p>

            <div className='mt-4 flex flex-wrap gap-3'>
              <button onClick={() => startEdit(book)} className='rounded bg-yellow-600 px-3 py-1 text-sm text-white'>
                Edit
              </button>
              <button onClick={() => deleteBook(book.id)} className='rounded bg-red-700 px-3 py-1 text-sm text-white'>
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