import { http, HttpResponse, delay } from 'msw';

function createUploadId(): string {
  return `upl_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createAssetId(): string {
  return `ast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const mediaHandlers = [
  http.post('*/media/uploads/public', async ({ request }) => {
    await delay(400);

    const body = (await request.json().catch(() => ({}))) as {
      filename?: string;
      content_type?: string;
      size_bytes?: number;
    };

    const upload_id = createUploadId();
    const asset_id = createAssetId();

    return HttpResponse.json({
      success: true,
      data: {
        upload_id,
        asset_id,
        method: 'PUT',
        upload_url: `https://mock-r2.local/upload/${upload_id}`,
        headers: [
          { name: 'Content-Type', value: body.content_type ?? 'application/octet-stream' },
        ],
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      request_id: `req_${Date.now()}`,
    });
  }),

  http.put('https://mock-r2.local/upload/:uploadId', async () => {
    await delay(200);
    return new HttpResponse(null, {
      status: 200,
      headers: {
        etag: `etag-${Date.now()}`,
      },
    });
  }),

  http.post('*/media/uploads/public/:uploadId/complete', async ({ params, request }) => {
    await delay(250);

    const { uploadId } = params;
    const body = (await request.json().catch(() => ({}))) as {
      size_bytes?: number;
    };

    return HttpResponse.json({
      success: true,
      data: {
        id: `asset_from_${String(uploadId)}`,
        type: 'image',
        access: 'public',
        content_type: 'image/*',
        size_bytes: body.size_bytes,
        status: 'ready',
        createdAt: new Date().toISOString(),
      },
      request_id: `req_${Date.now()}`,
    });
  }),
];
