/**
 * Profiles API Service
 */

import socialClient from '../../socialApi';
import type { User } from '../types/user.types';
import { transformUser } from '../transforms';

export const profilesApi = {
  /**
   * Get user profile by username
   * @param username - Email or username
   */
  async getProfile(username: string): Promise<User> {
    const res = await socialClient.get<Record<string, any>>(`/profiles/${username}/`);
    const data = res?.data ?? res;
    return transformUser(data as Record<string, any>);
  },
};
