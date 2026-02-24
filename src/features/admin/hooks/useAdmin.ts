import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customInstance } from '@/lib/api';

interface VerificationRequest {
  id: string;
  requested_role: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    phone?: string;
    accountStatus: string;
    storageQuotaMb?: number;
    cccd_front_path?: string;
    cccd_back_path?: string;
  };
}

export function useAdminVerificationRequests(status?: string) {
  return useQuery({
    queryKey: ['admin', 'verification-requests', status],
    queryFn: () =>
      customInstance<VerificationRequest[]>({
        url: '/admin/verification-requests/',
        method: 'GET',
        params: status ? { status } : undefined,
      }),
    select: (res) => (Array.isArray(res) ? res : []),
  });
}

export function useApproveVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: { role: string } }) =>
      customInstance({ url: `/admin/verification-requests/${requestId}/approve/`, method: 'POST', data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'verification-requests'] }),
  });
}

export function useRejectVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: { reason: string } }) =>
      customInstance({ url: `/admin/verification-requests/${requestId}/reject/`, method: 'POST', data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'verification-requests'] }),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => customInstance<unknown[]>({ url: '/admin/users/', method: 'GET' }),
    select: (res) => (Array.isArray(res) ? res : []),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      customInstance({ url: `/admin/users/${userId}/reactivate/`, method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}
