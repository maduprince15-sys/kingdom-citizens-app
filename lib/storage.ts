export function getStoragePathFromPublicUrl(
  publicUrl: string | null | undefined,
  bucket = 'content-media'
) {
  if (!publicUrl) return null

  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = url.pathname.indexOf(marker)

    if (index === -1) return null

    return decodeURIComponent(url.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}