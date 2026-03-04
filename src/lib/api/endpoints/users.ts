import { customInstance } from '@/lib/api';
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
} from '../types';

export const usersGetMe = (signal?: AbortSignal): Promise<UserMe> =>
  customInstance({ url: '/users/me', method: 'GET', signal });

export const usersUpdateProfile = (body: UpdateProfileRequest, signal?: AbortSignal): Promise<UserMe> =>
  customInstance({ url: '/users/me/profile', method: 'PATCH', data: body, signal });

export const usersUploadAvatar = (body: SetAvatarRequest, signal?: AbortSignal): Promise<UploadAvatarResponse> =>
  customInstance({ url: '/users/me/avatar', method: 'POST', data: body, signal });

export const usersUploadBackground = (body: SetBackgroundRequest, signal?: AbortSignal): Promise<UploadBackgroundResponse> =>
  customInstance({ url: '/users/me/background', method: 'POST', data: body, signal });

export const usersUpdatePrivacy = (body: UpdatePrivacyRequest, signal?: AbortSignal): Promise<UserPrivacy> =>
  customInstance({ url: '/users/me/privacy', method: 'PATCH', data: body, signal });

export const usersGetPrivacy = (signal?: AbortSignal): Promise<UserPrivacy> =>
  customInstance({ url: '/users/me/privacy', method: 'GET', signal });

export const usersDeactivate = (body: DeactivateRequest, signal?: AbortSignal): Promise<{ message?: string }> =>
  customInstance({ url: '/users/me/deactivate', method: 'POST', data: body, signal });

export const usersReactivate = (body: ReactivationRequest, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: '/users/me/reactivate', method: 'POST', data: body, signal });

export const usersCreateReactivationRequest = (body: ReactivationRequest, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: '/users/me/reactivation-requests', method: 'POST', data: body, signal });
