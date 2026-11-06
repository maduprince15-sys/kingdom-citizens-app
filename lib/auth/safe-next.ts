// Restrict the post-auth destination to an internal path.
// Supabase OAuth will never receive a protocol-relative or external URL here.
export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') ||
      value.includes('\\') || value.includes('\r') || value.includes('\n')) return '/dashboard'
  const path = value.split(/[?#]/, 1)[0]
  if (['/', '/login', '/register', '/auth/callback'].includes(path)) return '/dashboard'
  return value
}
