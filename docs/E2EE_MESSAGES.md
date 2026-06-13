# Private Message E2EE

New private message bodies are encrypted in the browser before reaching `/api/messages/send`.

## Encrypted Now

- New private message body text.
- Stored payload in `app_messages.body` for new private messages.
- Inbox, sent, and detail message rendering decrypt locally when the device has the key.

Encryption happens in:

```text
app/messages/new/MessageForm.tsx
lib/e2ee/messages.ts
lib/e2ee/crypto.ts
```

The API accepts `encryptedBody`, validates a version `1` AES-GCM payload, and rejects plaintext `body` submissions.

## Server Plaintext Status

For new private messages, Supabase should not receive plaintext message body content. The client sends ciphertext JSON only:

```json
{
  "encrypted": true,
  "payload": {
    "version": 1,
    "algorithm": "AES-GCM",
    "ciphertext": "...",
    "iv": "..."
  }
}
```

Notification preview text is always:

```text
New encrypted message
```

## Visible Metadata

The server and database still see:

- sender id
- sender name
- recipient id
- subject
- created time
- read/archive timestamps
- notification existence
- approximate message size from ciphertext length

Subjects are not encrypted in this pass.

## Legacy Plaintext

Legacy plaintext messages already stored before this pass are treated as legacy plaintext. The message detail UI labels them as `Legacy plaintext`, and message lists preview them as `Legacy plaintext message`.

No silent migration is performed. A future migration should either:

- leave legacy rows clearly marked, or
- let a user intentionally re-encrypt messages from a trusted device.

## Key Management Limitations

This is not full production multi-device E2EE.

Current key model:

- A device-local AES-GCM key is generated in the browser.
- The private key is stored locally on that device.
- The server does not receive the local encryption key.

Limitations:

- A new device may not decrypt older encrypted messages.
- There is no recovery if the local key is lost.
- There is no verified device trust flow yet.
- There is no public key registration or per-recipient wrapped conversation key yet.
- There is no key rotation UX.

## Not Encrypted

- Group chat messages in `chat_messages`.
- Message subjects.
- Public announcements, posts, prayers, meetings, books, or study content.
- Notification metadata.

## Production Roadmap

To reach production multi-device E2EE, add:

1. Per-device asymmetric key pairs.
2. Public key registration in Supabase.
3. Conversation keys wrapped for each participant device.
4. Device verification/trust UX.
5. Key rotation and recovery design.
6. Group E2EE design for group chat if required.
