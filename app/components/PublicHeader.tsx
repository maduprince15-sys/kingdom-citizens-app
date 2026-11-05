'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/public/posts', label: 'Teachings' },
  { href: '/public/meetings', label: 'Meetings' },
  { href: '/public/books', label: 'Books' },
]
export default function PublicHeader() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])
  return (
    <header className="sticky top-0 z-50 border-b border-[#c0a06c]/25 bg-[#12090b]/95 px-4 py-3 text-white shadow-lg backdrop-blur-xl md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link href="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
          <img src="/kingdom-citizens-logo.png" alt="" className="h-11 w-11 shrink-0 rounded-full border border-[#ccaf7a]/30 object-cover" />
          <span className="truncate text-base font-semibold tracking-tight text-[#efd9ab] sm:text-lg">The Kingdom Citizens</span>
        </Link>
        <nav aria-label="Public navigation" className="hidden items-center gap-1 lg:flex">
          {navigation.map((link) => <Link key={link.href} href={link.href} className="rounded-xl px-4 py-2 text-sm text-[#dfd1cf] hover:bg-white/[.08]">{link.label}</Link>)}
          <Link href="/login" className="ml-2 rounded-full border border-[#cfaa72]/45 bg-[#b28d53]/15 px-5 py-2 text-sm font-semibold text-[#edd2a1]">Member sign in</Link>
        </nav>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-controls="kc-public-menu" aria-expanded={open}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#bda06b]/40 bg-[#2b151a] text-xl text-[#f1dba9] lg:hidden">
          {open ? '×' : '☰'}
        </button>
      </div>
      {open && (
        <nav id="kc-public-menu" aria-label="Mobile navigation" className="mx-auto mt-3 max-w-6xl rounded-2xl border border-[#c6a46f]/25 bg-[#180c0f] p-2 shadow-xl lg:hidden">
          {navigation.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#f0e2dd] hover:bg-[#4b2830]">{link.label}</Link>)}
          <Link href="/public/announcements" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm text-[#e2d3ce]">Announcements</Link>
          <Link href="/public/contact" onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm text-[#e2d3ce]">Contact</Link>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl border border-[#cfaa72]/35 p-3 text-center text-sm font-semibold text-[#f1d5a4]">Sign in</Link>
            <Link href="/register" onClick={() => setOpen(false)} className="rounded-xl bg-[#caa76a] p-3 text-center text-sm font-semibold text-[#180d0d]">Join</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
