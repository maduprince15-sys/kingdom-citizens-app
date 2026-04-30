import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

export default async function StudyCenterPage() {
  const supabase = await createClient()

  const { data: resources, error: resourcesError } = await supabase
    .from('study_resources')
    .select('id, title, category, summary, resource_type, image_url, scripture_references, display_order, created_at')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <main className='min-h-screen bg-[#050303] pb-20 text-white md:pb-0'>
      <PublicHeader />

      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-10 md:px-8 md:py-16'>
        <div className='mx-auto max-w-6xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            The Kingdom Citizens
          </p>

          <div className='mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <h1 className='text-4xl font-black md:text-6xl'>
                Study Center
              </h1>

              <p className='mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base'>
                Study Kingdom Citizens doctrine, Bible lessons, teaching resources,
                Scripture-based notes, and formation materials.
              </p>

              <p className='mt-3 max-w-3xl text-sm leading-7 text-yellow-300'>
                Public visitors can read published resources. Signed-in members will later be able to save progress, continue studies, and keep study records.
              </p>
            </div>

            <div className='flex flex-wrap gap-3'>
              <Link
                href='/dashboard'
                className='rounded-full border border-yellow-700/70 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-700/20'
              >
                Member Dashboard
              </Link>

              <Link
                href='/login'
                className='rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400'
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-8 md:px-8'>
<div className='mb-8 rounded-[2rem] border border-yellow-700/50 bg-gradient-to-br from-[#2a0909] via-[#120707] to-black p-6 shadow-2xl shadow-black/40 md:p-8'>
  <p className='text-xs uppercase tracking-[0.35em] text-yellow-400'>
    Scripture
  </p>

  <h2 className='mt-3 text-3xl font-black text-white md:text-5xl'>
    Bible Reader
  </h2>

  <p className='mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base'>
    Search and read Scripture directly inside the Study Center.
  </p>

  <Link
    href='/study/bible'
    className='mt-6 inline-block rounded-full bg-yellow-500 px-6 py-3 text-sm font-black text-black hover:bg-yellow-400'
  >
    Open Bible Reader →
  </Link>
</div>
        {resourcesError && (
          <div className='mb-6 rounded border border-red-700 bg-red-950/40 p-4 text-red-300'>
            Error loading study resources: {resourcesError.message}
          </div>
        )}

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {resources?.map((resource) => (
            <Link
              key={resource.id}
              href={`/study/${resource.id}`}
              className='group overflow-hidden rounded-2xl border border-yellow-900/40 bg-[#120707] shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-yellow-600'
            >
              {resource.image_url && (
                <img
                  src={resource.image_url}
                  alt={resource.title}
                  className='h-56 w-full object-cover'
                />
              )}

              <div className='p-5'>
                <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
                  {resource.category || resource.resource_type || 'Study'}
                </p>

                <h2 className='mt-3 text-2xl font-bold text-white'>
                  {resource.title}
                </h2>

                {resource.summary && (
                  <p className='mt-3 text-sm leading-7 text-gray-300'>
                    {resource.summary}
                  </p>
                )}

                {resource.scripture_references && (
                  <p className='mt-4 text-xs leading-6 text-yellow-300'>
                    Scriptures: {resource.scripture_references}
                  </p>
                )}

                <p className='mt-5 text-sm font-bold text-yellow-400 group-hover:text-yellow-300'>
                  Open Study →
                </p>
              </div>
            </Link>
          ))}

          {resources?.length === 0 && (
            <div className='rounded-2xl border border-yellow-900/30 p-6 text-gray-400'>
              No study resources have been published yet.
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}