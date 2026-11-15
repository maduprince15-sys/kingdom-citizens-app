import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { isolatedRecipientEnrollmentEnabled } from '../../../lib/e2ee/isolated-config'
import DevicePairingPanel from './DevicePairingPanel'
export default async function DevicesPage() {
  if (!isolatedRecipientEnrollmentEnabled()) notFound()
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) redirect('/login')
  return <main className="mx-auto max-w-3xl space-y-5 p-6 text-white"><Link href="/dashboard">Back to dashboard</Link><h1 className="text-2xl font-bold">My trusted device</h1><DevicePairingPanel citizenId={user.id} /></main>
}
