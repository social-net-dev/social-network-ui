import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/admin';
import type { ApproveVerificationRequest, RejectVerificationRequest } from '../types';

export const useAdminVerificationRequests = (status: string = 'PENDING') => {
  return useQuery({
    queryKey: ['admin', 'verification-requests', status],
    queryFn: () => adminApi.getVerificationRequests(status),
  });
};

export const useApproveVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ApproveVerificationRequest }) =>
      adminApi.approveVerification(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useRejectVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: RejectVerificationRequest }) =>
      adminApi.rejectVerification(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification-requests'] });
    },
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getAdminUsers(),
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};
