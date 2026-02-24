import type { PresignedUploadCompleteRequest, PresignedUploadInitRequest } from '@/lib/api/generated/model'
import { mediaCompleteUpload, mediaInitUpload } from '@/lib/api/generated/media/media'

async function uploadFileToPresignedUrl(
  init: { upload_url: string; method: 'PUT' | 'POST'; headers: Array<{ name: string; value: string }> },
  file: File,
) {
  const headers = new Headers()
  for (const h of init.headers ?? []) {
    headers.set(h.name, h.value)
  }
  if (!headers.has('Content-Type') && file.type) {
    headers.set('Content-Type', file.type)
  }

  const resp = await fetch(init.upload_url, {
    method: init.method,
    headers,
    body: file,
  })

  if (!resp.ok) {
    throw new Error(`Upload failed: ${resp.status}`)
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
  const init = initResp.data

  const etag = await uploadFileToPresignedUrl(
    {
      upload_url: init.upload_url,
      method: init.method,
      headers: init.headers,
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
