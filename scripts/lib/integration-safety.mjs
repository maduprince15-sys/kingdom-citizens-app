// No application environment fallback, elevated API key, or transport error can
// be mistaken for evidence of ordinary-Citizen RLS isolation.
export function ordinaryPublishableKey(key, expectedRef) {
  if (typeof key !== 'string' || key.startsWith('sb_secret_')) return false
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true
  try {
    const parts = key.split('.')
    if (parts.length !== 3) return false
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return claims.role === 'anon' && claims.ref === expectedRef
  } catch { return false }
}
export function privateReadDenied(result) {
  if (result.error) {
    if (result.error.code === '42501') return true
    throw new Error('Privacy probe failed without valid authorization evidence.')
  }
  if (!Array.isArray(result.data)) throw new Error('Privacy probe returned an invalid result.')
  return result.data.length === 0
}
