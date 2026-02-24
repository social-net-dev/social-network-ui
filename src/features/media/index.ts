// ===========================
// 🎯 MEDIA FEATURE EXPORTS
// ===========================

export {
  // Core hooks
  useMediaAsset,
  useMediaSignedUrl,
  useMediaBlob,
  useMediaBlobs,
  useMedia,

  // Utility functions
  getMediaDisplayUrl,
  isImageMedia,
  isVideoMedia,
} from './hooks/useMedia';

// ===========================
// 🎯 RE-EXPORT GENERATED TYPES
// ===========================

export type {
  MediaAssetSummary,
  MediaAsset,
  MediaStreamParams,
  PresignedUploadInitRequest,
  PresignedUploadCompleteRequest,
} from '@/lib/api/generated/model';

// ===========================
// 🎯 RE-EXPORT GENERATED API FUNCTIONS
// ===========================

export {
  // Queries
  mediaGetAsset,
  getMediaGetAssetQueryKey,
  getMediaGetAssetQueryOptions,
  useMediaGetAsset,

  mediaStream,
  getMediaStreamQueryKey,
  getMediaStreamQueryOptions,
  useMediaStream,

  // Mutations
  mediaInitUpload,
  getMediaInitUploadMutationOptions,
  useMediaInitUpload,

  mediaCompleteUpload,
  getMediaCompleteUploadMutationOptions,
  useMediaCompleteUpload,

  mediaInitPublicUpload,
  getMediaInitPublicUploadMutationOptions,
  useMediaInitPublicUpload,

  mediaCompletePublicUpload,
  getMediaCompletePublicUploadMutationOptions,
  useMediaCompletePublicUpload,

  mediaGetSignedDownloadUrl,
  getMediaGetSignedDownloadUrlMutationOptions,
  useMediaGetSignedDownloadUrl,
} from '@/lib/api/generated/media/media';
