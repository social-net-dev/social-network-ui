import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { MediaAsset, PresignedUploadInitRequest, PresignedUploadInitResponse, PresignedUploadCompleteRequest, ApiError } from '../types';
import {
  mediaInitPublicUpload,
  mediaCompletePublicUpload,
  mediaInitUpload,
  mediaCompleteUpload,
  mediaGetAsset,
  mediaGetSignedDownloadUrl,
  getMediaGetAssetQueryKey,
} from '../endpoints/media';

export { getMediaGetAssetQueryKey } from '../endpoints/media';

export const useMediaGetAsset = <TData = MediaAsset>(
  assetId: string,
  options?: Omit<UseQueryOptions<MediaAsset, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getMediaGetAssetQueryKey(assetId), queryFn: ({ signal }) => mediaGetAsset(assetId, signal), ...options });

export const useMediaInitPublicUpload = (
  options?: UseMutationOptions<PresignedUploadInitResponse, ApiError, PresignedUploadInitRequest>
) =>
  useMutation({ mutationFn: (data) => mediaInitPublicUpload(data), mutationKey: ['mediaInitPublicUpload'], ...options });

export const useMediaCompletePublicUpload = (
  options?: UseMutationOptions<MediaAsset, ApiError, { uploadId: string; data: PresignedUploadCompleteRequest }>
) =>
  useMutation({ mutationFn: ({ uploadId, data }) => mediaCompletePublicUpload(uploadId, data), mutationKey: ['mediaCompletePublicUpload'], ...options });

export const useMediaInitUpload = (
  options?: UseMutationOptions<PresignedUploadInitResponse, ApiError, PresignedUploadInitRequest>
) =>
  useMutation({ mutationFn: (data) => mediaInitUpload(data), mutationKey: ['mediaInitUpload'], ...options });

export const useMediaCompleteUpload = (
  options?: UseMutationOptions<MediaAsset, ApiError, { uploadId: string; data: PresignedUploadCompleteRequest }>
) =>
  useMutation({ mutationFn: ({ uploadId, data }) => mediaCompleteUpload(uploadId, data), mutationKey: ['mediaCompleteUpload'], ...options });

export const useMediaGetSignedDownloadUrl = (
  options?: UseMutationOptions<{ url: string; expires_at: string }, ApiError, { assetId: string; expires_in_seconds?: number }>
) =>
  useMutation({ mutationFn: ({ assetId, expires_in_seconds }) => mediaGetSignedDownloadUrl(assetId, { expires_in_seconds }), mutationKey: ['mediaGetSignedDownloadUrl'], ...options });
