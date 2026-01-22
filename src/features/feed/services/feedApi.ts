import { mockApi } from '@/lib/mockApi'
import type { Post, Comment } from '@/types'

export const feedApi = {
  getPosts: async (page: number = 1, limit: number = 10): Promise<Post[]> => {
    return await mockApi.feed.getPosts(page, limit)
  },

  createPost: async (data: { content: string; images: string[] }): Promise<Post> => {
    return await mockApi.feed.createPost(data)
  },

  likePost: async (): Promise<void> => {
    return await mockApi.feed.likePost()
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    return await mockApi.feed.addComment(postId, content)
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    return await mockApi.feed.getComments(postId)
  },
}
