'use client'

import { useEffect, useState } from 'react'
import {
  decryptStoredPrivateMessage,
  getEncryptedMessagePreview,
} from '@/lib/e2ee/messages'

export default function EncryptedMessageText({
  body,
  preview = false,
  className = '',
}: {
  body: string
  preview?: boolean
  className?: string
}) {
  const [text, setText] = useState(() => getEncryptedMessagePreview(body))
  const [legacy, setLegacy] = useState(false)

  useEffect(() => {
    let active = true

    async function decrypt() {
      const result = await decryptStoredPrivateMessage(body)
      if (!active) return
      setLegacy(Boolean(result.legacy))
      setText(preview && result.legacy ? 'Legacy plaintext message' : preview ? 'Encrypted message' : result.text)
    }

    void decrypt()

    return () => {
      active = false
    }
  }, [body, preview])

  if (legacy && !preview) {
    return (
      <span className={className}>
        <span className='mb-3 inline-flex rounded-full border border-yellow-700/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300'>
          Legacy plaintext
        </span>
        <span className='block'>{text}</span>
      </span>
    )
  }

  return <span className={className}>{text}</span>
}
