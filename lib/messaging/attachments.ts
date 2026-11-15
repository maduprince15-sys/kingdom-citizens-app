export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
export const PRIVATE_ATTACHMENT_BUCKET = 'citizen-private-attachments'
const types: Record<string, { extension: string; signature?: number[] }> = {
  'image/png': { extension: 'png', signature: [137, 80, 78, 71, 13, 10, 26, 10] },
  'image/jpeg': { extension: 'jpg', signature: [255, 216, 255] },
  'application/pdf': { extension: 'pdf', signature: [37, 80, 68, 70, 45] },
  'text/plain': { extension: 'txt' },
}
export function validateAttachment(bytes: Uint8Array, type: string) {
  const rule = types[type]
  if (!rule || bytes.length === 0 || bytes.length > MAX_ATTACHMENT_BYTES) return null
  if (rule.signature && !rule.signature.every((byte, index) => bytes[index] === byte)) return null
  if (!rule.signature) {
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      if (bytes.includes(0)) return null
    } catch { return null }
  }
  return rule.extension
}
export function attachmentType(extension: string) {
  return Object.entries(types).find(([, value]) => value.extension === extension)?.[0] || null
}
