import type { UserPublic } from './user';

// ─── Search Models ─────────────────────────────────────────────────────────────

export interface SearchUsersResponse {
  users: UserPublic[];
  total: number;
}

export interface ApiSuggestion {
  id: string;
  name: string;
  username?: string | null;
  avatar_path?: string | null;
  background_path?: string | null;
  role?: string;
  tags?: string[];
  connected_via?: string;
  target_name?: string;
  friend_status?: string;
  friend_request_id?: string | null;
  school?: string;
  class_name?: string;
  field?: string;
}

export interface RecommendationResponse {
  suggestions: ApiSuggestion[];
  total?: number;
}
