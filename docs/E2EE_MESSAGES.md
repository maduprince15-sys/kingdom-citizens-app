# Private Message E2EE

New private messages now encrypt the message body in the browser before calling `/api/messages/send`.

Implemented:

- Client-side AES-GCM encryption for new private message bodies.
- The API accepts `encryptedBody` and rejects plaintext message body submissions.
- The existing `app_messages.body` column stores only ciphertext JSON for new private messages.
- Message notifications use the generic text `New encrypted message` instead of previewing message content.
- Inbox, sent, and message detail pages decrypt encrypted bodies on the client when the local key exists.
- Legacy plaintext messages are still displayed as legacy data so existing conversations do not disappear.

Visible metadata:

- Sender id and sender name.
- Recipient id.
- Subject.
- Created time.
- Read and archived state.
- Notification existence.
- Approximate message size through ciphertext length.

Not yet complete:

- This is not full production multi-device E2EE.
- Device public keys, recipient key wrapping, multi-device recovery, key rotation, and verified device identity are not implemented yet.
- A recipient on another device may see `Encrypted message - this device does not have the key.`
- Existing plaintext private messages are not migrated.
- Group chat messages in `chat_messages` remain plaintext and are outside this private-message E2EE pass.

Plaintext exclusion rule:

New private message plaintext must not be sent to `/api/messages/send`, stored in Supabase, included in notifications, or logged. The server validates that the submitted body is an encrypted payload with version `1`, algorithm `AES-GCM`, `ciphertext`, and `iv`.
