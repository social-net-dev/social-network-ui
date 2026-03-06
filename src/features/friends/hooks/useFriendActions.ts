import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useFriendsSendRequest,
  useFriendsAcceptRequest,
  useFriendsCancelRequest,
  getFriendsListFriendsQueryKey,
  getFriendsListIncomingRequestsQueryKey,
  getFriendsListOutgoingRequestsQueryKey,
} from '@/lib/api/generated';

interface UseFriendActionsOptions {
  /** Called after optimistic update with new status and optional requestId */
  onStatusChange?: (userId: string, newStatus: string | undefined, requestId?: string | null) => void;
}

export function useFriendActions(options?: UseFriendActionsOptions) {
  const qc = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const sendMutation = useFriendsSendRequest();
  const acceptMutation = useFriendsAcceptRequest();
  const cancelMutation = useFriendsCancelRequest();

  const addProcessing = useCallback((id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
  }, []);

  const removeProcessing = useCallback((id: string) => {
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const invalidateFriends = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['/friends/'] });
    qc.invalidateQueries({ queryKey: getFriendsListFriendsQueryKey() });
  }, [qc]);

  const sendRequest = useCallback(async (userId: string, username: string) => {
    addProcessing(userId);
    try {
      const res = await sendMutation.mutateAsync({ data: { addressee_username: username } });
      toast.success('Đã gửi lời mời kết bạn');
      const requestId = res?.id ? String(res.id) : null;
      options?.onStatusChange?.(userId, 'request_sent', requestId);
      invalidateFriends();
      qc.invalidateQueries({ queryKey: getFriendsListOutgoingRequestsQueryKey() });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(e?.response?.data?.message || e?.message || 'Lỗi khi gửi lời mời');
    } finally {
      removeProcessing(userId);
    }
  }, [addProcessing, removeProcessing, sendMutation, invalidateFriends, qc, options]);

  const acceptRequest = useCallback(async (userId: string, requestId: string) => {
    addProcessing(userId);
    try {
      await acceptMutation.mutateAsync({ requestId });
      toast.success('Đã chấp nhận lời mời kết bạn');
      options?.onStatusChange?.(userId, 'friends');
      invalidateFriends();
      qc.invalidateQueries({ queryKey: getFriendsListIncomingRequestsQueryKey() });
    } catch {
      toast.error('Lỗi khi chấp nhận lời mời');
    } finally {
      removeProcessing(userId);
    }
  }, [addProcessing, removeProcessing, acceptMutation, invalidateFriends, qc, options]);

  const cancelRequest = useCallback(async (userId: string, requestId: string) => {
    addProcessing(userId);
    try {
      await cancelMutation.mutateAsync({ requestId });
      toast.success('Đã hủy lời mời kết bạn');
      options?.onStatusChange?.(userId, 'none', null);
      invalidateFriends();
      qc.invalidateQueries({ queryKey: getFriendsListOutgoingRequestsQueryKey() });
    } catch {
      toast.error('Lỗi khi hủy lời mời');
    } finally {
      removeProcessing(userId);
    }
  }, [addProcessing, removeProcessing, cancelMutation, invalidateFriends, qc, options]);

  return {
    processingIds,
    isProcessing: (id: string) => processingIds.has(id),
    sendRequest,
    acceptRequest,
    cancelRequest,
  };
}
