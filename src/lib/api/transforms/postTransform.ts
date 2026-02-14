/**
 * Post Transforms (Simplified)
 */

import { buildMediaUrl } from './common';
import { transformAuthor } from './userTransform';
import type { Post } from '../types/post.types';
import type { Comment } from '../types/comment.types';
import type { ReactionType } from '../types/common.types';

/**
 * Transform Backend Post to Frontend Post model
 */
export const transformPost = (post: Record<string, any>): Post => {
  const mediaUrls: string[] = [];
  
  const rawMedia = (post.media_files || post.media || []) as any[];
  rawMedia.forEach((m: any) => {
    const url = buildMediaUrl(m.file_url || m.file_path || m.media_url);
    if (url) mediaUrls.push(url);
  });

  // If no files but there are media_urls (legacy or simple array)
  if (mediaUrls.length === 0 && post.media_urls) {
    const urls = post.media_urls as string[];
    urls.forEach((url: string) => {
      const formatted = buildMediaUrl(url);
      if (formatted) mediaUrls.push(formatted);
    });
  }

  return {
    id: String(post.id || post._id || ''),
    author: transformAuthor(post.author as Record<string, any>),
    content: String(post.content_text || post.content || ''),
    mediaUrls,
    stats: {
      reactions: Number(post.reaction_count ?? 0),
      comments: Number(post.comment_count ?? 0),
      shares: Number(post.share_count ?? 0),
    },
    userReaction: (post.user_reaction?.toUpperCase() as ReactionType) || null,
    sharedPost: post.shared_post ? transformPost(post.shared_post as Record<string, any>) : null,
    visibility: (post.visibility as Post['visibility']) || 'PUBLIC',
    postType: (post.post_type as Post['postType']) || 'SOCIAL',
    fieldId: String(post.field_id || ''),
    createdAt: String(post.created_at || ''),
    updatedAt: String(post.updated_at || post.created_at || ''),
  } as Post;
};

/**
 * Transform Backend Comment to Frontend Comment model
 */
export const transformComment = (comment: Record<string, any>): Comment => {
  const mediaUrls: string[] = [];
  
  const rawMedia = (comment.media_files || comment.media || []) as any[];
  rawMedia.forEach((m: any) => {
    const url = buildMediaUrl(m.file_url || m.file_path || m.media_url);
    if (url) mediaUrls.push(url);
  });

  // If no files but there are media_urls (legacy or simple array)
  if (mediaUrls.length === 0 && comment.media_urls) {
    if (Array.isArray(comment.media_urls)) {
      comment.media_urls.forEach((url: string) => {
        const formatted = buildMediaUrl(url);
        if (formatted) mediaUrls.push(formatted);
      });
    }
  }

  return {
    id: String(comment.id || comment._id || ''),
    postId: String(comment.post_id || ''),
    author: transformAuthor(comment.author as Record<string, any>),
    parentCommentId: comment.parent_comment_id ? String(comment.parent_comment_id) : null,
    content: String(comment.content_text || comment.content || ''),
    mediaUrls,
    stats: {
      reactions: Number(comment.reaction_count ?? 0),
      replies: Number(comment.reply_count ?? 0),
    },
    userReaction: (comment.user_reaction?.toUpperCase() as ReactionType) || null,
    createdAt: String(comment.created_at || ''),
    updatedAt: String(comment.updated_at || comment.created_at || ''),
  } as Comment;
};
