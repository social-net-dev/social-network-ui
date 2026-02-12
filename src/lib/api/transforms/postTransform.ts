import { Models } from '../generated';
import { transformAuthor } from './userTransform';
import { buildMediaPath } from './common';
import type { FeedPost, FeedComment, ReactionType } from '@/features/home/types/feed.types';

/**
 * Transform Generated PostOut/PostDetailOut to Frontend FeedPost
 */
export const transformPost = (post: Models.PostOut | Models.PostDetailOut | any): FeedPost => {
  // Extract media URLs — use buildMediaPath (relative) so useMediaBlobs can fetch via axios
  const mediaFiles = post.media_files || post.media || [];
  const mediaUrls = mediaFiles
    .map((m: any) => buildMediaPath(m.file_url || m.file_path || m.media_url))
    .filter(Boolean) as string[];

  return {
    id: post.id || post._id,
    author: transformAuthor(post.author),
    content: post.content_text || post.content || '',
    mediaUrls,
    stats: {
      reactions: post.reaction_count ?? 0,
      comments: post.comment_count ?? 0,
      shares: post.share_count ?? 0,
    },
    userReaction: (post.user_reaction?.toUpperCase() as ReactionType) || null,
    sharedPost: post.shared_post ? transformPost(post.shared_post) : null,
    visibility: post.visibility || 'PUBLIC',
    postType: post.post_type || 'SOCIAL',
    fieldId: post.field_id || '',
    createdAt: post.created_at || '',
    updatedAt: post.updated_at || post.created_at || '',
  };
};

/**
 * Transform Generated CommentOut to Frontend Comment
 */
export const transformComment = (comment: Models.CommentOut | any): FeedComment => {
  const mediaFiles = comment.media_files || comment.media || [];
  return {
    id: comment.id || comment._id,
    postId: comment.post_id || '',
    author: transformAuthor(comment.author),
    parentCommentId: comment.parent_comment_id || null,
    content: comment.content_text || comment.content || '',
    mediaUrls: mediaFiles.map((m: any) => buildMediaPath(m.file_url || m.file_path || m.media_url)),
    stats: {
      reactions: comment.reaction_count ?? 0,
      replies: comment.reply_count ?? 0,
    },
    userReaction: (comment.user_reaction?.toUpperCase() as ReactionType) || null,
    createdAt: comment.created_at || '',
  };
};
