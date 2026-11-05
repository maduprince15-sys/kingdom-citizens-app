// An OAuth return path must stay inside the Kingdom Citizens site.
export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') ||
      value.includes('\\') || value.includes('\r') || value.includes('\n')) return '/dashboard'
  const path = value.split(/[?#]/, 1)[0]
  if (['/', '/login', '/register', '/auth/callback'].includes(path)) return '/dashboard'
  return value
}
