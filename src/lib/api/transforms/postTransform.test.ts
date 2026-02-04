import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformPost, transformComment } from './postTransform';
import { Models } from '../generated';

describe('postTransform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should transform a generated post to FE FeedPost', () => {
    const mockPost: any = {
      id: 'post-1',
      author: {
        id: 'user-1',
        display_name: 'John Doe',
        avatar_path: 'avatars/john.jpg',
      },
      content_text: 'Hello world',
      reaction_count: 10,
      comment_count: 5,
      share_count: 2,
      user_reaction: 'like',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      visibility: 'PUBLIC',
      media_files: [
        { file_url: 'https://example.com/image.jpg' }
      ]
    };

    const result = transformPost(mockPost);

    expect(result.id).toBe('post-1');
    expect(result.author.displayName).toBe('John Doe');
    expect(result.content).toBe('Hello world');
    expect(result.stats.reactions).toBe(10);
    expect(result.userReaction).toBe('LIKE');
    expect(result.mediaUrls).toContain('https://example.com/image.jpg');
  });

  it('should handle missing optional fields', () => {
    const mockPost: any = {
      id: 'post-2',
      author: null,
      content_text: '',
      created_at: '',
      updated_at: '',
      visibility: 'PRIVATE',
    };

    const result = transformPost(mockPost);

    expect(result.id).toBe('post-2');
    expect(result.author.displayName).toBe('Người dùng');
    expect(result.stats.reactions).toBe(0);
    expect(result.mediaUrls).toEqual([]);
  });

  it('should append auth token to media URLs if token exists', () => {
    localStorage.setItem('auth_token', '"secret-token"');
    
    const mockPost: any = {
      id: 'post-3',
      author: null,
      content_text: '',
      media_files: [{ file_url: 'https://cdn.com/img.png' }]
    };

    const result = transformPost(mockPost);
    expect(result.mediaUrls[0]).toContain('access_token=secret-token');
  });
});
