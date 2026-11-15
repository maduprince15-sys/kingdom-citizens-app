# Secure messaging and attachment implementation — 15 November 2026

Existing development and Android beta branches only. Homepage/logo unchanged. No Production deployment, Supabase SQL, storage bucket, policies, account, or real member file changed.

## Implemented code (automated verification)

- Private-message send errors (including encryption and network failures) preserve drafts and release loading state. UI explicitly warns that other devices may not be able to open messages yet. Success is persistence, not read/decryption confirmation.
- Group-specific discussion route checks active group and current membership before reading. Server send derives sender identity/name/role from verified session/profile; membership is checked for `group:<uuid>` on every send. Study rooms require published public resources. RLS still applies to all operations.
- Group membership API permits global Owner/Admin or the assigned, current group leader. Assigned leaders can manage ordinary member/trainee memberships only; they cannot self-promote, elevate other leaders or manage unrelated groups. Group deletion is Owner/Admin-only and RLS-scoped. Existing membership/deletion UI calls these APIs; the member picker uses the filtered directory.
- Group message deletion additionally verifies current membership for group rooms. Removal prevents subsequent authorized reads/sends/downloads; already downloaded content cannot be recalled. Realtime isolation still depends on tested database RLS.
- Isolated-only private attachments: PNG, JPEG, PDF and UTF-8 text, **2 MiB** actual streamed byte limit, MIME/signature checks, generated UUID filenames, no client-controlled paths, no overwrite. No public/signed URLs. Downloads proxy bytes after fresh resource authorization and send no-store, nosniff, attachment and sandbox headers. Access is checked again before upload persistence.
- Storage metadata is inspected using an isolated server key to reject public/unbounded/misconfigured buckets; actual IO uses the authenticated caller, never the admin client. Message participants and active group members are the only application-authorized users. Storage RLS must independently enforce the same rule for direct API access.

## Isolated attachment setup — PENDING, not applied

Create a **separate synthetic test Supabase project**; never reuse the known live project. Configure a private bucket named `citizen-private-attachments`, with max file size 2 MiB and MIME allowlist exactly PNG/JPEG/PDF/text. Existing files must remain synthetic. Do not use `content-media`, public URLs, permissive authenticated-wide policies or an admin client for file IO.

Server opt-in requires all of:

- `KC_PRIVATE_ATTACHMENTS_ENABLED=isolated-test-only`
- `KC_ISOLATED_TEST_PROJECT_REF` matching the configured `NEXT_PUBLIC_SUPABASE_URL` exactly
- environment not `VERCEL_ENV=production`; known Production Supabase ref is explicitly rejected
- isolated `SUPABASE_SERVICE_ROLE_KEY` for bucket metadata inspection only
- actual table/storage policies verified with ordinary A/B accounts before enabling UI for testing

Storage policies need both SELECT and INSERT predicates tied to path segments `messages/<message-uuid>/<file-uuid.ext>` or `groups/<group-uuid>/<file-uuid.ext>`. For messages require the current `auth.uid()` to equal sender or recipient of the referenced row; for groups require an active group and a current membership for `auth.uid()`. INSERT must also require the uploader's storage owner ID. No UPDATE/upsert or delete API is implemented. Reject arbitrary scope/path segments. Inspect all existing policies for permissive OR combinations; do not copy an unreviewed policy template into Production.

For groups, `chat_messages` SELECT/INSERT/UPDATE and realtime access must independently check current active membership for `group:<uuid>`; INSERT must bind `sender_id=auth.uid()`. Membership writes must implement the same assigned-leader/staff rule as the server API, forbid self-elevation and preserve `profiles.role`. API tests alone cannot prove direct Data API isolation. No live policy installation was attempted.

## Recipient decryption — BLOCKED by architecture

The existing cipher stores a sender-device AES key in browser local storage, with `recipientDeviceId: 'not-wrapped-yet'`. There is no per-Citizen public-key directory, recipient key wrapping, authenticated key rotation, multi-device enrollment/revocation/recovery, or legacy key ownership proof. Sharing raw AES keys, accepting user-metadata keys or relabeling local device encryption as E2EE would not fix this.

No insecure key shortcut or plaintext fallback was added. Cross-device recipient decryption remains BLOCKED. Ordinary Citizen-to-Citizen send is still denied by the existing board-recipient rule pending that design and isolated RLS validation; this is an unmet feature, not a successful integration test. Existing supported authorized recipient/reply paths are preserved.

## Two-Citizen integration runner

`npm run test:two-citizen` uses only explicit `KC_TEST_*` configuration and exits **2 / BLOCKED** when absent. It rejects the known Production project and requires `KC_INTEGRATION_OPT_IN=synthetic-isolated-only`, matching `KC_TEST_SUPABASE_URL`, `KC_ISOLATED_TEST_PROJECT_REF`, `KC_TEST_SUPABASE_PUBLISHABLE_KEY`, and distinct genuine synthetic account A/B emails/passwords. It never falls back to application env.

With configured ordinary test accounts it checks independent password sign-in/verified identity/refresh/logout, profile isolation and directory contact filtering. Optional `KC_TEST_REGISTER_CITIZENS=create-synthetic-only` attempts registration; confirmation-required email is reported BLOCKED, never invented as passed. Google/confirmation/recovery need controlled inbox/browser fixtures. Direct unauthorized mutation, messaging/decryption and attachment RLS probes remain separate isolated acceptance gates, with mocked regression coverage in the meantime. No credentials/tokens/private rows are printed.

Preview metadata inspection found branch-scoped public Supabase URL/publishable-key names, but not an available isolated-test opt-in, server bucket configuration or genuine account fixtures. Values were not exposed. The local runner correctly reported BLOCKED. No Production access was used to fill gaps.

## Release gates

Run behavioral/security suites, TypeScript, full lint and production-mode build; verify exact pushed Actions/Preview. Update the existing beta branch and pin one immutable Preview candidate. APK checksum/install claims require actual downloaded bytes. Prior artifact retrieval failed at the network proxy's CONNECT tunnel to GitHub's Azure host (403), not an expired artifact. Recheck the new candidate once without exposing signed URLs. No manual device testing requested at this stage.
