'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function PublicHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className='sticky top-0 z-50 border-b border-yellow-900/40 bg-[#120505]/95 px-4 py-4 text-white backdrop-blur md:px-8'>
        <div className='mx-auto flex max-w-6xl items-center justify-between'>
          <Link href='/' className='flex items-center gap-4'>
            <img
              src='/kingdom-citizens-logo.png'
              alt='The Kingdom Citizens'
              className='h-16 w-16 rounded-full object-cover md:h-20 md:w-20'
            />

            <div>
              <h1 className='text-xl font-bold leading-tight text-yellow-400 md:text-2xl'>
                The Kingdom Citizens
              </h1>
              <p className='text-xs text-gray-300 md:text-sm'>
                Our address is in Christ
              </p>
            </div>
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className='rounded-lg border border-yellow-800/60 px-4 py-2 text-2xl leading-none text-yellow-400 hover:bg-yellow-900/20'
            aria-label='Open menu'
          >
            ☰
          </button>
        </div>

        {open && (
          <nav className='mx-auto mt-4 max-h-[65vh] max-w-6xl overflow-y-auto rounded-2xl border border-yellow-900/40 bg-black/90 p-4 pb-28'>
            <div className='grid grid-cols-1 gap-3 text-sm md:grid-cols-3'>
              <Link href='/' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Home
              </Link>

              <Link href='/public/announcements' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Announcements
              </Link>

              <Link href='/public/posts' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Posts
              </Link>

              <Link href='/public/giving' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Giving
              </Link>

              <Link href='/public/books' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Books
              </Link>

              <Link href='/public/connect' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Connect
              </Link>

              <Link href='/public/meetings' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Meetings
              </Link>

              <Link href='/prayers' className='rounded-lg p-3 hover:bg-yellow-900/20'>
                Prayer Wall
              </Link>

              <Link href='/dashboard' className='rounded-lg bg-yellow-500 p-3 font-bold text-black hover:bg-yellow-400'>
                Dashboard
              </Link>

              <Link href='/login' className='rounded-lg border border-yellow-800 p-3 text-yellow-300 hover:bg-yellow-900/20'>
                Login
              </Link>
            </div>
          </nav>
        )}
      </header>

      <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-yellow-900/40 bg-black/95 px-2 py-2 text-white md:hidden'>
        <div className='grid grid-cols-5 text-center text-[11px]'>
          <Link href='/' className='flex flex-col items-center gap-1 text-yellow-400'>
            <span className='text-lg'>⌂</span>
            <span>Home</span>
          </Link>

          <Link href='/public/announcements' className='flex flex-col items-center gap-1 text-gray-300'>
            <span className='text-lg'>📢</span>
            <span>News</span>
          </Link>

          <Link href='/public/posts' className='flex flex-col items-center gap-1 text-gray-300'>
            <span className='text-lg'>✍</span>
            <span>Posts</span>
          </Link>

          <Link href='/public/meetings' className='flex flex-col items-center gap-1 text-gray-300'>
            <span className='text-lg'>📅</span>
            <span>Meet</span>
          </Link>

          <Link href='/dashboard' className='flex flex-col items-center gap-1 text-gray-300'>
            <span className='text-lg'>☰</span>
            <span>App</span>
          </Link>
        </div>
      </nav>
    </>
  )
}