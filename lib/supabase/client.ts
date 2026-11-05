import { createBrowserClient } from '@supabase/ssr'

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const configuredKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Preview may intentionally have no database credentials. The reserved .invalid
// domain can never reach the Production database. Do not confuse this client
// with a connected Supabase account or enable authentication when unconfigured.
export const supabaseConfigured = Boolean(configuredUrl && configuredKey)
const supabaseUrl = configuredUrl || 'https://preview-unconfigured.invalid'
const supabaseKey = configuredKey || 'preview-unconfigured-no-auth-key'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey)
}
