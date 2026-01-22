import { mockApi } from '@/lib/mockApi'
import type { Post, Comment, CreatePostFormData } from '../types/feed.types'

export const feedApi = {
  getPosts: async (page = 1, limit = 10): Promise<Post[]> => {
    return await mockApi.feed.getPosts(page, limit)
  },

  createPost: async (data: CreatePostFormData): Promise<Post> => {
    return await mockApi.feed.createPost({ content: data.content, images: data.images || [] })
  },

  likePost: async (postId: string, liked: boolean): Promise<void> => {
    await mockApi.feed.likePost(postId, liked)
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    return await mockApi.feed.addComment(postId, content)
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    return await mockApi.feed.getComments(postId)
  },
}
