import Link from 'next/link'
import PublicFooter from '../../components/PublicFooter'
import PublicHeader from '../../components/PublicHeader'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicBooksPage() {
  const supabase = await createClient()

  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_public', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <main className='min-h-screen bg-[#050303] text-white'>
      <PublicHeader />

      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#250a0a] px-4 py-10 md:px-8'>
        <div className='mx-auto max-w-6xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <h1 className='mt-3 text-4xl font-bold md:text-6xl'>
            Bookstore
          </h1>

          <p className='mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base'>
            Explore books and teachings from The Kingdom Citizens. These works are written
            to strengthen identity in Christ, form spiritual understanding, and establish
            believers in Kingdom order.
          </p>

          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href='/public/posts'
              className='rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400'
            >
              Read Teachings
            </Link>

            <Link
              href='/public/connect'
              className='rounded-full border border-yellow-700/70 px-5 py-3 text-sm text-yellow-300 hover:bg-yellow-700/20'
            >
              Connect With Us
            </Link>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-10 md:px-8'>
        {error && <p className='mb-6 text-red-400'>Error loading books: {error.message}</p>}

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          {books?.map((book) => (
            <article
              key={book.id}
              className='overflow-hidden rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-[#050303] shadow-lg shadow-black/30'
            >
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className='max-h-[420px] w-full object-cover' />
              ) : (
                <div className='flex h-56 items-center justify-center bg-[#1a0808]'>
                  <div className='flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500 text-2xl font-black text-black'>
                    KC
                  </div>
                </div>
              )}

              <div className='p-6'>
                <h2 className='text-2xl font-bold text-white'>{book.title}</h2>

                {book.subtitle && (
                  <p className='mt-2 text-yellow-300'>{book.subtitle}</p>
                )}

                {book.description && (
                  <p className='mt-3 text-sm leading-7 text-gray-300'>
                    {book.description}
                  </p>
                )}

                <div className='mt-4 flex flex-wrap gap-2'>
                  {book.status && (
                    <span className='rounded-full border border-yellow-800 px-3 py-1 text-xs text-yellow-300'>
                      {book.status}
                    </span>
                  )}

                  {book.price && (
                    <span className='rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-black'>
                      {book.price}
                    </span>
                  )}
                </div>

                <div className='mt-5'>
                  {book.purchase_url ? (
                    <a
                      href={book.purchase_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-block rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400'
                    >
                      Buy / View Book
                    </a>
                  ) : (
                    <span className='text-sm text-gray-500'>Purchase link coming soon.</span>
                  )}
                </div>
              </div>
            </article>
          ))}

          {books?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No public books yet.
            </div>
          )}
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 pb-12 md:px-8'>
        <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-6'>
          <h2 className='text-2xl font-bold text-yellow-300'>
            Books as Teaching Vessels
          </h2>
          <p className='mt-3 max-w-3xl text-sm leading-7 text-gray-300'>
            The Kingdom Citizens books are not merely publications. They are teaching
            vessels for formation, alignment, doctrine, spiritual understanding, and
            Kingdom expression in Christ.
          </p>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}