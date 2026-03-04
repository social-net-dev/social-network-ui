// ─── Media Asset ───────────────────────────────────────────────────────────────

export interface MediaAssetSummary {
  id: string;
  type: 'image' | 'video' | 'file';
  access: 'public' | 'private';
  cdn_url?: string;
  original_url?: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  content_type?: string;
  size_bytes?: number;
}

export interface MediaAsset extends MediaAssetSummary {
  status: 'pending' | 'ready' | 'failed';
  created_at: string;
}

// ─── Upload ────────────────────────────────────────────────────────────────────

export interface NameValueHeader {
  name: string;
  value: string;
}

export interface PresignedUploadInitRequest {
  filename: string;
  content_type: string;
  size_bytes: number;
  checksum_sha256?: string;
  purpose?: 'post' | 'comment' | 'avatar' | 'background' | 'kyc';
  access?: 'public' | 'private';
}

export interface PresignedUploadInitResponse {
  upload_id: string;
  asset_id: string;
  method: 'PUT' | 'POST';
  upload_url: string;
  headers: NameValueHeader[];
  expires_at: string;
}

export interface PresignedUploadCompleteRequest {
  etag?: string;
  size_bytes?: number;
}
