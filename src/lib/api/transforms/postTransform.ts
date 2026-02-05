import { Models } from '../generated';
import { transformAuthor } from './userTransform';
import { appendAuthToken } from './common';
import type { FeedPost, FeedComment, ReactionType } from '@/features/home/types/feed.types';

/**
 * Transform Generated PostOut/PostDetailOut to Frontend FeedPost
 */
export const transformPost = (post: Models.PostOut | Models.PostDetailOut): FeedPost => {
  // Extract media URLs
  const mediaUrls = (post.media_files || [])
    .map(m => appendAuthToken(m.file_url || m.file_path))
    .filter(Boolean) as string[];

  return {
    id: post.id,
    author: transformAuthor(post.author),
    content: post.content_text,
    mediaUrls,
    stats: {
      reactions: post.reaction_count ?? 0,
      comments: post.comment_count ?? 0,
      shares: post.share_count ?? 0,
    },
    userReaction: (post.user_reaction?.toUpperCase() as ReactionType) || null,
    sharedPost: post.shared_post ? transformPost(post.shared_post) : null,
    visibility: post.visibility,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
};

/**
 * Transform Generated CommentOut to Frontend Comment
 */
export const transformComment = (comment: Models.CommentOut): FeedComment => {
  return {
    id: comment.id,
    postId: comment.post_id,
    author: transformAuthor(comment.author),
    parentCommentId: comment.parent_comment_id || null,
    content: comment.content_text,
    mediaUrls: (comment.media_files || []).map(m => appendAuthToken(m.file_url)),
    stats: {
      reactions: comment.reaction_count ?? 0,
      replies: comment.reply_count ?? 0,
    },
    userReaction: (comment.user_reaction?.toUpperCase() as ReactionType) || null,
    createdAt: comment.created_at,
  };
};
