import { customInstance } from '@/lib/api';
import type { ShareResponse, SharePostRequest } from '../types';

export const sharesSharePost = (postId: string, body?: SharePostRequest, signal?: AbortSignal): Promise<ShareResponse> =>
  customInstance({ url: `/posts/${postId}/share`, method: 'POST', data: body, signal });

export const sharesUnsharePost = (postId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/posts/${postId}/share`, method: 'DELETE', signal });
