import { expect, it } from 'vitest'
import { ordinaryPublishableKey, privateReadDenied } from '../scripts/lib/integration-safety.mjs'
const ref = 'synthetic-test'
const jwt = (claims: Record<string, string>) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
it('accepts only publishable or matching anonymous legacy API keys', () => {
  expect(ordinaryPublishableKey('sb_publishable_synthetic_fixture', ref)).toBe(true)
  expect(ordinaryPublishableKey(jwt({ role: 'anon', ref }), ref)).toBe(true)
})
it.each(['sb_secret_synthetic', 'unrecognized-key', jwt({ role: 'service_role', ref }), jwt({ role: 'anon', ref: 'other-project' })])('rejects elevated or mismatched API key configuration', key => {
  expect(ordinaryPublishableKey(key, ref)).toBe(false)
})
it('treats an empty authorized result or explicit privilege denial as no disclosure', () => {
  expect(privateReadDenied({ data: [], error: null })).toBe(true)
  expect(privateReadDenied({ data: null, error: { code: '42501' } })).toBe(true)
  expect(privateReadDenied({ data: [{ id: 'other-citizen' }], error: null })).toBe(false)
})
it.each(['NETWORK_ERROR', '42P01', 'PGRST301', 'PGRST205'])('does not mistake %s for passing privacy isolation', code => {
  expect(() => privateReadDenied({ data: null, error: { code } })).toThrow()
})
it('rejects an invalid query result rather than interpreting it as zero rows', () => {
  expect(() => privateReadDenied({ data: null, error: null })).toThrow()
})
