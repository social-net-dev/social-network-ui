import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mediaGetAsset,
  getMediaGetAssetQueryKey,
  getMediaGetSignedDownloadUrlMutationOptions,
  mediaStream,
  getMediaStreamQueryKey,
} from '@/lib/api/generated/media/media';
import type {
  MediaAssetSummary,
  MediaStreamParams,
  MediaGetSignedDownloadUrlBody,
} from '@/lib/api/generated/model';
import { useState, useEffect, useMemo, useCallback } from 'react';

// ===========================
// 🎯 UTILITY FUNCTIONS
// ===========================

/**
 * Extract path from URL for mediaStream API.
 * - Full URLs (http...): extract path after origin
 * - Relative paths: use as-is
 */
function extractPath(url: string): string {
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  }
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * Get appropriate URL for media display from MediaAssetSummary
 * Priority: cdn_url > original_url > fallback
 */
export function getMediaDisplayUrl(
  media: MediaAssetSummary,
  options?: { useThumbnail?: boolean }
): string | undefined {
  if (options?.useThumbnail && media.thumbnail_url) {
    return media.thumbnail_url;
  }
  return media.cdn_url || media.original_url;
}

/**
 * Check if media is an image based on type or content_type
 */
export function isImageMedia(media: MediaAssetSummary): boolean {
  if (media.type === 'image') return true;
  if (media.content_type?.startsWith('image/')) return true;
  return false;
}

/**
 * Check if media is a video based on type or content_type
 */
export function isVideoMedia(media: MediaAssetSummary): boolean {
  if (media.type === 'video') return true;
  if (media.content_type?.startsWith('video/')) return true;
  return false;
}

// ===========================
// 🎯 HOOKS
// ===========================

/**
 * Hook to fetch media asset metadata by assetId
 * Uses Orval-generated mediaGetAsset
 */
export function useMediaAsset(assetId: string | null | undefined) {
  return useQuery({
    queryKey: assetId ? getMediaGetAssetQueryKey(assetId) : ['media-asset', 'empty'],
    queryFn: async () => {
      if (!assetId) return null;
      const response = await mediaGetAsset(assetId);
      return response.data;
    },
    enabled: !!assetId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get signed download URL for a media asset
 * Uses Orval-generated mediaGetSignedDownloadUrl
 */
export function useMediaSignedUrl() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...getMediaGetSignedDownloadUrlMutationOptions(),
    onSuccess: () => {
      // Invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['/media'] });
    },
  });

  const getSignedUrl = useCallback(
    async (assetId: string, expiresInSeconds?: number): Promise<string | null> => {
      try {
        const body: MediaGetSignedDownloadUrlBody = expiresInSeconds
          ? { expires_in_seconds: expiresInSeconds }
          : {};
        const result = await mutation.mutateAsync({ assetId, data: body });
        return result.data.url;
      } catch (error) {
        console.error('Failed to get signed URL:', error);
        return null;
      }
    },
    [mutation]
  );

  return {
    getSignedUrl,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook to fetch media as blob and create object URL.
 * Uses Orval-generated mediaStream for type-safe API calls.
 */
export function useMediaBlob(url: string | null | undefined) {
  const path = url ? extractPath(url) : '';
  const params: MediaStreamParams = { path };

  return useQuery({
    queryKey: [...getMediaStreamQueryKey(params), 'blob'] as const,
    queryFn: async () => {
      if (!path) return '';
      // Absolute URLs (external CDN): return as-is
      if (url?.startsWith('http')) return url;

      try {
        const blob = await mediaStream(params);
        return URL.createObjectURL(blob);
      } catch (e) {
        console.error('Failed to fetch media blob:', url, e);
        return '';
      }
    },
    enabled: !!path,
    staleTime: 1000 * 60 * 30, // Cache blobs for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in GC for 1 hour
  });
}

/**
 * Hook to fetch multiple media as blobs
 */
export function useMediaBlobs(urls: string[]) {
  const validUrls = urls.filter(Boolean);

  return useQuery({
    queryKey: ['media-blobs', ...validUrls.map(extractPath)],
    queryFn: async () => {
      if (!validUrls.length) return [];

      const promises = validUrls.map(async (url) => {
        // Absolute URLs: return as-is
        if (url.startsWith('http')) return url;
        if (!url) return '';

        const path = extractPath(url);
        try {
          const blob = await mediaStream({ path });
          return URL.createObjectURL(blob);
        } catch (e) {
          console.error('Failed to fetch media blob for:', url, e);
          return '';
        }
      });
      return Promise.all(promises);
    },
    enabled: validUrls.length > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

// ===========================
// 🎯 COMPREHENSIVE MEDIA HOOK
// ===========================

interface UseMediaOptions {
  assetId?: string;
  url?: string;
  preferSignedUrl?: boolean;
}

interface UseMediaResult {
  /** Media asset metadata (if assetId provided) */
  asset: MediaAssetSummary | null | undefined;
  /** URL to display the media (prioritizes: signed URL > CDN > original > blob) */
  displayUrl: string | null;
  /** Blob URL for private media requiring authentication */
  blobUrl: string | null;
  /** Loading states */
  isLoadingAsset: boolean;
  isLoadingBlob: boolean;
  /** Errors */
  assetError: Error | null;
  blobError: Error | null;
}

/**
 * Comprehensive hook for media operations.
 * Combines asset metadata fetching, signed URL generation, and blob streaming.
 * Best practice: Use this hook for all media display needs.
 *
 * @example
 * // For public media with known URL
 * const { displayUrl } = useMedia({ url: post.mediaUrls[0] });
 *
 * // For private media with assetId
 * const { displayUrl, asset } = useMedia({ assetId: media.id });
 *
 * // For media requiring signed URL
 * const { displayUrl } = useMedia({ assetId: media.id, preferSignedUrl: true });
 */
export function useMedia(options: UseMediaOptions): UseMediaResult {
  const { assetId, url, preferSignedUrl } = options;

  // Fetch asset metadata if assetId provided
  const {
    data: asset,
    isLoading: isLoadingAsset,
    error: assetError,
  } = useMediaAsset(assetId);

  // Get blob URL if needed for private media
  const {
    data: blobUrl,
    isLoading: isLoadingBlob,
    error: blobError,
  } = useMediaBlob(url);

  // Generate signed URL if preferred
  const { getSignedUrl, isLoading: isLoadingSignedUrl } = useMediaSignedUrl();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (preferSignedUrl && assetId) {
      getSignedUrl(assetId).then(setSignedUrl);
    }
  }, [preferSignedUrl, assetId, getSignedUrl]);

  // Determine best display URL
  const displayUrl = useMemo(() => {
    // Priority: signed URL > CDN > original > blob > provided URL
    if (signedUrl) return signedUrl;
    if (asset?.cdn_url) return asset.cdn_url;
    if (asset?.original_url) return asset.original_url;
    if (blobUrl && blobUrl.startsWith('blob:')) return blobUrl;
    return url || null;
  }, [signedUrl, asset, blobUrl, url]);

  return {
    asset,
    displayUrl,
    blobUrl: blobUrl || null,
    isLoadingAsset: isLoadingAsset || isLoadingSignedUrl,
    isLoadingBlob,
    assetError,
    blobError,
  };
}
