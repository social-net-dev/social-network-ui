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
  PresignedUploadInitRequest,
  PresignedUploadCompleteRequest,
} from '@/lib/api/types';

// ===========================
// 🎯 RE-EXPORT GENERATED API FUNCTIONS
// ===========================

export {
  // Raw endpoint functions
  mediaGetAsset,
  getMediaGetAssetQueryKey,
  mediaInitUpload,
  mediaCompleteUpload,
  mediaInitPublicUpload,
  mediaCompletePublicUpload,
  mediaGetSignedDownloadUrl,
} from '@/lib/api/endpoints/media';

export {
  // React Query hooks
  useMediaGetAsset,
  useMediaInitUpload,
  useMediaCompleteUpload,
  useMediaInitPublicUpload,
  useMediaCompletePublicUpload,
  useMediaGetSignedDownloadUrl,
} from '@/lib/api/hooks/media.hooks';
