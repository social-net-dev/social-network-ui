import { useQuery } from '@tanstack/react-query';
import { customInstance } from '@/lib/api';
import { getSocialApiUrl } from '@/lib/config';

/**
 * Build absolute URL for /media/ paths using social service host.
 * e.g. /media/abc.jpg -> http://localhost:8003/media/abc.jpg
 */
function buildMediaAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/media/')) {
    // getSocialApiUrl() = "http://localhost:8003/api" → strip "/api" suffix
    const socialBase = getSocialApiUrl().replace(/\/api\/?$/, '');
    return `${socialBase}${url}`;
  }
  return url;
}

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

      // Build absolute URL (handles /media/ -> social service host)
      const absUrl = buildMediaAbsoluteUrl(url);

      // Absolute URLs (external CDN or /media/ static files): return as-is
      if (absUrl.startsWith('http')) return absUrl;

      // Fetch via authenticated API client as blob
      try {
        const res = await customInstance<Blob>({
          url: absUrl,
          method: 'GET',
          responseType: 'blob',
        });
        return URL.createObjectURL(res);
      } catch (e) {
        console.error('Failed to fetch media blob:', absUrl, e);
        return '';
      }
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 30, // Cache blobs for 30 minutes
    gcTime: 1000 * 60 * 60, // Keep in GC for 1 hour
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
        if (!url) return '';

        // Build absolute URL (handles /media/ -> social service host)
        const absUrl = buildMediaAbsoluteUrl(url);

        // Absolute URLs (external CDN or /media/ static files): return as-is
        if (absUrl.startsWith('http')) return absUrl;

        try {
          const res = await customInstance<Blob>({
            url: absUrl,
            method: 'GET',
            responseType: 'blob',
          });
          return URL.createObjectURL(res);
        } catch (e) {
          console.error('Failed to fetch media blob for:', absUrl, e);
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
