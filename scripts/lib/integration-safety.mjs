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

// Pure preflight shared by the live runner and its offline validation command.
// No application environment fallback and no credential values in diagnostics.
export function isolatedConfigurationReady(env) {
  const ref = env.KC_ISOLATED_TEST_PROJECT_REF
  const accounts = ['A', 'B'].map(name => ({ email: env[`KC_TEST_CITIZEN_${name}_EMAIL`], password: env[`KC_TEST_CITIZEN_${name}_PASSWORD`] }))
  return env.KC_INTEGRATION_OPT_IN === 'synthetic-isolated-only' &&
    typeof ref === 'string' && /^[a-z0-9-]{1,63}$/.test(ref) && ref !== 'jngbhejfqbyjletfknkh' &&
    env.KC_TEST_SUPABASE_URL === `https://${ref}.supabase.co` &&
    ordinaryPublishableKey(env.KC_TEST_SUPABASE_PUBLISHABLE_KEY, ref) &&
    accounts.every(account => typeof account.email === 'string' && account.email.trim().length > 0 && typeof account.password === 'string' && account.password.length > 0) &&
    accounts[0].email.trim().toLowerCase() !== accounts[1].email.trim().toLowerCase()
}
