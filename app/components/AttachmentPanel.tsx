'use client'
import { useCallback, useEffect, useState } from 'react'

export default function AttachmentPanel({ scope, resourceId, currentUserId }: { scope: 'messages' | 'groups'; resourceId: string; currentUserId: string }) {
  const url = `/api/attachments?scope=${scope}&id=${encodeURIComponent(resourceId)}`
  const [files, setFiles] = useState<{ name: string }[]>([])
  const [status, setStatus] = useState('Loading attachments...')
  const [uploading, setUploading] = useState(false)
  const load = useCallback(async () => {
    try {
      const response = await fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error('unavailable')
      const result = await response.json()
      setFiles(result.files)
      setStatus('')
    } catch { setStatus('Attachments are unavailable. Please try again later.') }
  }, [url])
  useEffect(() => {
    const controller = new AbortController()
    fetch(url, { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('unavailable'); return response.json() })
      .then(result => { if (!controller.signal.aborted) { setFiles(result.files); setStatus('') } })
      .catch(() => { if (!controller.signal.aborted) setStatus('Attachments are unavailable. Please try again later.') })
    return () => controller.abort()
  }, [url])
  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) { setStatus('Maximum file size is 2 MB.'); return }
    setUploading(true)
    setStatus('Uploading...')
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
      if (!response.ok) { setStatus('Upload rejected. Use a PNG, JPEG, PDF or plain text file up to 2 MB.'); return }
      await load()
      setStatus('Attachment uploaded.')
    } catch { setStatus('Upload failed. Please try again.') }
    finally { setUploading(false) }
  }
  async function remove(name: string) {
    setUploading(true)
    try {
      const response = await fetch(`${url}&name=${encodeURIComponent(name)}`, { method: 'DELETE' })
      if (!response.ok) { setStatus('Could not delete this attachment. Access may have changed.'); return }
      await load()
      setStatus('Attachment deleted.')
    } catch { setStatus('Attachment deletion failed. Please try again.') }
    finally { setUploading(false) }
  }
  return <section className="mt-6 rounded-xl border border-yellow-900/40 p-4">
    <h2 className="font-semibold">Private attachments</h2>
    <label className="mt-3 block text-sm">PNG, JPEG, PDF or plain text; up to 2 MB.
      <input aria-label="Upload private attachment" className="mt-2 block" type="file" accept="image/png,image/jpeg,application/pdf,text/plain" disabled={uploading}
        onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = '' }} />
    </label>
    <p role="status" className="mt-2 text-sm">{status}</p>
    <ul>{files.map(file => <li key={file.name}><a className="text-yellow-300 underline" href={`${url}&name=${encodeURIComponent(file.name)}`}>Download {file.name}</a>{file.name.startsWith(`${currentUserId}_`) && <button className="ml-3 underline" disabled={uploading} onClick={() => void remove(file.name)}>Delete your attachment</button>}</li>)}</ul>
  </section>
}
