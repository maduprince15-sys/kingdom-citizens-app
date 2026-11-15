# Isolated migration and security verification

Status: hosted execution BLOCKED. No database was changed to prepare this procedure. Do not use Production, real Citizen data, or the unrelated inactive project.

## Preconditions and order

Provision an explicitly authorized disposable Supabase project, synthetic A/B/C accounts with ordinary roles and confirmed controlled inboxes, and a protected **stable HTTPS isolated Preview origin**. Configure Google provider/native beta allowlists and verified TOTP factors through supported Supabase account flows. Keep TOTP seeds/codes, passwords, database credentials and server keys private; never put them in issues, shell arguments or `NEXT_PUBLIC_*` variables. Do not weaken Preview protection.

Prepare the existing application schema using reviewed schema definitions, not a Production dump: `profiles`, `member_directory`, private messages, active groups/membership and Supabase Storage. Their actual RLS/grants must already enforce ownership. Verify Auth provides `auth.sessions(id,user_id,not_after)` and the trusted migration owner can lock those rows. Do not edit Auth tables/schema or grant them to ordinary clients.

Review and apply only this ordered set after all prerequisites are present:

1. `20261115115146_isolated_private_attachment_policies.sql` — existing source/Storage RLS, private 2 MiB MIME-limited bucket.
2. `20261115125432_isolated_recipient_key_enrollment.sql` — profile RLS, immutable key registry and possession/CAS operations.
3. `20261115161155_isolated_pairing_cancellation.sql` — terminal challenge lifecycle.
4. `20261115164408_isolated_sensitive_session_operations.sql` — live-session locks, server-bound trusted approval receipts, recent MFA/expiry checks and removal of legacy service mutation bypasses.

The last function is an intentional privileged bridge to private `auth.sessions`, not a general RLS workaround: fixed operation whitelist, canonical server-derived actor/session/verified timestamps, empty search path and execute privilege only for service_role. Ordinary roles and direct service mutations remain denied. Review its trusted owner and function ACL. Do not grant ordinary clients execute or table access to resolve an error.

## Controlled execution

Use a private libpq service named `kingdom_isolated` with a protected `PGSERVICEFILE` and `PGPASSFILE`; credentials must not appear in the command line. Before connecting, manually verify its **host is exactly `db.<authorized-isolated-ref>.supabase.co`**, the ref is not the known Production ref, and it matches the offline validator's isolated URL/ref. Do not use a default connection, ambiguous pooler target or guessed credentials. Offline validator acceptance is not proof of the database destination.

Run `npm run test:two-citizen:config` for the ordinary-client environment, then `node scripts/check-isolated-migrations.mjs`. The latter is offline by default: it requires absolute owner-only service/password files, an exact isolated direct host, postgres migration owner and verify-full TLS, and rejects ambiguous/duplicate/override service entries. No connection or schema success is implied by passing preflight.

After reviewing the exact four files and obtaining explicit isolated deployment authorization, the operator may set `KC_ISOLATED_MIGRATION_OPT_IN=reviewed-synthetic-only` privately and run:

```sh
node scripts/check-isolated-migrations.mjs --apply
```

The wrapper revalidates the destination, clears PG environment overrides, passes no secrets as arguments, and invokes psql with `ON_ERROR_STOP`, a single transaction, the synthetic-only guard and the four files in the order above. It never uses a default database connection. The command without `--apply` is always offline.

This repository has never run that hosted command. A dedicated deployment/migration-history mechanism must record the exact reviewed files/checksums in the test project; this explicit procedure does not pretend to create Supabase CLI migration history. Never blindly `db push` the whole directory or reapply already-recorded CREATE statements.

## Verification and required evidence

Run the read-only metadata probe:

```sh
psql 'service=kingdom_isolated' -X -v ON_ERROR_STOP=1 -f scripts/sql/verify-isolated-key-security.sql
npm run test:two-citizen
```

The metadata probe checks RLS, privileged execute boundaries, legacy bypass denial and private bucket metadata. It does not prove API/Storage behavior. The existing ordinary A/B/C runner checks password sessions, refresh/logout and all six cross-profile privacy directions; missing provider/MFA/pairing/message/Storage fixtures remain explicitly BLOCKED. Do not use elevated keys to simulate ordinary Citizens.

In the isolated protected Preview, authenticate A/B/C with separate browser contexts and record redacted status/result evidence, exact commit/Preview/schema versions, ordinary role assertions and synthetic resource IDs. Obtain recent TOTP MFA for sensitive endpoints. Validate:

- Own session exists: allow sensitive checks. After actual supported sign-out removes that session, replay its unexpired token: reject. Expired token/not_after, stale MFA, wrong Citizen/session and revoked trusted approval session: reject. Exercise real separate database connections for mutation/revocation races. Supabase inactivity/single-session cleanup is not inherently immediate; verify actual project settings and do not overstate the guarantee.
- Pairing challenge is bound to the authenticated Citizen and requires new and current device possession. Trusted approval must be recorded through the MFA/session-checked endpoint. Cancel, expire, replay, revoke old device, revoke approval session and concurrent completion: no unauthorized activation.
- A↔B encrypted exchange/C denial and groups remain release gates; messages stay disabled until complete recipient/device-set authorization is verified. Do not infer success from a profile test.
- Private Storage: A uploads only an owned path, B downloads only as current authorized participant, C/anonymous cannot read/write/delete, B cannot delete A's file, uploader loses access when removed, group removal prevents further access, forged paths/owner IDs and oversize/disallowed MIME are rejected. Use only synthetic tiny files. Inspect actual network Storage responses; local SQL fixtures are not Storage service evidence. Keep application attachments disabled until these pass.
- Lock/refresh/logout/account switch/backgrounding/restart require explicit key unlock; verify TOTP failure, unavailable factors and auth-network failure. Android WebView and provider callbacks require genuine isolated acceptance, not APK compilation. Immutable Preview URL changes switch IndexedDB origin; no key continuity claim across updates without stable isolated hosting.

Do not put JWTs, approval proofs, TOTP codes/seeds, keys or private message text into evidence. Checksum only actually retrieved APK bytes.

## Rollback and recovery

If the transaction fails, `ON_ERROR_STOP` and the single transaction roll back the whole batch. Preserve error/schema evidence without secrets and fix a forward migration in development. If a committed isolated deployment fails acceptance, disable the isolated enrollment flag and keep messaging/attachments off; invalidate synthetic sessions using supported Auth sign-out controls. Restore the disposable test project from its own synthetic snapshot or recreate the approved isolated fixture after operator review. Never restore Production data, delete retained device keys silently, regrant legacy bypasses, disable RLS or relax MFA to make tests pass. Do not drop Auth-managed objects. Existing ciphertext cannot be recovered after key loss without actual retained/recovery material.
