import { createClient } from '../../lib/supabase/server'

export default async function ConnectPage() {
  const supabase = await createClient()

  const { data: links, error } = await supabase
    .from('social_links')
    .select('id, name, url, category, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return (
      <main className='p-6 text-white'>
        <h1 className='text-3xl font-bold'>Connect With Kingdom Citizens</h1>
        <p className='mt-4 text-red-400'>Error loading links: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='p-6 text-white'>
      <h1 className='text-3xl font-bold'>Connect With Kingdom Citizens</h1>
      <p className='mt-2 text-gray-300'>
        Follow our channels, pages, and ministry links.
      </p>

      <div className='mt-6 space-y-4'>
        {links?.length ? (
          links.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target='_blank'
              rel='noopener noreferrer'
              className='block rounded-lg border border-gray-700 bg-gray-900 p-4 text-lg hover:bg-gray-800'
            >
              {item.name}
            </a>
          ))
        ) : (
          <p className='text-gray-400'>No links available yet.</p>
        )}
      </div>
    </main>
  )
}
