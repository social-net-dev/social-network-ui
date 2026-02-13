/**
 * Share related types
 */

export interface SharePostRequest {
  message?: string;
}

export interface ShareResponse {
  id: string;
  post_id: string;
  user_id: string;
  message?: string;
  created_at: string;
}
