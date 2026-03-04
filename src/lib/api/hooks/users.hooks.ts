import { useQuery, useMutation, queryOptions } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type {
  UserMe,
  UserPrivacy,
  UpdateProfileRequest,
  UpdatePrivacyRequest,
  SetAvatarRequest,
  SetBackgroundRequest,
  UploadAvatarResponse,
  UploadBackgroundResponse,
  DeactivateRequest,
  ReactivationRequest,
  ApiError,
} from '../types';
import {
  usersGetMe,
  usersUpdateProfile,
  usersUploadAvatar,
  usersUploadBackground,
  usersUpdatePrivacy,
  usersGetPrivacy,
  usersDeactivate,
  usersReactivate,
  usersCreateReactivationRequest,
} from '../endpoints/users';
import { queryKeys } from '@/lib/queryKeys';

export const getUsersGetMeQueryKey = () => queryKeys.users.me();
export const getUsersGetPrivacyQueryKey = () => queryKeys.users.privacy();

export const usersMeOptions = () =>
  queryOptions({
    queryKey: getUsersGetMeQueryKey(),
    queryFn: ({ signal }) => usersGetMe(signal),
  });

export const usersPrivacyOptions = () =>
  queryOptions({
    queryKey: getUsersGetPrivacyQueryKey(),
    queryFn: ({ signal }) => usersGetPrivacy(signal),
  });

export const useUsersGetMe = <TData = UserMe>(
  options?: Omit<UseQueryOptions<UserMe, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...usersMeOptions(), ...options });

export const useUsersGetPrivacy = <TData = UserPrivacy>(
  options?: Omit<UseQueryOptions<UserPrivacy, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...usersPrivacyOptions(), ...options });

export const useUsersUpdateProfile = (
  options?: UseMutationOptions<UserMe, ApiError, UpdateProfileRequest>
) =>
  useMutation({ mutationFn: (data) => usersUpdateProfile(data), mutationKey: ['usersUpdateProfile'], ...options });

export const useUsersUploadAvatar = (
  options?: UseMutationOptions<UploadAvatarResponse, ApiError, SetAvatarRequest>
) =>
  useMutation({ mutationFn: (data) => usersUploadAvatar(data), mutationKey: ['usersUploadAvatar'], ...options });

export const useUsersUploadBackground = (
  options?: UseMutationOptions<UploadBackgroundResponse, ApiError, SetBackgroundRequest>
) =>
  useMutation({ mutationFn: (data) => usersUploadBackground(data), mutationKey: ['usersUploadBackground'], ...options });

export const useUsersUpdatePrivacy = (
  options?: UseMutationOptions<UserPrivacy, ApiError, UpdatePrivacyRequest>
) =>
  useMutation({ mutationFn: (data) => usersUpdatePrivacy(data), mutationKey: ['usersUpdatePrivacy'], ...options });

export const useUsersDeactivate = (
  options?: UseMutationOptions<{ message?: string }, ApiError, DeactivateRequest>
) =>
  useMutation({ mutationFn: (data) => usersDeactivate(data), mutationKey: ['usersDeactivate'], ...options });

export const useUsersReactivate = (
  options?: UseMutationOptions<{ message: string }, ApiError, ReactivationRequest>
) =>
  useMutation({ mutationFn: (data) => usersReactivate(data), mutationKey: ['usersReactivate'], ...options });

export const useUsersCreateReactivationRequest = (
  options?: UseMutationOptions<{ message: string }, ApiError, ReactivationRequest>
) =>
  useMutation({ mutationFn: (data) => usersCreateReactivationRequest(data), mutationKey: ['usersCreateReactivationRequest'], ...options });
