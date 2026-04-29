import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export default async function BooksPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, title, subtitle, description, cover_url, purchase_url, status, price, display_order, is_public, pdf_path')
    .eq('is_public', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  const { data: accessRecords } = await supabase
    .from('book_access')
    .select('book_id')
    .eq('user_id', user.id)

  const approvedBookIds = new Set((accessRecords || []).map((item) => item.book_id))

  return (
    <main className='min-h-screen bg-[#050303] pb-28 text-white md:pb-10'>
      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-8 md:px-8'>
        <div className='mx-auto max-w-6xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold md:text-5xl'>
                Books
              </h1>

              <p className='mt-3 max-w-2xl text-sm leading-6 text-gray-300'>
                Kingdom Citizens books, resources, shop links, and approved downloads.
              </p>
            </div>

            <Link
              href='/dashboard'
              className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20'
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
        {booksError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading books: {booksError.message}
          </div>
        )}

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {books?.map((book) => {
            const canDownload = Boolean(book.pdf_path && approvedBookIds.has(book.id))

            return (
              <article
                key={book.id}
                className='overflow-hidden rounded-2xl border border-yellow-900/40 bg-[#120707] shadow-lg shadow-black/30'
              >
                {book.cover_url && (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className='h-72 w-full object-cover'
                  />
                )}

                <div className='p-5'>
                  <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                    {book.status || 'Book'}
                  </p>

                  <h2 className='mt-3 text-2xl font-bold'>{book.title}</h2>

                  {book.subtitle && (
                    <p className='mt-1 text-yellow-300'>{book.subtitle}</p>
                  )}

                  {book.description && (
                    <p className='mt-3 text-sm leading-7 text-gray-300'>
                      {book.description}
                    </p>
                  )}

                  {book.price && (
                    <p className='mt-4 text-lg font-bold text-yellow-300'>
                      {book.price}
                    </p>
                  )}

                  <div className='mt-5 flex flex-wrap gap-3'>
                    {book.purchase_url && (
                      <a
                        href={book.purchase_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
                      >
                        Buy / Shop
                      </a>
                    )}

                    {canDownload ? (
                      <a
                        href={`/api/books/download?bookId=${book.id}`}
                        className='rounded-full border border-green-600 px-4 py-2 text-sm font-bold text-green-300 hover:bg-green-900/20'
                      >
                        Download PDF
                      </a>
                    ) : book.pdf_path ? (
                      <span className='rounded-full border border-gray-700 px-4 py-2 text-sm text-gray-400'>
                        Download requires approval
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}

          {books?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No books are available yet.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}