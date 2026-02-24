/**
 * @deprecated Use hooks from @/features/media instead
 * This file is kept for backward compatibility and re-exports from the new media feature
 */

import { useQuery } from '@tanstack/react-query';
import { getMediaStreamQueryKey, mediaStream } from '@/lib/api/generated/media/media';
import type { MediaStreamParams } from '@/lib/api/generated/model';

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

function useMediaBlob(url: string) {
  const path = extractPath(url);
  const params: MediaStreamParams = { path };

  return useQuery({
    queryKey: [...getMediaStreamQueryKey(params), 'blob'] as const,
    queryFn: async () => {
      if (!path) return '';
      if (url.startsWith('http')) return url;

      const blob = await mediaStream(params);
      return URL.createObjectURL(blob);
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

function useMediaBlobs(urls: string[]) {
  const validUrls = urls.filter(Boolean);

  return useQuery({
    queryKey: ['media-blobs', ...validUrls.map(extractPath)],
    queryFn: async () => {
      if (!validUrls.length) return [];

      const promises = validUrls.map(async (url) => {
        if (url.startsWith('http')) return url;
        const path = extractPath(url);
        const blob = await mediaStream({ path });
        return URL.createObjectURL(blob);
      });

      return Promise.all(promises);
    },
    enabled: validUrls.length > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}

export {
  useMediaBlob,
  useMediaBlobs,
};
