import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import DevicePairingPanel from './DevicePairingPanel'
export default async function DevicesPage() {
  const ref = process.env.KC_ISOLATED_TEST_PROJECT_REF
  if (process.env.KC_RECIPIENT_ENROLLMENT_ENABLED !== 'isolated-test-only' || process.env.VERCEL_ENV === 'production' || !ref || ref === 'jngbhejfqbyjletfknkh' || process.env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co`) notFound()
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) redirect('/login')
  return <main className="mx-auto max-w-3xl space-y-5 p-6 text-white"><Link href="/dashboard">Back to dashboard</Link><h1 className="text-2xl font-bold">My trusted device</h1><DevicePairingPanel citizenId={user.id} /></main>
}
