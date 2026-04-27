import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'

export default async function PublicConnectPage() {
  const supabase = await createClient()

  const { data: links, error } = await supabase
    .from('social_links')
    .select('*')

  return (
    <main className='min-h-screen bg-black p-4 text-white md:p-6'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
          <h1 className='text-3xl font-bold'>Connect</h1>
          <Link href='/' className='text-cyan-400 underline'>Back to Home</Link>
        </div>

        {error && <p className='text-red-400'>Error loading links: {error.message}</p>}

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {links?.map((item: any, index: number) => (
            <article key={item.id ?? item.url ?? index} className='rounded border border-gray-700 p-4'>
              <h2 className='text-xl font-semibold'>
                {item.platform_name ?? item.title ?? 'Link'}
              </h2>

              {(item.description ?? item.notes) && (
                <p className='mt-2 text-gray-300'>{item.description ?? item.notes}</p>
              )}

              {(item.url ?? item.link ?? item.href) && (
                <p className='mt-4'>
                  <a
                    href={item.url ?? item.link ?? item.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-cyan-400 underline'
                  >
                    Open link
                  </a>
                </p>
              )}
            </article>
          ))}

          {links?.length === 0 && <p className='text-gray-400'>No public links yet.</p>}
        </div>
      </div>
    </main>
  )
}