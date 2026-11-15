import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createClient } from '../../../../lib/supabase/server'
import { createAdminClient } from '../../../../lib/supabase/admin'
import { resourceIdPattern } from '../../../../lib/messaging/access'
import { createEnrollmentChallenge, importEnrollmentPublicKey, proofDigest } from '../../../../lib/e2ee/enrollment'

import { requireSensitiveSession, sensitiveOperationArgs, SensitiveSessionError } from '../../../../lib/e2ee/sensitive-session'
import { isolatedRecipientEnrollmentEnabled } from '../../../../lib/e2ee/isolated-config'

const reply = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
async function authenticate() {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return { response: reply({ error: 'Unauthorized' }, 401) }
  if (!isolatedRecipientEnrollmentEnabled()) return { response: reply({ error: 'Recipient enrollment requires isolated configuration.' }, 503) }
  if (user.is_anonymous || !user.email_confirmed_at) return { response: reply({ error: 'A confirmed Citizen account is required.' }, 403) }
  const { data: profile, error: profileError } = await client.from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (profileError || !profile) return { response: reply({ error: 'Citizen profile unavailable.' }, 403) }
  try {
    const sensitive = await requireSensitiveSession(client,user.id)
    return { client, user, sensitive }
  } catch(error) {
    const status=error instanceof SensitiveSessionError?error.status:503
    return { response:reply({ error:status===428?'Recent authenticator verification required.':'Sensitive session unavailable.' },status) }
  }
}
async function validProof(proof: unknown, expected: unknown) {
  if (typeof proof !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(proof) || typeof expected !== 'string' || !/^[0-9a-f]{64}$/.test(expected)) return false
  return timingSafeEqual(Buffer.from(await proofDigest(proof), 'hex'), Buffer.from(expected, 'hex'))
}
async function body(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Invalid request')
  let size = 0
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 8192) { await reader.cancel(); return null }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid request')
  return parsed as Record<string, unknown>
}
export async function GET(request: Request) {
  try {
    const auth = await authenticate()
    if (auth.response) return auth.response
    const { client, user } = auth
    const citizenId = new URL(request.url).searchParams.get('citizenId') || user.id
    if (!resourceIdPattern.test(citizenId)) return reply({ error: 'Invalid Citizen.' }, 400)
    if (citizenId !== user.id) {
      const { data, error } = await client.rpc('member_directory').eq('id', citizenId).maybeSingle()
      if (error || !data) return reply({ error: 'Citizen not found.' }, 404)
    }
    const { data: head, error } = await client.from('citizen_key_heads').select('revision, active_version').eq('citizen_id', citizenId).maybeSingle()
    if (error) return reply({ error: 'Recipient directory unavailable.' }, 503)
    if (!head) return reply({ citizenId, state: 'unenrolled', revision: 0 })
    if (!head.active_version) return reply({ citizenId, state: 'revoked', revision: head.revision })
    const { data: key, error: keyError } = await client.from('citizen_recipient_keys')
      .select('version,device_id,public_spki,fingerprint,revoked_at').eq('citizen_id', citizenId).eq('version', head.active_version).is('revoked_at', null).maybeSingle()
    const { data: fresh, error: freshError } = await client.from('citizen_key_heads').select('revision,active_version').eq('citizen_id', citizenId).maybeSingle()
    if (keyError || freshError) return reply({ error: 'Recipient directory unavailable.' }, 503)
    if (!key || !fresh || fresh.revision !== head.revision || fresh.active_version !== key.version) return reply({ error: 'Recipient key changed. Refresh before encrypting.' }, 409)
    const imported = await importEnrollmentPublicKey(key.public_spki)
    if (imported.keyId !== key.fingerprint) return reply({ error: 'Recipient identity verification failed.' }, 503)
    return reply({ citizenId, state: 'active', revision: fresh.revision, version: key.version, deviceId: key.device_id, publicSpki: imported.spki, keyId: imported.keyId, revokedAt: null })
  } catch { return reply({ error: 'Recipient directory unavailable.' }, 503) }
}
export async function POST(request: Request) {
  // Browser cookie authentication must not authorize cross-origin key mutations.
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')
  if ((origin !== null && origin !== new URL(request.url).origin) ||
      (fetchSite !== null && fetchSite !== 'same-origin' && fetchSite !== 'none')) {
    return reply({ error: 'Cross-origin enrollment requests are not allowed.' }, 403)
  }
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    return reply({ error: 'Enrollment requests require application/json.' }, 415)
  }
  try {
    const auth = await authenticate()
    if (auth.response) return auth.response
    const { user, sensitive } = auth
    if (request.headers.has('x-kc-citizen') && request.headers.get('x-kc-citizen') !== user.id) return reply({ error: 'Citizen session changed.' }, 403)
    let input: Record<string, unknown> | null
    try { input = await body(request) } catch { return reply({ error: 'Invalid enrollment request.' }, 400) }
    if (!input) return reply({ error: 'Enrollment request is too large.' }, 413)
    const allowed = input.action === 'approve' ? ['action','challengeId','priorProof'] : input.action === 'challenge' ? ['action','deviceId','publicSpki','expectedRevision'] : input.action === 'complete' ? ['action','challengeId','proof','priorProof'] : input.action === 'cancel' ? ['action','challengeId'] : input.action === 'revoke' ? ['action','expectedRevision'] : []
    if (!allowed.length || Object.keys(input).some(key => !allowed.includes(key))) return reply({ error: 'Invalid enrollment request.' }, 400)
    const admin = createAdminClient()
    if (input.action === 'cancel') {
      if (typeof input.challengeId !== 'string' || !resourceIdPattern.test(input.challengeId)) return reply({ error: 'Invalid challenge.' }, 400)
      const { data, error } = await admin.rpc('kc_sensitive_key_operation',sensitiveOperationArgs(user.id,sensitive,'cancel',{challenge_id:input.challengeId}))
      if (error || !data) return reply({ error: 'Pairing request unavailable or already closed.' }, 409)
      return reply({ success: true })
    }
    if (input.action === 'approve') {
      if (typeof input.challengeId !== 'string' || !resourceIdPattern.test(input.challengeId) || typeof input.priorProof !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(input.priorProof)) return reply({error:'Invalid approval.'},400)
      const {error}=await admin.rpc('kc_sensitive_key_operation',sensitiveOperationArgs(user.id,sensitive,'approve',{challenge_id:input.challengeId,prior_proof:input.priorProof}))
      if(error)return reply({error:'Approval unavailable or device authorization changed.'},409)
      return reply({success:true})
    }
    if (input.action === 'complete') {
      if (typeof input.challengeId !== 'string' || !resourceIdPattern.test(input.challengeId)) return reply({ error: 'Invalid challenge.' }, 400)
      const { data: challenge, error } = await admin.from('citizen_key_challenges').select('id,proof_hash,prior_proof_hash,expires_at,used_at,cancelled_at').eq('id', input.challengeId).eq('citizen_id', user.id).maybeSingle()
      if (error) return reply({ error: 'Enrollment service unavailable.' }, 503)
      if (!challenge) return reply({ error: 'Challenge not found.' }, 404)
      if (challenge.cancelled_at || challenge.used_at || Date.parse(challenge.expires_at) <= Date.now()) return reply({ error: 'Challenge expired or already used.' }, 409)
      if (!await validProof(input.proof, challenge.proof_hash) || (challenge.prior_proof_hash ? !await validProof(input.priorProof, challenge.prior_proof_hash) : input.priorProof != null)) return reply({ error: 'Private-key possession could not be verified.' }, 403)
      const { data, error: finishError } = await admin.rpc('kc_sensitive_key_operation',sensitiveOperationArgs(user.id,sensitive,'complete',{challenge_id:input.challengeId,proof:input.proof,prior_proof:input.priorProof || null}))
      if (finishError) return reply({ error: 'Enrollment conflict or expired challenge. Start again.' }, 409)
      return reply({ success: true, enrollment: data })
    }
    const expected = input.expectedRevision
    if (typeof expected !== 'number' || !Number.isInteger(expected) || expected < 0 || expected > 2_000_000_000) return reply({ error: 'Invalid key revision.' }, 400)
    if (input.action === 'revoke') {
      const { data, error } = await admin.rpc('kc_sensitive_key_operation',sensitiveOperationArgs(user.id,sensitive,'revoke',{expected_revision:expected}))
      if (error) return reply({ error: 'Key revision changed. Refresh before revoking.' }, 409)
      return reply({ success: true, enrollment: data })
    }
    if (typeof input.deviceId !== 'string' || !resourceIdPattern.test(input.deviceId)) return reply({ error: 'Invalid device.' }, 400)
    let imported
    try { imported = await importEnrollmentPublicKey(input.publicSpki) } catch { return reply({ error: 'Invalid public encryption key.' }, 400) }
    const { data: head, error: headError } = await admin.from('citizen_key_heads').select('revision,active_version').eq('citizen_id', user.id).maybeSingle()
    if (headError) return reply({ error: 'Enrollment service unavailable.' }, 503)
    if ((head?.revision || 0) !== expected) return reply({ error: 'Key revision changed. Refresh before enrollment.' }, 409)
    let prior
    if (expected > 0) {
      if (!head?.active_version) return reply({ error: 'A trusted device or approved recovery process is required.' }, 409)
      const { data: key, error } = await admin.from('citizen_recipient_keys').select('public_spki,fingerprint,revoked_at').eq('citizen_id', user.id).eq('version', head.active_version).maybeSingle()
      if (error || !key || key.revoked_at) return reply({ error: 'Current recipient identity unavailable.' }, 409)
      prior = await importEnrollmentPublicKey(key.public_spki)
      if (prior.keyId !== key.fingerprint || prior.keyId === imported.keyId) return reply({ error: 'Rotation identity is invalid.' }, 409)
    }
    const context = { challengeId: crypto.randomUUID(), citizenId: user.id, deviceId: input.deviceId, keyId: imported.keyId, expectedRevision: expected, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() }
    const created = await createEnrollmentChallenge(context, imported.key, prior?.key)
    const { error: challengeError } = await admin.rpc('kc_sensitive_key_operation',sensitiveOperationArgs(user.id,sensitive,'challenge',{ id: context.challengeId, citizen_id: user.id, device_id: context.deviceId, expected_revision: expected, public_spki: imported.spki, fingerprint: imported.keyId, proof_hash: created.proofHash, prior_fingerprint: created.challenge.priorKeyId, prior_proof_hash: created.priorProofHash, expires_at: context.expiresAt }))
    if (challengeError) return reply({ error: 'Could not start recipient enrollment.' }, 503)
    return reply(created.challenge, 201)
  } catch { return reply({ error: 'Recipient enrollment unavailable.' }, 503) }
}
