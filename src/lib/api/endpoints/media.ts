import { customInstance } from '@/lib/api';
import type { MediaAsset, PresignedUploadInitRequest, PresignedUploadInitResponse, PresignedUploadCompleteRequest } from '../types';

// Public (unauthenticated) uploads — used for KYC during registration
export const mediaInitPublicUpload = (body: PresignedUploadInitRequest, signal?: AbortSignal): Promise<PresignedUploadInitResponse> =>
  customInstance({ url: '/media/uploads/public', method: 'POST', data: body, signal });

export const mediaCompletePublicUpload = (uploadId: string, body: PresignedUploadCompleteRequest, signal?: AbortSignal): Promise<MediaAsset> =>
  customInstance({ url: `/media/uploads/public/${uploadId}/complete`, method: 'POST', data: body, signal });

// Authenticated uploads
export const mediaInitUpload = (body: PresignedUploadInitRequest, signal?: AbortSignal): Promise<PresignedUploadInitResponse> =>
  customInstance({ url: '/media/uploads', method: 'POST', data: body, signal });

export const mediaCompleteUpload = (uploadId: string, body: PresignedUploadCompleteRequest, signal?: AbortSignal): Promise<MediaAsset> =>
  customInstance({ url: `/media/uploads/${uploadId}/complete`, method: 'POST', data: body, signal });

export const mediaGetAsset = (assetId: string, signal?: AbortSignal): Promise<MediaAsset> =>
  customInstance({ url: `/media/assets/${assetId}`, method: 'GET', signal });

export const mediaGetSignedDownloadUrl = (
  assetId: string,
  body: { expires_in_seconds?: number },
  signal?: AbortSignal
): Promise<{ url: string; expires_at: string }> =>
  customInstance({ url: `/media/assets/${assetId}/download-url`, method: 'POST', data: body, signal });

export const getMediaGetAssetQueryKey = (assetId: string) =>
  [`/media/assets/${assetId}`] as const;
