// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
const m = vi.hoisted(() => ({ encrypt: vi.fn(), push: vi.fn(), refresh: vi.fn() }))
vi.mock('../lib/e2ee/messages', () => ({ encryptPrivateMessageBody: m.encrypt }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: m.push, refresh: m.refresh }) }))
import MessageForm from '../app/messages/new/MessageForm'
beforeEach(() => { vi.resetAllMocks(); m.encrypt.mockResolvedValue('synthetic ciphertext') })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function compose() {
  render(<MessageForm recipients={[{ id: 'recipient', full_name: 'Citizen B', email: null, role: 'teacher' }]} canBroadcast={false} />)
  fireEvent.change(screen.getByPlaceholderText('Message subject'), { target: { value: 'Synthetic subject' } })
  fireEvent.change(screen.getByPlaceholderText('Write the message'), { target: { value: 'Synthetic private draft' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send Message' }))
}
it.each(['encryption', 'network'])('preserves draft and allows retry after %s failure', async failure => {
  if (failure === 'encryption') m.encrypt.mockRejectedValue(new Error('unavailable'))
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  compose()
  await screen.findByText(/Your draft is still here/)
  expect((screen.getByPlaceholderText('Write the message') as HTMLTextAreaElement).value).toBe('Synthetic private draft')
  expect(screen.getByRole('button', { name: 'Send Message' }).hasAttribute('disabled')).toBe(false)
  expect(m.push).not.toHaveBeenCalled()
})
it('retains the draft when authorization fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Recipient not found.' }) }))
  compose()
  await waitFor(() => expect(screen.getByText('Recipient not found.')).toBeTruthy())
  expect((screen.getByPlaceholderText('Write the message') as HTMLTextAreaElement).value).toBe('Synthetic private draft')
})
