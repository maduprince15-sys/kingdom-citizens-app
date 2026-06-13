# Security Audit

Scope: Android Google login, Supabase auth route usage, privileged server APIs, private message storage, notifications, and private-message E2EE foundation.

Files inspected:

- `app/components/GoogleLoginButton.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/auth/callback/route.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `app/api/admin/update-role/route.ts`
- `app/api/admin/delete-user/route.ts`
- `app/api/announcements/create/route.ts`
- `app/api/posts/create/route.ts`
- `app/api/messages/send/route.ts`
- `app/api/messages/archive/route.ts`
- `app/messages/page.tsx`
- `app/messages/sent/page.tsx`
- `app/messages/[id]/page.tsx`
- `app/chat/ChatRoom.tsx`
- `.gitignore`

Fixed high risk issues:

- New private messages previously sent and stored plaintext in `app_messages.body`. New private-message bodies are now encrypted in the browser and the API rejects non-encrypted payloads.
- Message notifications no longer contain message subject/body preview text; they use `New encrypted message`.
- Google OAuth in the Android APK is guarded until a native return/deep-link flow is implemented. Web Google login remains enabled.

Fixed medium risk issues:

- Message detail reads are constrained to the authenticated sender or recipient.
- Message archive reads are constrained to the authenticated sender or recipient.
- Admin delete now blocks deleting owner/admin accounts through the admin delete route.

Confirmed:

- The Supabase service role key is only referenced by `lib/supabase/admin.ts` and server API routes.
- Client Supabase setup uses public/publishable configuration, not the service role key.
- Privileged APIs call `supabase.auth.getUser()` and then load server-side profile/role data before privileged writes.
- `.env*` is ignored by git.
- Public content is rendered as React text in inspected pages; no inspected route used `dangerouslySetInnerHTML`.

Deferred or still visible:

- Full multi-device E2EE is not complete. Device key registration, recipient key wrapping, key recovery, key rotation, and verified devices remain future work.
- Legacy private messages already stored in plaintext remain legacy plaintext until migrated or deleted.
- Group chat messages remain plaintext.
- Supabase RLS and storage bucket policies should still be reviewed in the Supabase dashboard as the database-level source of truth.
- Android debug APKs are debug signed; release distribution still needs a release signing workflow.

Supabase paths/tables touched by this work:

- `app_messages.body` stores ciphertext JSON for new private messages.
- `notifications.message` stores a generic encrypted-message notice.
- `profiles.role` is used for server-side authorization checks.

No OAuth tokens, service role keys, private message plaintext, provider tokens, or encryption keys should be logged or stored in normal client-readable fields by this implementation.
