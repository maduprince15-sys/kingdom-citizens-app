import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import { canAccessResource, isolatedAttachmentsEnabled, resourceIdPattern, type AttachmentScope } from '../../../lib/messaging/access'
import { MAX_ATTACHMENT_BYTES, PRIVATE_ATTACHMENT_BUCKET, validateAttachment, attachmentType } from '../../../lib/messaging/attachments'

async function authorize(request: Request) {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isolatedAttachmentsEnabled()) return { response: NextResponse.json({ error: 'Private attachments are not configured for isolated testing.' }, { status: 503 }) }
  const params = new URL(request.url).searchParams
  const scope = params.get('scope')
  const id = params.get('id') || ''
  if ((scope !== 'messages' && scope !== 'groups') || !resourceIdPattern.test(id)) {
    return { response: NextResponse.json({ error: 'Invalid conversation.' }, { status: 400 }) }
  }
  if (!await canAccessResource(client, user.id, scope as AttachmentScope, id)) {
    return { response: NextResponse.json({ error: 'Conversation not found.' }, { status: 404 }) }
  }
  // Verify the bucket itself is private before accepting any files. The
  // isolated server key is used only for configuration inspection, never IO.
  try {
    const { data, error } = await createAdminClient().storage.getBucket(PRIVATE_ATTACHMENT_BUCKET)
    if (error || !data || data.public || !data.file_size_limit || Number(data.file_size_limit) > MAX_ATTACHMENT_BYTES ||
        !data.allowed_mime_types?.length || data.allowed_mime_types.some(type => !['image/png', 'image/jpeg', 'application/pdf', 'text/plain'].includes(type))) {
      return { response: NextResponse.json({ error: 'Private attachment storage is not configured safely.' }, { status: 503 }) }
    }
  } catch {
    return { response: NextResponse.json({ error: 'Private attachment storage is unavailable.' }, { status: 503 }) }
  }
  return { client, user, prefix: `${scope}/${id}` }
}

async function uploadAttachment(request: Request) {
  const access = await authorize(request)
  if (access.response) return access.response
  const mime = request.headers.get('content-type')?.split(';')[0] || ''
  if (!attachmentType(({ 'image/png': 'png', 'image/jpeg': 'jpg', 'application/pdf': 'pdf', 'text/plain': 'txt' } as Record<string, string>)[mime] || '')) {
    return NextResponse.json({ error: 'Unsupported file type.' }, { status: 415 })
  }
  // Bound the stream even when Content-Length is absent or dishonest.
  const reader = request.body?.getReader()
  if (!reader) return NextResponse.json({ error: 'File is required.' }, { status: 400 })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_ATTACHMENT_BYTES) {
        await reader.cancel()
        return NextResponse.json({ error: 'Maximum attachment size is 2 MB.' }, { status: 413 })
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
    const extension = validateAttachment(bytes, mime)
    if (!extension) return NextResponse.json({ error: 'Invalid or unsupported file.' }, { status: 415 })
    // Original filenames and client paths are never trusted or persisted.
    const name = `${access.user!.id}_${crypto.randomUUID()}.${extension}`
    // Recheck membership after reading the request, immediately before storage access.
    const [scope, id] = access.prefix!.split('/')
    if (!await canAccessResource(access.client!, access.user!.id, scope as AttachmentScope, id)) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 })
    }
    const { error } = await access.client!.storage.from(PRIVATE_ATTACHMENT_BUCKET)
      .upload(`${access.prefix}/${name}`, bytes, { contentType: mime, upsert: false })
    if (error) return NextResponse.json({ error: 'Could not save the attachment.' }, { status: 503 })
    return NextResponse.json({ name }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json({ error: 'Could not upload the attachment.' }, { status: 503 })
  } finally { reader.releaseLock() }
}

async function getAttachments(request: Request) {
  const access = await authorize(request)
  if (access.response) return access.response
  const name = new URL(request.url).searchParams.get('name')
  const bucket = access.client!.storage.from(PRIVATE_ATTACHMENT_BUCKET)
  if (!name) {
    const { data, error } = await bucket.list(access.prefix, { limit: 100 })
    if (error) return NextResponse.json({ error: 'Could not load attachments.' }, { status: 503 })
    if (!await freshResourceAccess(access)) return resourceUnavailable()
    return NextResponse.json({ files: data?.map(file => ({ name: file.name })) || [] }, { headers: { 'Cache-Control': 'private, no-store' } })
  }
  const match = name.match(/^([0-9a-f-]{36})_([0-9a-f-]{36})\.(png|jpg|pdf|txt)$/i)
  if (!match || !resourceIdPattern.test(match[1]) || !resourceIdPattern.test(match[2])) return NextResponse.json({ error: 'Invalid attachment.' }, { status: 400 })
  // Proxy bytes after fresh authorization, rather than issuing reusable public/signed URLs.
  const { data, error } = await bucket.download(`${access.prefix}/${name}`)
  if (error || !data) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 })
  if (data.size > MAX_ATTACHMENT_BYTES) return NextResponse.json({ error: 'Attachment exceeds the size limit.' }, { status: 413 })
  if (!await freshResourceAccess(access)) return resourceUnavailable()
  return new Response(data, { headers: {
    'Content-Type': attachmentType(match[3].toLowerCase())!,
    'Content-Disposition': `attachment; filename="${name}"`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cache-Control': 'private, no-store',
  } })
}

async function deleteAttachment(request: Request) {
  const access = await authorize(request)
  if (access.response) return access.response
  const name = new URL(request.url).searchParams.get('name') || ''
  const match = name.match(/^([0-9a-f-]{36})_([0-9a-f-]{36})\.(png|jpg|pdf|txt)$/i)
  if (!match || !resourceIdPattern.test(match[1]) || !resourceIdPattern.test(match[2])) return NextResponse.json({ error: 'Invalid attachment.' }, { status: 400 })
  if (match[1] !== access.user!.id) return NextResponse.json({ error: 'Only the uploader can delete this attachment.' }, { status: 403 })
  if (!await freshResourceAccess(access)) return resourceUnavailable()
  const { data, error } = await access.client!.storage.from(PRIVATE_ATTACHMENT_BUCKET).remove([`${access.prefix}/${name}`])
  if (error) return NextResponse.json({ error: 'Could not delete the attachment.' }, { status: 503 })
  if (!data?.length) return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 })
  return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'private, no-store' } })
}

function resourceUnavailable() {
  return NextResponse.json({ error: 'Conversation not found.' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } })
}
async function freshResourceAccess(access: Awaited<ReturnType<typeof authorize>>) {
  if (!access.client || !access.user || !access.prefix) return false
  const [scope, id] = access.prefix.split('/')
  return canAccessResource(access.client, access.user.id, scope as AttachmentScope, id)
}
async function safelyHandle(handler: (request: Request) => Promise<Response>, request: Request) {
  try { return await handler(request) }
  catch { return NextResponse.json({ error: 'Attachment service temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } }) }
}
export function POST(request: Request) { return safelyHandle(uploadAttachment, request) }
export function GET(request: Request) { return safelyHandle(getAttachments, request) }
export function DELETE(request: Request) { return safelyHandle(deleteAttachment, request) }
