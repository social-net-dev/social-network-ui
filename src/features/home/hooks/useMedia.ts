import { useQuery } from "@tanstack/react-query";
import { customInstance } from "@/lib/axios-instance";

/**
 * Hook to fetch media as blob and create object URL
 */
export function useMediaBlob(url: string | null | undefined) {
  return useQuery({
    queryKey: ["media-blob", url],
    queryFn: async () => {
      if (!url) return "";
      const res = await customInstance<Blob>({ 
        url, 
        method: 'GET',
        responseType: "blob" 
      });
      return URL.createObjectURL(res);
    },
    enabled: !!url,
    staleTime: Infinity, // Media blobs don't change often
  });
}

/**
 * Hook to fetch multiple media as blobs
 */
export function useMediaBlobs(urls: string[]) {
  return useQuery({
    queryKey: ["media-blobs", urls],
    queryFn: async () => {
      if (!urls || urls.length === 0) return [];
      const promises = urls.map(async (url) => {
        try {
          const res = await customInstance<Blob>({ 
            url, 
            method: 'GET',
            responseType: "blob" 
          });
          return URL.createObjectURL(res);
        } catch (e) {
          return "";
        }
      });
      return Promise.all(promises);
    },
    enabled: urls.length > 0,
    staleTime: Infinity,
  });
}
