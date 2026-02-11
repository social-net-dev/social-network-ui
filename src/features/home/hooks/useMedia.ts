import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/lib/axios-instance';

/**
 * Hook to fetch media as blob and create object URL.
 * URLs with access_token query params (from buildMediaUrl) are fetched
 * directly via the authed API client.
 */
export function useMediaBlob(url: string | null | undefined) {
  return useQuery({
    queryKey: ['media-blob', url],
    queryFn: async () => {
      if (!url) return '';

      // Absolute URLs (external CDN): return as-is
      if (url.startsWith('http')) return url;

      // Fetch via authenticated API client as blob
      try {
        const res = await customInstance<Blob>({
          url,
          method: 'GET',
          responseType: 'blob',
        });
        return URL.createObjectURL(res);
      } catch (e) {
        console.error('Failed to fetch media blob:', url, e);
        return '';
      }
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 30, // Cache blobs for 30 minutes
    gcTime: 1000 * 60 * 60,    // Keep in GC for 1 hour
  });
}

/**
 * Hook to fetch multiple media as blobs
 */
export function useMediaBlobs(urls: string[]) {
  return useQuery({
    queryKey: ['media-blobs', ...urls],
    queryFn: async () => {
      if (!urls || urls.length === 0) return [];

      const promises = urls.map(async url => {
        // Absolute URLs: return as-is
        if (url.startsWith('http')) return url;
        if (!url) return '';

        try {
          const res = await customInstance<Blob>({
            url,
            method: 'GET',
            responseType: 'blob',
          });
          return URL.createObjectURL(res);
        } catch (e) {
          console.error('Failed to fetch media blob for:', url, e);
          return '';
        }
      });
      return Promise.all(promises);
    },
    enabled: urls.length > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
