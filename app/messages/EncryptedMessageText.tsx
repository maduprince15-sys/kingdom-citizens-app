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

  useEffect(() => {
    let active = true

    async function decrypt() {
      const result = await decryptStoredPrivateMessage(body)
      if (!active) return
      setText(preview && !result.legacy ? 'Encrypted message' : result.text)
    }

    void decrypt()

    return () => {
      active = false
    }
  }, [body, preview])

  return <span className={className}>{text}</span>
}
