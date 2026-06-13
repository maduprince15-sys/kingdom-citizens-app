import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`)
    process.exitCode = 1
  }
}

const css = read('app/globals.css')
const dashboard = read('app/dashboard/page.tsx')
const home = read('app/page.tsx')
const header = read('app/components/PublicHeader.tsx')
const members = read('app/members/page.tsx')

assert(css.includes('overflow-x: hidden'), 'global CSS prevents page-wide horizontal overflow.')
assert(css.includes('.kc-dashboard-grid'), 'responsive dashboard grid helper exists.')
assert(css.includes('.kc-mobile-card'), 'mobile-safe card helper exists.')
assert(css.includes('.kc-table-scroll'), 'table scroll wrapper helper exists.')
assert(css.includes('.kc-mobile-actions'), 'mobile action button group helper exists.')
assert(dashboard.includes('kc-mobile-shell'), 'dashboard uses mobile shell.')
assert(dashboard.includes('kc-dashboard-grid'), 'dashboard uses responsive dashboard grid.')
assert(dashboard.includes('kc-mobile-actions'), 'dashboard action buttons are mobile-safe.')
assert(home.includes('kc-mobile-shell'), 'home page uses mobile shell.')
assert(home.includes('text-4xl') && home.includes('md:text-7xl'), 'home hero type scales for phones.')
assert(header.includes('min-w-0') && header.includes('truncate'), 'public header avoids mobile overflow.')
assert(members.includes('kc-table-scroll'), 'members table is horizontally scrollable in its container.')
assert(!/className=['"][^'"]*\bw-\[(?:7|8|9)\d{2,}px\]/.test(dashboard), 'dashboard has no obvious fixed desktop-only width.')

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS: mobile responsive helpers and key page classes are present.')
