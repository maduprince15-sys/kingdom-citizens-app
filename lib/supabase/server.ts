import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const configuredKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseServerConfigured = Boolean(configuredUrl && configuredKey)
const supabaseUrl = configuredUrl || 'https://preview-unconfigured.invalid'
const supabaseKey = configuredKey || 'preview-unconfigured-no-auth-key'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Rendering a Server Component cannot always set response cookies.
        }
      },
    },
  })
}
