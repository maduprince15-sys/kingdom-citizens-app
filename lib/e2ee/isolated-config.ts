// Server-only activation decision; no credentials are read or returned.
export function isolatedRecipientEnrollmentEnabled(env: NodeJS.ProcessEnv = process.env) {
  const ref = env.KC_ISOLATED_TEST_PROJECT_REF
  return env.KC_RECIPIENT_ENROLLMENT_ENABLED === 'isolated-test-only' && env.VERCEL_ENV !== 'production' &&
    typeof ref === 'string' && /^[a-z0-9-]{1,63}$/.test(ref) && ref !== 'jngbhejfqbyjletfknkh' &&
    env.NEXT_PUBLIC_SUPABASE_URL === `https://${ref}.supabase.co`
}
