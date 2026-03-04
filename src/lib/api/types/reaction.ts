import type { ReactionType } from './common';

// ─── Reaction Models ───────────────────────────────────────────────────────────

export interface ReactRequest {
  reaction: ReactionType;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}
