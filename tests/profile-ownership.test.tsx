// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
const mock = vi.hoisted(() => ({ getUser: vi.fn(), updateUser: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mock.refresh }) }))
vi.mock('../lib/supabase/client', () => ({ createClient: () => ({ auth: mock, from: mock.from }) }))
import ProfileForm from '../app/profile/ProfileForm'
const props = { initialFullName: 'Test Citizen', initialPhone: '', initialBirthdayMonth: null, initialBirthdayDay: null, initialShowBirthday: false, initialAvatarUrl: '', email: 'citizen@example.invalid', role: 'owner' }
beforeEach(() => {
  vi.resetAllMocks()
  mock.from.mockReturnValue({ update: mock.update })
  mock.update.mockReturnValue({ eq: mock.eq })
  mock.eq.mockResolvedValue({ error: null })
})
afterEach(cleanup)
it.each(['citizen-a', 'citizen-b'])('profile form writes only verified owner %s and never changes roles', async id => {
  mock.getUser.mockResolvedValue({ data: { user: { id } }, error: null })
  render(<ProfileForm {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
  await waitFor(() => expect(mock.eq).toHaveBeenCalledWith('id', id))
  expect(mock.update.mock.calls[0][0]).not.toHaveProperty('role')
  expect(mock.update.mock.calls[0][0]).not.toHaveProperty('id')
})
it('profile email confirmation stays on the initiating Preview', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://production.invalid')
  mock.updateUser.mockResolvedValue({ error: null })
  render(<ProfileForm {...props} />)
  fireEvent.change(screen.getByPlaceholderText('Enter new email address'), { target: { value: 'new@example.invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send Verification Email' }))
  await waitFor(() => expect(mock.updateUser).toHaveBeenCalledWith({ email: 'new@example.invalid' }, { emailRedirectTo: `${window.location.origin}/auth/callback` }))
  vi.unstubAllEnvs()
})
