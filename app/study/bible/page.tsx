import Link from 'next/link'
import PublicHeader from '../../components/PublicHeader'
import PublicFooter from '../../components/PublicFooter'
import BibleLookup from './BibleLookup'

export default function BiblePage() {
  return (
    <main className='min-h-screen bg-[#050303] pb-20 text-white md:pb-0'>
      <PublicHeader />

      <section className='border-b border-yellow-900/40 bg-gradient-to-br from-black via-[#130606] to-[#260909] px-4 py-10 md:px-8 md:py-16'>
        <div className='mx-auto max-w-5xl'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            Study Center
          </p>

          <h1 className='mt-3 text-4xl font-black md:text-6xl'>
            Bible Reader
          </h1>

          <p className='mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base'>
            Search and read Scripture inside the Kingdom Citizens Study Center.
          </p>

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
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-5xl px-4 py-10 md:px-8'>
        <BibleLookup />
      </section>

      <PublicFooter />
    </main>
  )
}