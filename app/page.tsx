import Link from 'next/link'

const LOGO_SRC = '/logo.png' // if your logo file has another name, replace this path

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#140707] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#5a0716_0%,#2a0610_28%,#1a0b09_55%,#140707_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,215,120,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_22%),radial-gradient(circle_at_center,rgba(145,15,44,0.25),transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-8">
          {/* NAV */}
          <nav className="flex flex-col gap-4 rounded-2xl border border-yellow-600/20 bg-black/20 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={LOGO_SRC}
                alt="Kingdom Citizens logo"
                className="h-12 w-12 rounded-full object-cover ring-1 ring-yellow-500/40"
              />
              <div>
                <p className="text-lg font-bold tracking-wide text-yellow-300">
                  Kingdom Citizens
                </p>
                <p className="text-xs text-yellow-100/70">
                  Our address is in Christ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <a href="#about" className="text-gray-200 hover:text-yellow-300">About</a>
              <a href="#meetings" className="text-gray-200 hover:text-yellow-300">Meetings</a>
              <a href="#locations" className="text-gray-200 hover:text-yellow-300">Locations</a>
              <Link href="/public/announcements" className="text-gray-200 hover:text-yellow-300">Announcements</Link>
              <Link href="/public/posts" className="text-gray-200 hover:text-yellow-300">Posts</Link>
              <Link href="/public/connect" className="text-gray-200 hover:text-yellow-300">Connect</Link>
              <Link href="/login" className="rounded-full border border-yellow-500/40 px-4 py-2 font-medium text-yellow-200 hover:bg-yellow-500/10">
                Login
              </Link>
            </div>
          </nav>

          {/* HERO BODY */}
          <div className="grid gap-10 py-14 md:grid-cols-2 md:items-center md:py-20">
            <div>
              <p className="mb-4 inline-block rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200">
                Christ-centered teaching and spiritual formation community
              </p>

              <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
                Kingdom Citizens
              </h1>

              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#f5e8d0]">
                A community of heavenly citizens under mission on the earth,
                growing in Christ, in the Word, in prayer, and in spiritual formation.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/public/announcements"
                  className="rounded-full bg-yellow-500 px-6 py-3 font-semibold text-black transition hover:bg-yellow-400"
                >
                  View Announcements
                </Link>

                <Link
                  href="/public/posts"
                  className="rounded-full border border-yellow-500/40 px-6 py-3 font-semibold text-yellow-200 transition hover:bg-yellow-500/10"
                >
                  Explore Posts
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-yellow-600/20 bg-white/5 p-4">
                  <p className="text-sm text-yellow-300">Thursday</p>
                  <p className="mt-1 font-semibold text-white">Bible Study</p>
                  <p className="text-sm text-gray-300">8:00 PM</p>
                </div>

                <div className="rounded-2xl border border-yellow-600/20 bg-white/5 p-4">
                  <p className="text-sm text-yellow-300">Sunday</p>
                  <p className="mt-1 font-semibold text-white">Service</p>
                  <p className="text-sm text-gray-300">7:00 PM</p>
                </div>

                <div className="rounded-2xl border border-yellow-600/20 bg-white/5 p-4">
                  <p className="text-sm text-yellow-300">Daily</p>
                  <p className="mt-1 font-semibold text-white">Bible Study</p>
                  <p className="text-sm text-gray-300">Individual study possible</p>
                </div>
              </div>
            </div>

            <div>
              <div className="overflow-hidden rounded-[2rem] border border-yellow-600/30 bg-[linear-gradient(180deg,#f8edd8_0%,#f1dfc0_100%)] p-5 text-[#2b0c0c] shadow-2xl shadow-black/40">
                <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#fff6e8_0%,#f7e7cd_100%)] p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <img
                      src={LOGO_SRC}
                      alt="Kingdom Citizens logo"
                      className="h-16 w-16 rounded-full object-cover ring-1 ring-yellow-700/30"
                    />
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-[#7d1929]">
                        Kingdom Citizens
                      </p>
                      <h2 className="mt-1 text-3xl font-bold leading-tight">
                        Tonight Prayer <span className="text-[#7d1929]">&</span> Meditation
                      </h2>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#7d1929] px-5 py-4 text-center text-white">
                    <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">
                      Meditation Title
                    </p>
                    <p className="mt-2 text-2xl font-bold">Walking in the Wilderness</p>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[#7d1929]/15 bg-white p-4">
                      <p className="text-sm text-[#7d1929]">Schedule</p>
                      <p className="mt-1 font-bold">Thursday Tonight</p>
                      <p className="text-lg">8:00 PM</p>
                    </div>

                    <div className="rounded-2xl border border-[#7d1929]/15 bg-white p-4">
                      <p className="text-sm text-[#7d1929]">Attendance</p>
                      <p className="mt-1 font-bold">Join us</p>
                      <p>In-person or online</p>
                    </div>

                    <div className="rounded-2xl border border-[#7d1929]/15 bg-white p-4">
                      <p className="text-sm text-[#7d1929]">Scripture</p>
                      <p className="mt-1 font-bold">James 4:8</p>
                      <p>Draw near to God.</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#7d1929]/15 bg-white p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d1929]">
                      Meditation Scripture
                    </p>
                    <p className="mt-3 text-lg leading-8">
                      “He humbled you, causing you to hunger and then feeding you with manna.”
                    </p>
                    <p className="mt-2 font-semibold">Deuteronomy 8:3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="border-t border-yellow-700/20 bg-[linear-gradient(180deg,#18070b_0%,#120609_100%)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">About</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              What is Kingdom Citizens?
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-[220px,1fr] md:items-start">
            <div className="flex justify-center md:justify-start">
              <img
                src={LOGO_SRC}
                alt="Kingdom Citizens logo"
                className="h-44 w-44 rounded-full object-cover ring-2 ring-yellow-500/30"
              />
            </div>

            <div className="rounded-3xl border border-yellow-700/20 bg-white/5 p-6 md:p-8">
              <p className="text-lg leading-9 text-[#f4e9d7]">
                Kingdom Citizens is an online <span className="font-semibold text-yellow-300">Christ-centered</span>{' '}
                teaching and spiritual formation community of{' '}
                <span className="font-semibold text-yellow-300">Heavenly Citizens</span>{' '}
                under mission on the earth.
              </p>

              <p className="mt-6 text-lg leading-9 text-[#f4e9d7]">
                They are in Christ, <span className="italic text-yellow-300">above</span> while the world
                is beneath them.
              </p>

              <div className="mt-8 space-y-4 rounded-2xl border border-yellow-700/20 bg-black/20 p-5">
                <p className="text-lg italic text-gray-200">
                  “Our citizenship is in heaven, from which we also eagerly wait for the Savior,
                  the Lord Jesus Christ.”
                </p>
                <p className="text-right text-yellow-300">— Philippians 3:20</p>

                <p className="pt-3 text-lg italic text-gray-200">
                  “My kingdom is not of this world.”
                </p>
                <p className="text-right text-yellow-300">— John 18:36</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEETINGS */}
      <section
        id="meetings"
        className="border-t border-yellow-700/20 bg-[linear-gradient(180deg,#1a080d_0%,#15070a_100%)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">Meet With Us</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Weekly Gatherings</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-yellow-600/20 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-widest text-yellow-300">Sunday</p>
              <h3 className="mt-3 text-2xl font-bold">Service</h3>
              <p className="mt-2 text-gray-300">7:00 PM</p>
            </div>

            <div className="rounded-3xl border border-yellow-600/20 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-widest text-yellow-300">Thursday</p>
              <h3 className="mt-3 text-2xl font-bold">Bible Study / Prayer / Meditation</h3>
              <p className="mt-2 text-gray-300">8:00 PM</p>
            </div>

            <div className="rounded-3xl border border-yellow-600/20 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-widest text-yellow-300">Daily</p>
              <h3 className="mt-3 text-2xl font-bold">Individual Bible Study</h3>
              <p className="mt-2 text-gray-300">Possible / Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section
        id="locations"
        className="border-t border-yellow-700/20 bg-[linear-gradient(180deg,#130608_0%,#0f0507_100%)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">Locations</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Where We Gather</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-yellow-600/20 bg-white/5 p-6">
              <h3 className="text-2xl font-bold text-yellow-300">Online</h3>
              <p className="mt-4 leading-8 text-gray-200">
                Kingdom Citizens is an online community. Members can connect through the website,
                teaching posts, announcements, and live meeting links.
              </p>
              <div className="mt-5">
                <Link
                  href="/public/connect"
                  className="rounded-full border border-yellow-500/40 px-5 py-3 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/10"
                >
                  Open Connect Page
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-yellow-600/20 bg-white/5 p-6">
              <h3 className="text-2xl font-bold text-yellow-300">Live Meetings</h3>
              <p className="mt-4 leading-8 text-gray-200">
                Join scheduled meetings through the meetings page for available live gathering links
                such as Zoom, Google Meet, or other meeting platforms.
              </p>
              <div className="mt-5">
                <Link
                  href="/public/meetings"
                  className="rounded-full border border-yellow-500/40 px-5 py-3 text-sm font-semibold text-yellow-200 hover:bg-yellow-500/10"
                >
                  View Meeting Links
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-yellow-700/20 bg-[linear-gradient(180deg,#22090e_0%,#120607_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-8">
          <h2 className="text-3xl font-bold md:text-4xl">
            Draw near to God and He will draw near to you.
          </h2>
          <p className="mt-4 text-gray-300">James 4:8</p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/public/announcements"
              className="rounded-full bg-yellow-500 px-6 py-3 font-semibold text-black hover:bg-yellow-400"
            >
              See Announcements
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-yellow-500/40 px-6 py-3 font-semibold text-yellow-200 hover:bg-yellow-500/10"
            >
              Member Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}