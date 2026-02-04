import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { callUploadFile } from '../services/messageApi';
import type { MessageFull } from '../types/message.types';

export interface UseFileUploadProps {
  roomId: string;
  userId: string;
  onUploadStart?: () => void;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
}

export const useFileUpload = ({ roomId, userId, onUploadStart, onUploadSuccess, onUploadError }: UseFileUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create object URLs for previews
  const previews = useMemo(() => selectedFiles.map(f => URL.createObjectURL(f)), [selectedFiles]);

  // Cleanup preview URLs on unmount or when files change
  useEffect(() => {
    return () => {
      previews.forEach(p => {
        try {
          URL.revokeObjectURL(p);
        } catch (e) {
          // ignore
        }
      });
    };
  }, [previews]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Remove a file from selection
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Upload files to server
  const uploadFiles = useCallback(
    async (text: string, setFetchedMessages: React.Dispatch<React.SetStateAction<MessageFull[]>>) => {
      if (selectedFiles.length === 0) return null;

      const client_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      try {
        onUploadStart?.();

        // Create temporary preview URLs for sender
        const localPreviews = selectedFiles.map(f => URL.createObjectURL(f));

        // Insert optimistic message
        const optimisticAttachments = selectedFiles.map((f, idx) => ({
          url: localPreviews[idx],
          filename: f.name,
          mime: f.type || null,
          is_image: f.type ? f.type.startsWith('image/') : /\.svg$/i.test(f.name),
        }));

        const optimistic: MessageFull = {
          id: undefined as any,
          client_id,
          room_id: roomId,
          sender_id: userId,
          ciphertext: text.trim() || null,
          created_at: new Date().toISOString(),
          _status: 'sending',
          attachments: optimisticAttachments,
          attachment_url: null,
          attachment_urls: optimisticAttachments.map((a: any) => a.url),
          pinned: false,
          reactions: [],
          _local_preview_urls: localPreviews,
        } as any;

        setFetchedMessages(prev => [...prev, optimistic]);

        // Upload via REST
        const res = await callUploadFile(roomId, {
          room_id: roomId,
          sender_id: userId,
          files: selectedFiles,
          client_id,
        });

        console.log('[useFileUpload] Upload response:', res.data ?? res);

        // Revoke local preview URLs after delay
        setTimeout(() => {
          setFetchedMessages(prev => {
            prev.forEach((m: any) => {
              if (m._local_preview_urls && Array.isArray(m._local_preview_urls)) {
                m._local_preview_urls.forEach((u: string) => {
                  try {
                    URL.revokeObjectURL(u);
                  } catch (e) {
                    // ignore
                  }
                });
                delete m._local_preview_urls;
              }
            });
            return [...prev];
          });
        }, 3000);

        onUploadSuccess?.();
        return client_id;
      } catch (e) {
        console.error('Upload failed:', e);

        // Mark optimistic as failed
        setFetchedMessages(prev => prev.map(m => (m.client_id === client_id ? { ...m, _status: 'failed', _error: String(e) } : m)));

        onUploadError?.(e instanceof Error ? e.message : String(e));
        throw e;
      }
    },
    [selectedFiles, roomId, userId, onUploadStart, onUploadSuccess, onUploadError]
  );

  return {
    selectedFiles,
    fileInputRef,
    previews,
    handleFileSelect,
    removeFile,
    clearFiles,
    uploadFiles,
  };
};
