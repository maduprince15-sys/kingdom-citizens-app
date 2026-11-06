import Link from 'next/link'
export default function PublicFooter() {
  return (
    <footer className="border-t border-[#cba769]/20 bg-[#080405] px-4 py-8 text-[#c6b7b2] md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-[#ebd2a1]">The Kingdom Citizens</p>
          <p className="mt-1 text-xs">Our address is in Christ.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
          <Link href="/public/posts">Teachings</Link>
          <Link href="/public/meetings">Meetings</Link>
          <Link href="/public/contact">Contact</Link>
          <Link href="/public/giving">Giving</Link>
          <Link href="/login">Members</Link>
        </nav>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-xs text-[#948480]">© {new Date().getFullYear()} The Kingdom Citizens</p>
    </footer>
  )
}
