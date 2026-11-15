import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { isolatedConfigurationReady, privateReadDenied } from './lib/integration-safety.mjs'

// Opt-in integration runner. Never falls back to application/Production env.
const url = process.env.KC_TEST_SUPABASE_URL
const key = process.env.KC_TEST_SUPABASE_PUBLISHABLE_KEY
const accounts = ['A', 'B'].map(name => ({ email: process.env[`KC_TEST_CITIZEN_${name}_EMAIL`], password: process.env[`KC_TEST_CITIZEN_${name}_PASSWORD`] }))
if (!isolatedConfigurationReady(process.env)) {
  console.log('BLOCKED: explicit isolated project, publishable key, opt-in and two genuine synthetic accounts required.')
  process.exit(2)
}
const clients = accounts.map(() => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }))
const report = []
try {
  const users = []
  const refreshTokens = []
  for (let index = 0; index < 2; index++) {
    if (process.env.KC_TEST_REGISTER_CITIZENS === 'create-synthetic-only') {
      const { data, error } = await clients[index].auth.signUp(accounts[index])
      assert.equal(error, null, 'Synthetic registration failed')
      if (!data.session) {
        report.push({ check: `Citizen ${index === 0 ? 'A' : 'B'} registration`, status: 'BLOCKED', reason: 'Email confirmation required; no inbox verification invented.' })
        throw new Error('CONFIRMATION_REQUIRED')
      }
    }
    const { data, error } = await clients[index].auth.signInWithPassword(accounts[index])
    assert.equal(error, null, 'Test-account password sign-in failed')
    const verified = await clients[index].auth.getUser()
    assert.equal(verified.error, null)
    assert.ok(verified.data.user)
    users.push(verified.data.user)
    const refreshed = await clients[index].auth.refreshSession()
    assert.equal(refreshed.error, null, 'Session refresh failed')
    assert.equal(refreshed.data.user.id, data.user.id)
    refreshTokens.push(refreshed.data.session.refresh_token)
  }
  assert.notEqual(users[0].id, users[1].id, 'Two distinct Citizens are required')
  report.push({ check: 'Independent A/B password sessions and refresh', status: 'READY' })
  for (let index = 0; index < 2; index++) {
    const otherId = users[1 - index].id
    const own = await clients[index].from('profiles').select('id, role').eq('id', users[index].id).single()
    assert.equal(own.error, null)
    assert.equal(own.data.role, 'member', 'Integration probes require ordinary synthetic Citizens, not staff')
    const other = await clients[index].from('profiles').select('id, email, phone').eq('id', otherId)
    assert.ok(privateReadDenied(other), 'Other Citizen private profile is exposed')
    const directory = await clients[index].rpc('member_directory')
    assert.equal(directory.error, null, 'Member directory unavailable')
    assert.ok(!directory.data?.some(row => row.id !== users[index].id && (row.email || row.phone)), 'Directory discloses other Citizen contact details')
    report.push({ check: `Citizen ${index === 0 ? 'A' : 'B'} profile/directory isolation`, status: 'READY' })
  }
  for (const [index, client] of clients.entries()) {
    assert.equal((await client.auth.signOut({ scope: 'local' })).error, null)
    assert.equal((await client.auth.getSession()).data.session, null)
    const probe = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    assert.ok((await probe.auth.refreshSession({ refresh_token: refreshTokens[index] })).error, 'Logged-out refresh token remains valid')
  }
  report.push({ check: 'Both local sessions sign out and refresh tokens are revoked', status: 'READY' })
  for (const check of ['Confirmation/recovery inbox verification', 'Google provider browser round trip', 'Direct profile/role mutation RLS probes', 'Citizen recipient enrollment/decryption', 'Group membership/realtime and attachment service isolation']) {
    report.push({ check, status: 'BLOCKED', reason: 'Controlled inbox/browser or isolated service fixtures required; local tests do not replace live proof.' })
  }
  console.log(JSON.stringify(report, null, 2))
  if (report.some(check => check.status === 'BLOCKED')) process.exitCode = 2
} catch (error) {
  if (error.message === 'CONFIRMATION_REQUIRED') {
    console.log(JSON.stringify(report, null, 2))
    process.exitCode = 2
  } else {
    console.error('FAILED: isolated two-Citizen integration assertion. No tokens, credentials or private rows are printed.')
    process.exitCode = 1
  }
} finally {
  await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })))
}
