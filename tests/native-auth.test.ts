import { beforeEach, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleAndroidGoogleCallback } from '../lib/android-google-auth'
const auth = { exchangeCodeForSession: vi.fn(), getSession: vi.fn() }
const client = { auth } as unknown as SupabaseClient
beforeEach(() => {
  vi.resetAllMocks()
  auth.exchangeCodeForSession.mockResolvedValue({ error: null })
  auth.getSession.mockResolvedValue({ data: { session: { access_token: 'test' } } })
})
it.each(['not a url', 'https://evil.test/callback', 'kingdomcitizens://auth/callback-other?code=test'])('ignores unrelated deep link %s', async url => {
  expect(await handleAndroidGoogleCallback(client, url)).toEqual({ handled: false })
  expect(auth.exchangeCodeForSession).not.toHaveBeenCalled()
})
it('exchanges native authorization code', async () => {
  expect(await handleAndroidGoogleCallback(client, 'kingdomcitizens://auth/callback?code=test')).toEqual({ handled: true })
  expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('test')
})
it('requires a resulting app session', async () => {
  auth.getSession.mockResolvedValue({ data: { session: null } })
  expect(await handleAndroidGoogleCallback(client, 'kingdomcitizens://auth/callback?code=test')).toEqual({ handled: true, error: expect.any(String) })
})
