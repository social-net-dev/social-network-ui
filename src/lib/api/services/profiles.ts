/**
 * Profiles API Service
 */

import apiClient from '../../api';
import type { User } from '../types/user.types';
import { transformUser } from '../transforms';

export const profilesApi = {
  /**
   * Get user profile by username
   * @param username - Email or username
   */
  async getProfile(username: string): Promise<User> {
    const res = await apiClient.get<Record<string, any>>(`/profiles/${username}/`);
    // The interceptor should have unwrapped this, but let's be safe
    const data = res?.data?.data ?? res?.data ?? res;
    return transformUser(data as Record<string, any>);
  },
};
