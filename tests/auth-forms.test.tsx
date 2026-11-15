// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
const mock = vi.hoisted(() => ({
  replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), getUser: vi.fn(),
  signUp: vi.fn(), signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn(), signOut: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => mock }))
vi.mock('../lib/supabase/client', () => ({ supabaseConfigured: true, createClient: () => ({ auth: mock }) }))
vi.mock('../app/components/GoogleLoginButton', () => ({ default: () => null }))
import Login from '../app/login/page'
import Register from '../app/register/page'
import ForgotPassword from '../app/forgot-password/page'
import Logout from '../app/dashboard/LogoutButton'
beforeEach(() => {
  vi.resetAllMocks()
  mock.getUser.mockResolvedValue({ data: { user: null }, error: null })
})
afterEach(cleanup)
async function fillCredentials() {
  fireEvent.change(await screen.findByPlaceholderText('Enter your email'), { target: { value: 'citizen@example.invalid' } })
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'test-password-only' } })
}
it('password sign-in routes to dashboard and refreshes server session', async () => {
  mock.signInWithPassword.mockResolvedValue({ error: null })
  render(<Login />)
  await fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() => expect(mock.push).toHaveBeenCalledWith('/dashboard'))
  expect(mock.refresh).toHaveBeenCalled()
})
it('failed password sign-in remains on login with retry enabled', async () => {
  mock.signInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
  render(<Login />)
  await fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await screen.findByText('Invalid credentials')
  expect(mock.push).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Sign in' }).hasAttribute('disabled')).toBe(false)
})
it.each([true, false])('registration handles immediate session=%s', async immediate => {
  mock.signUp.mockResolvedValue({ data: { session: immediate ? { access_token: 'test' } : null }, error: null })
  render(<Register />)
  await fillCredentials()
  fireEvent.change(screen.getByPlaceholderText('Enter your full name'), { target: { value: 'Test Citizen' } })
  fireEvent.submit(screen.getByPlaceholderText('Enter your full name').closest('form')!)
  await waitFor(() => expect(mock.signUp).toHaveBeenCalled())
  expect(mock.signUp.mock.calls[0][0].options.emailRedirectTo).toBe(`${window.location.origin}/auth/callback`)
  if (immediate) await waitFor(() => expect(mock.replace).toHaveBeenCalledWith('/dashboard'))
  else {
    await screen.findByText(/Check your email and confirm/)
    expect(mock.replace).not.toHaveBeenCalled()
  }
})
it('password recovery uses initiating deployment even with a Production site URL', async () => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://production.invalid')
  mock.resetPasswordForEmail.mockResolvedValue({ error: null })
  render(<ForgotPassword />)
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'citizen@example.invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }))
  await waitFor(() => expect(mock.resetPasswordForEmail).toHaveBeenCalledWith('citizen@example.invalid', { redirectTo: `${window.location.origin}/auth/callback?next=/update-password` }))
  vi.unstubAllEnvs()
})
it('logout failure does not falsely navigate to login', async () => {
  mock.signOut.mockResolvedValue({ error: new Error('offline') })
  render(<Logout />)
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
  await screen.findByRole('alert')
  expect(mock.replace).not.toHaveBeenCalled()
})
it('successful logout clears navigation state', async () => {
  mock.signOut.mockResolvedValue({ error: null })
  render(<Logout />)
  fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
  await waitFor(() => expect(mock.replace).toHaveBeenCalledWith('/login'))
  expect(mock.refresh).toHaveBeenCalled()
})

it('network exceptions release the login form for retry', async () => {
  mock.signInWithPassword.mockRejectedValue(new Error('offline'))
  render(<Login />)
  await fillCredentials()
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await screen.findByText(/Unable to reach sign-in services/)
  expect(screen.getByRole('button', { name: 'Sign in' }).hasAttribute('disabled')).toBe(false)
})
