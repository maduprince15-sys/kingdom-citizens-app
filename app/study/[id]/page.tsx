import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import PublicHeader from '../../components/PublicHeader'
import PublicFooter from '../../components/PublicFooter'

type Props = {
  params: Promise<{
    id: string
  }>
}

export default async function StudyResourcePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: resource, error: resourceError } = await supabase
    .from('study_resources')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (resourceError || !resource) {
    notFound()
  }

  return (
    <main className='min-h-screen bg-[#050303] pb-20 text-white md:pb-0'>
      <PublicHeader />

      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-10 md:px-8 md:py-16'>
        <div className='mx-auto max-w-4xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            Study Center
          </p>

          <h1 className='mt-3 text-3xl font-bold md:text-5xl'>
            {resource.title}
          </h1>

          {resource.summary && (
            <p className='mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base'>
              {resource.summary}
            </p>
          )}

          <div className='mt-6 flex flex-wrap gap-3'>
            <Link
              href='/study'
              className='rounded-full border border-yellow-700 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-900/20'
            >
              Back to Study Center
            </Link>

            <Link
              href='/dashboard'
              className='rounded-full border border-yellow-700 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-900/20'
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
      </section>

      <section className='mx-auto max-w-4xl px-4 py-8 md:px-8'>
        {resource.image_url && (
          <img
            src={resource.image_url}
            alt={resource.title}
            className='mb-8 max-h-[520px] w-full rounded-3xl object-cover'
          />
        )}

        <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Category
            </p>
            <p className='mt-2 text-lg font-bold capitalize'>
              {resource.category || 'general'}
            </p>
          </div>

          <div className='rounded-2xl border border-yellow-900/40 bg-[#120707] p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Type
            </p>
            <p className='mt-2 text-lg font-bold capitalize'>
              {resource.resource_type || 'lesson'}
            </p>
          </div>
        </div>

        {resource.scripture_references && (
          <div className='mb-6 rounded-2xl border border-yellow-900/40 bg-black/30 p-5'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Scripture References
            </p>
            <p className='mt-3 whitespace-pre-wrap text-sm leading-7 text-yellow-200'>
              {resource.scripture_references}
            </p>
          </div>
        )}

        {resource.content && (
          <article className='rounded-3xl border border-yellow-900/40 bg-[#120707] p-5 md:p-8'>
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Lesson Content
            </p>

            <div className='mt-5 whitespace-pre-wrap text-base leading-8 text-gray-200 md:text-lg md:leading-9'>
              {resource.content}
            </div>
          </article>
        )}

        <div className='mt-8 flex flex-wrap gap-3'>
          {resource.pdf_url && (
            <a
              href={resource.pdf_url}
              target='_blank'
              rel='noopener noreferrer'
              className='rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400'
            >
              Open PDF
            </a>
          )}

          {resource.video_url && (
            <a
              href={resource.video_url}
              target='_blank'
              rel='noopener noreferrer'
              className='rounded-full border border-yellow-700 px-5 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-900/20'
            >
              Open Video
            </a>
          )}

          {resource.audio_url && (
            <a
              href={resource.audio_url}
              target='_blank'
              rel='noopener noreferrer'
              className='rounded-full border border-yellow-700 px-5 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-900/20'
            >
              Open Audio
            </a>
          )}
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}