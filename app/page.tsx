import Link from 'next/link'
import PublicHeader from './components/PublicHeader'
import PublicFooter from './components/PublicFooter'

export default function HomePage() {
  return (
    <main className='min-h-screen bg-[#050303] pb-20 text-white md:pb-0'>
      <PublicHeader />

      <section className='relative overflow-hidden border-b border-yellow-900/40 bg-gradient-to-br from-[#210808] via-[#0b0505] to-black px-4 py-10 md:px-8 md:py-16'>
        <div className='absolute inset-0 opacity-20'>
          <div className='absolute right-10 top-20 h-72 w-72 rounded-full bg-yellow-500 blur-[120px]' />
          <div className='absolute bottom-0 left-10 h-72 w-72 rounded-full bg-red-800 blur-[140px]' />
        </div>

        <div className='relative mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
          <div>
            <div className='inline-flex rounded-full border border-yellow-700/60 bg-black/30 px-4 py-2 text-xs font-semibold text-yellow-300 md:text-sm'>
              Christ-centered teaching and spiritual formation community
            </div>

            <h1 className='mt-6 text-5xl font-black leading-tight tracking-tight md:text-7xl'>
              The Kingdom <br />
              Citizens
            </h1>

            <p className='mt-5 max-w-2xl text-base leading-8 text-gray-200 md:text-lg'>
              A community of heavenly citizens under mission on the earth, growing in
              Christ, in the Word, in prayer, and in spiritual formation.
            </p>

            <div className='mt-8 flex flex-wrap gap-4'>
              <Link
                href='/public/announcements'
                className='rounded-full bg-yellow-500 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-yellow-900/30 hover:bg-yellow-400'
              >
                View Announcements
              </Link>

              <Link
                href='/public/posts'
                className='rounded-full border border-yellow-700/70 px-6 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-900/20'
              >
                Explore Posts
              </Link>
            </div>

            <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div className='rounded-2xl border border-yellow-900/30 bg-black/30 p-5'>
                <p className='text-sm font-bold text-yellow-300'>Thursday</p>
                <h3 className='mt-2 text-lg font-bold'>Bible Study</h3>
                <p className='text-sm text-gray-300'>8:00 PM</p>
              </div>

              <div className='rounded-2xl border border-yellow-900/30 bg-black/30 p-5'>
                <p className='text-sm font-bold text-yellow-300'>Sunday</p>
                <h3 className='mt-2 text-lg font-bold'>Service</h3>
                <p className='text-sm text-gray-300'>7:00 PM</p>
              </div>

              <div className='rounded-2xl border border-yellow-900/30 bg-black/30 p-5'>
                <p className='text-sm font-bold text-yellow-300'>Daily</p>
                <h3 className='mt-2 text-lg font-bold'>Bible Study</h3>
                <p className='text-sm text-gray-300'>Individual study possible</p>
              </div>
            </div>
          </div>

          <div className='rounded-[2rem] border border-yellow-900/40 bg-gradient-to-br from-yellow-100 to-white p-5 text-black shadow-2xl shadow-black/40'>
            <div className='rounded-[1.5rem] bg-[#120707] p-5 text-white'>
              <div className='flex items-center gap-4'>
                <img
                  src='/kingdom-citizens-logo.png'
                  alt='The Kingdom Citizens'
                  className='h-16 w-16 rounded-full object-cover'
                />

                <div>
                  <p className='text-xs uppercase tracking-[0.3em] text-yellow-400'>
                    The Kingdom Citizens
                  </p>
                  <h2 className='mt-1 text-2xl font-bold'>Today</h2>
                </div>
              </div>

              <div className='mt-6 rounded-2xl bg-[#7c2630] p-5'>
                <p className='text-xs uppercase tracking-[0.25em] text-yellow-200'>
                  Welcome
                </p>
                <p className='mt-3 text-lg font-bold'>
                  Growing together in Christ and in the Word.
                </p>
              </div>

              <div className='mt-5 grid grid-cols-2 gap-4'>
                <div className='rounded-2xl bg-white/90 p-4 text-black'>
                  <p className='text-xs text-gray-500'>Schedule</p>
                  <p className='mt-2 font-bold'>Thursday</p>
                  <p className='text-sm'>Bible Study</p>
                  <p className='text-sm'>8:00 PM</p>
                </div>

                <div className='rounded-2xl bg-white/90 p-4 text-black'>
                  <p className='text-xs text-gray-500'>Prayer</p>
                  <p className='mt-2 font-bold'>Stand Together</p>
                  <p className='text-sm'>Prayer Wall</p>
                </div>
              </div>

              <div className='mt-5 rounded-2xl border border-yellow-900/40 bg-black/40 p-4'>
                <p className='text-xs uppercase tracking-[0.25em] text-yellow-400'>
                  Meditation Scripture
                </p>
                <p className='mt-3 text-sm leading-6 text-gray-300'>
                  “He humbled you, caused you to hunger, and fed you with manna...”
                </p>
                <p className='mt-2 text-xs text-gray-500'>Deuteronomy 8:3</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 py-10 md:px-8'>
        <div className='mb-6'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            Community Life
          </p>
          <h2 className='mt-2 text-3xl font-bold md:text-4xl'>
            Enter the Kingdom Citizens platform
          </h2>
          <p className='mt-3 max-w-3xl text-sm leading-7 text-gray-300'>
            Access announcements, teachings, books, meetings, prayer, and member tools.
          </p>
        </div>

        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
          <Link
            href='/public/announcements'
            className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-black p-6 shadow-lg shadow-black/30 hover:border-yellow-600'
          >
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Official Notices
            </p>
            <h3 className='mt-3 text-2xl font-bold'>Announcements</h3>
            <p className='mt-3 text-sm leading-6 text-gray-300'>
              Read ministry notices, updates, and public communication.
            </p>
          </Link>

          <Link
            href='/public/posts'
            className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-black p-6 shadow-lg shadow-black/30 hover:border-yellow-600'
          >
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Teaching
            </p>
            <h3 className='mt-3 text-2xl font-bold'>Posts</h3>
            <p className='mt-3 text-sm leading-6 text-gray-300'>
              Read teaching posts, meditations, and community writings.
            </p>
          </Link>

          <Link
            href='/public/books'
            className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-black p-6 shadow-lg shadow-black/30 hover:border-yellow-600'
          >
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Bookstore
            </p>
            <h3 className='mt-3 text-2xl font-bold'>Books</h3>
            <p className='mt-3 text-sm leading-6 text-gray-300'>
              Explore Kingdom Citizens books and teaching resources.
            </p>
          </Link>

          <Link
            href='/public/connect'
            className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-black p-6 shadow-lg shadow-black/30 hover:border-yellow-600'
          >
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Channels
            </p>
            <h3 className='mt-3 text-2xl font-bold'>Connect</h3>
            <p className='mt-3 text-sm leading-6 text-gray-300'>
              Visit official media channels and public links.
            </p>
          </Link>

          <Link
            href='/public/meetings'
            className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-black p-6 shadow-lg shadow-black/30 hover:border-yellow-600'
          >
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Gatherings
            </p>
            <h3 className='mt-3 text-2xl font-bold'>Meetings</h3>
            <p className='mt-3 text-sm leading-6 text-gray-300'>
              Join services, Bible studies, and live fellowship meetings.
            </p>
          </Link>

          <Link
            href='/login'
            className='rounded-2xl border border-yellow-900/30 bg-gradient-to-br from-[#120707] to-black p-6 shadow-lg shadow-black/30 hover:border-yellow-600'
          >
            <p className='text-xs uppercase tracking-[0.25em] text-yellow-500'>
              Member Access
            </p>
            <h3 className='mt-3 text-2xl font-bold'>Login</h3>
            <p className='mt-3 text-sm leading-6 text-gray-300'>
              Enter the member dashboard and community tools.
            </p>
          </Link>
        </div>
      </section>

      <section className='mx-auto max-w-6xl px-4 pb-12 md:px-8'>
        <div className='rounded-3xl border border-yellow-900/40 bg-[#120707] p-6 md:p-8'>
          <p className='text-xs uppercase tracking-[0.35em] text-yellow-500'>
            Identity
          </p>

          <h2 className='mt-3 text-3xl font-bold'>
            Our address is in Christ.
          </h2>

          <p className='mt-4 max-w-3xl text-sm leading-7 text-gray-300 md:text-base'>
            The Kingdom Citizens exists as a Christ-centered community for teaching,
            prayer, formation, and Kingdom expression. We grow together under the Word,
            in fellowship, and in the life of Christ.
          </p>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}