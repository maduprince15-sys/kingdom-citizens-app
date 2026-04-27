export default function BooksPage() {
  const books = [
    {
      id: 1,
      title: 'Grace Economy Volume 1',
      description: 'Formation, alignment, and stewardship in Christ.',
      price: '15 EUR',
      link: '#',
    },
    {
      id: 2,
      title: 'Heavenly Citizens Volume 1',
      description: 'Life from heaven, identity in Christ, and kingdom culture.',
      price: '15 EUR',
      link: '#',
    },
    {
      id: 3,
      title: 'Eternal Life and the Mark of the Beast',
      description: 'A kingdom-centered teaching on eternal life and end-time allegiance.',
      price: '20 EUR',
      link: '#',
    },
  ]

  return (
    <main className='p-6 text-white'>
      <h1 className='text-3xl font-bold'>Kingdom Citizens Bookstore</h1>
      <p className='mt-2 text-gray-300'>Browse and access Kingdom Citizens books.</p>

      <div className='mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {books.map((book) => (
          <div key={book.id} className='rounded-xl border border-gray-700 bg-gray-900 p-5 shadow'>
            <h2 className='text-xl font-semibold'>{book.title}</h2>
            <p className='mt-2 text-sm text-gray-300'>{book.description}</p>
            <p className='mt-4 text-lg font-bold text-green-400'>{book.price}</p>
            <a
              href={book.link}
              className='mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white'
            >
              View Book
            </a>
          </div>
        ))}
      </div>
    </main>
  )
}
