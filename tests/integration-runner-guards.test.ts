import { expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
const fixture = {
  KC_INTEGRATION_OPT_IN: 'synthetic-isolated-only', KC_ISOLATED_TEST_PROJECT_REF: 'synthetic-test',
  KC_TEST_SUPABASE_URL: 'https://synthetic-test.supabase.co', KC_TEST_SUPABASE_PUBLISHABLE_KEY: 'synthetic-key',
  KC_TEST_CITIZEN_A_EMAIL: 'synthetic-a@example.invalid', KC_TEST_CITIZEN_A_PASSWORD: 'synthetic-password',
  KC_TEST_CITIZEN_B_EMAIL: 'synthetic-b@example.invalid', KC_TEST_CITIZEN_B_PASSWORD: 'synthetic-password',
}
// Hard network block even if a future regression accidentally passes the guard.
const run = (env: Record<string,string>) => spawnSync(process.execPath, ['--input-type=module', '-e', "globalThis.fetch=async()=>{throw new Error('NETWORK_FORBIDDEN_IN_GUARD_TEST')};await import('./scripts/test-isolated-two-citizen.mjs')"], { cwd: process.cwd(), env: { NODE_ENV: 'test', ...env }, encoding: 'utf8' })
it.each([
  {},
  { ...fixture, KC_ISOLATED_TEST_PROJECT_REF: 'jngbhejfqbyjletfknkh', KC_TEST_SUPABASE_URL: 'https://jngbhejfqbyjletfknkh.supabase.co' },
  { ...fixture, KC_TEST_SUPABASE_URL: 'https://wrong-project.supabase.co' },
  { ...fixture, KC_TEST_CITIZEN_B_EMAIL: fixture.KC_TEST_CITIZEN_A_EMAIL },
])('exits BLOCKED for unsafe or absent integration configuration', env => {
  const result = run(env)
  expect(result.status).toBe(2)
  expect(result.stdout).toContain('BLOCKED')
  expect(result.stdout).not.toContain('synthetic-password')
})
