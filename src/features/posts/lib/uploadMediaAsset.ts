import type { PresignedUploadCompleteRequest, PresignedUploadInitRequest } from '@/lib/api/types'
import { mediaCompleteUpload, mediaInitUpload } from '@/lib/api/endpoints/media'

/**
 * Extract the list of header names that are part of the presigned URL signature.
 * R2/S3 embeds this as `X-Amz-SignedHeaders=content-type%3Bhost` in the URL.
 * We use this to ensure we send EXACTLY those headers — no more, no less.
 */
function getSignedHeaderNames(uploadUrl: string): Set<string> {
  try {
    const url = new URL(uploadUrl)
    const raw = url.searchParams.get('X-Amz-SignedHeaders') ?? ''
    return new Set(raw.split(';').map(h => h.toLowerCase()).filter(Boolean))
  } catch {
    return new Set()
  }
}

async function uploadFileToPresignedUrl(
  init: { upload_url: string; method: 'PUT' | 'POST'; headers: Array<{ name: string; value: string }>; content_type: string },
  file: File,
) {
  const signedHeaders = getSignedHeaderNames(init.upload_url)

  // Build a lookup from server-provided headers (lowercased names)
  const serverHeaders = new Map<string, string>()
  for (const h of init.headers ?? []) {
    serverHeaders.set(h.name.toLowerCase(), h.value)
  }

  const headers = new Headers()

  if (signedHeaders.size > 0) {
    // Only set headers that are part of the signature
    for (const name of signedHeaders) {
      if (name === 'host') continue // browser sets Host automatically; setting it is a no-op / forbidden

      if (serverHeaders.has(name)) {
        headers.set(name, serverHeaders.get(name)!)
      } else if (name === 'content-type') {
        // Use the exact content_type we sent to the server for signing
        headers.set('content-type', init.content_type)
      }
    }
  } else {
    // Fallback: no X-Amz-SignedHeaders found (non-AWS URL or older format)
    // Apply all server-provided headers and add content-type if not present
    for (const [name, value] of serverHeaders) {
      if (name !== 'host') headers.set(name, value)
    }
    if (!headers.has('content-type')) {
      headers.set('content-type', init.content_type)
    }
  }

  const resp = await fetch(init.upload_url, {
    method: init.method,
    headers,
    body: file,
  })

  if (!resp.ok) {
    // Read XML error body from R2/S3 for debugging
    let detail = ''
    try {
      const xml = await resp.text()
      const codeMatch = xml.match(/<Code>([^<]+)<\/Code>/)
      const msgMatch = xml.match(/<Message>([^<]+)<\/Message>/)
      detail = [codeMatch?.[1], msgMatch?.[1]].filter(Boolean).join(': ')
    } catch { /* ignore */ }
    throw new Error(`Upload failed ${resp.status}${detail ? ` — ${detail}` : ''}`)
  }

  return resp.headers.get('etag') ?? resp.headers.get('ETag') ?? undefined
}

export async function uploadMediaAsset(
  file: File,
  purpose: PresignedUploadInitRequest['purpose'],
): Promise<string> {
  const initReq: PresignedUploadInitRequest = {
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    purpose,
    access: 'public',
  }

  const initResp = await mediaInitUpload(initReq)
  const init = initResp

  const etag = await uploadFileToPresignedUrl(
    {
      upload_url: init.upload_url,
      method: init.method,
      headers: init.headers,
      content_type: initReq.content_type,
    },
    file,
  )

  const completeReq: PresignedUploadCompleteRequest = {
    etag: etag || undefined,
    size_bytes: file.size,
  }

  await mediaCompleteUpload(init.upload_id, completeReq)

  return init.asset_id
}
