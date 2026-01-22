import { z } from 'zod'
import type { User } from '@/types'

export const CreatePostFormDataSchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống').max(2000, 'Nội dung tối đa 2000 ký tự'),
  images: z.array(z.string().url()).max(4, 'Tối đa 4 hình ảnh').optional(),
})

export type CreatePostFormData = z.infer<typeof CreatePostFormDataSchema>

export interface Post {
  id: string
  authorId: string
  author: User
  content: string
  images: string[]
  likes: number
  comments: number
  shares: number
  likedByCurrentUser: boolean
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  author: User
  content: string
  likes: number
  likedByCurrentUser: boolean
  createdAt: string
  updatedAt: string
}
