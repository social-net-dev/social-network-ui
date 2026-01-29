import { type User, type Post, type Comment } from '@/types'
import { type LoginFormData, type RegisterFormData, type AuthResponse } from '@/features/auth/types/auth.types'
import { type ProfileData } from '@/features/profile/types/profile.types'

const mockDelay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockApi = {
  auth: {
    login: async (data: LoginFormData): Promise<AuthResponse> => {
      await mockDelay(800)
      const user: User = {
        id: '1',
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: data.email,
        avatar: 'https://i.pravatar.cc/150?img=1',
        bio: 'Software Engineer tại ETECHS',
        followers: 1234,
        following: 567,
        postsCount: 89,
        createdAt: new Date().toISOString(),
      }
      return {
        user,
        token: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      }
    },

    register: async (data: RegisterFormData): Promise<AuthResponse> => {
      await mockDelay(1000)
      const nameParts = data.displayName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || firstName
      const user: User = {
        id: Date.now().toString(),
        firstName,
        lastName,
        email: data.email,
        avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
        bio: '',
        followers: 0,
        following: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
      }
      return {
        user,
        token: 'mock-jwt-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      }
    },

    logout: async (): Promise<void> => {
      await mockDelay(300)
    },

    getCurrentUser: async (): Promise<User> => {
      await mockDelay(400)
      return {
        id: '1',
        firstName: 'Nguyễn',
        lastName: 'Văn A',
        email: 'nguyenvana@example.com',
        avatar: 'https://i.pravatar.cc/150?img=1',
        bio: 'Software Engineer tại ETECHS',
        followers: 1234,
        following: 567,
        postsCount: 89,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    },
  },

  profile: {
    getProfile: async (userId: string): Promise<ProfileData> => {
      await mockDelay(500)
      return {
        id: userId,
        username: userId === '1' ? 'nguyenvana' : 'tranthib',
        displayName: userId === '1' ? 'Nguyễn Văn A' : 'Trần Thị B',
        isOwner: true,
        isFriend: false,
        email: userId === '1' ? 'nguyenvana@example.com' : 'tranthib@example.com',
        avatar: `https://i.pravatar.cc/150?img=${parseInt(userId) + 10}`,
        bio: userId === '1' ? 'Software Engineer tại ETECHS. Yêu thích công nghệ và AI.' : 'Designer tại ETECHS. Đam mê sáng tạo.',
        followers: userId === '1' ? 1234 : 567,
        following: userId === '1' ? 567 : 234,
        postsCount: userId === '1' ? 89 : 45,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },

    updateProfile: async (_userId: string, data: Partial<ProfileData>): Promise<ProfileData> => {
      await mockDelay(800)
      return {
        id: '1',
        username: data.username || 'nguyenvana',
        displayName: data.displayName || 'Nguyễn Văn A',
        isOwner: true,
        isFriend: false,
        email: data.email || 'nguyenvana@example.com',
        avatar: data.avatar || 'https://i.pravatar.cc/150?img=1',
        bio: data.bio || '',
        followers: 1234,
        following: 567,
        postsCount: 89,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },
  },

  feed: {
    getPosts: async (page = 1, limit = 10): Promise<Post[]> => {
      await mockDelay(600)
      const posts: Post[] = Array.from({ length: limit }, (_, i) => ({
        id: `${page}-${i}`,
        authorId: (i % 3 + 1).toString(),
        author: {
          id: (i % 3 + 1).toString(),
          firstName: ['Nguyễn', 'Trần', 'Lê'][i % 3],
          lastName: ['Văn A', 'Thị B', 'Văn C'][i % 3],
          email: `user${i % 3 + 1}@example.com`,
          avatar: `https://i.pravatar.cc/150?img=${(i % 3) * 10 + 1}`,
        },
        content: [
          'Chào mọi người! Đây là bài viết đầu tiên của tôi. 🎉',
          'Hôm nay trời đẹp quá! ☀️',
          'Đang học về React và TypeScript. Rất thú vị! 💻',
          'ETECHS là nơi tuyệt vời để làm việc. 🚀',
          'Chia sẻ một chút về kinh nghiệm của mình...',
        ][i % 5],
        images: [],
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10),
        likedByCurrentUser: Math.random() > 0.7,
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      }))
      return posts
    },

    createPost: async (data: { content: string; images: string[] }): Promise<Post> => {
      await mockDelay(1000)
      return {
        id: Date.now().toString(),
        authorId: '1',
        author: {
          id: '1',
          firstName: 'Nguyễn',
          lastName: 'Văn A',
          email: 'nguyenvana@example.com',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
        content: data.content,
        images: data.images,
        likes: 0,
        comments: 0,
        shares: 0,
        likedByCurrentUser: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },

    likePost: async (postId: string, liked: boolean): Promise<void> => {
      console.log(`Post ${postId} ${liked ? 'liked' : 'unliked'}`)
      await mockDelay(300)
    },

    addComment: async (postId: string, content: string): Promise<Comment> => {
      await mockDelay(500)
      return {
        id: Date.now().toString(),
        postId,
        authorId: '1',
        author: {
          id: '1',
          firstName: 'Nguyễn',
          lastName: 'Văn A',
          email: 'nguyenvana@example.com',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
        content,
        likes: 0,
        likedByCurrentUser: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    },

    getComments: async (postId: string): Promise<Comment[]> => {
      await mockDelay(400)
      return [
        {
          id: '1',
          postId,
          authorId: '2',
          author: {
            id: '2',
            firstName: 'Trần',
            lastName: 'Thị B',
            email: 'tranthib@example.com',
            avatar: 'https://i.pravatar.cc/150?img=2',
          },
          content: 'Bài viết hay quá! 👏',
          likes: 5,
          likedByCurrentUser: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          postId,
          authorId: '3',
          author: {
            id: '3',
            firstName: 'Lê',
            lastName: 'Văn C',
            email: 'levanc@example.com',
            avatar: 'https://i.pravatar.cc/150?img=3',
          },
          content: 'Tôi đồng ý với bạn!',
          likes: 3,
          likedByCurrentUser: true,
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ]
    },
  },
}
