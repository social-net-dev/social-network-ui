/**
 * Mock Post Types & Data
 * Basic set: 10 posts for testing feed
 */
import { mockUsers, currentMockUser, type MockUser } from "./users.fixture";

// ============================================
// TYPES
// ============================================
export interface MockMediaFile {
  id: string;
  file_url: string;
  file_path?: string;
  type: "image" | "video";
}

export interface MockPost {
  id: string;
  author: MockUser;
  content_text: string;
  media_files: MockMediaFile[];
  reaction_count: number;
  comment_count: number;
  share_count: number;
  user_reaction: string | null;
  visibility: "public" | "friends" | "private";
  created_at: string;
  updated_at: string;
  shared_post?: MockPost | null;
}

// ============================================
// MOCK DATA
// ============================================
export const mockPosts: MockPost[] = [
  {
    id: "post-001",
    author: mockUsers[0],
    content_text: "Chào mọi người! Đây là bài viết đầu tiên của tôi trên ETECHS Social. Rất vui được làm quen với tất cả! 🎉",
    media_files: [
      { id: "m1", file_url: "https://picsum.photos/800/600?random=1", type: "image" },
    ],
    reaction_count: 15,
    comment_count: 3,
    share_count: 1,
    user_reaction: "like",
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "post-002",
    author: mockUsers[1],
    content_text: "Hôm nay thời tiết đẹp quá! Ai muốn đi cafe không? ☕",
    media_files: [],
    reaction_count: 8,
    comment_count: 5,
    share_count: 0,
    user_reaction: null,
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "post-003",
    author: mockUsers[2],
    content_text: "Vừa hoàn thành dự án mới! Cảm ơn team đã support 💪\n\n#coding #teamwork #success",
    media_files: [
      { id: "m2", file_url: "https://picsum.photos/800/600?random=2", type: "image" },
      { id: "m3", file_url: "https://picsum.photos/800/600?random=3", type: "image" },
    ],
    reaction_count: 42,
    comment_count: 12,
    share_count: 5,
    user_reaction: "love",
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "post-004",
    author: mockUsers[0],
    content_text: "Tips học lập trình hiệu quả:\n1. Code mỗi ngày\n2. Đọc code người khác\n3. Build projects thực tế\n4. Đừng sợ bugs! 🐛",
    media_files: [],
    reaction_count: 156,
    comment_count: 28,
    share_count: 45,
    user_reaction: null,
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "post-005",
    author: mockUsers[1],
    content_text: "Review MacBook Pro M3 sau 1 tháng sử dụng: Pin trâu, chạy mượt, không hề nóng. Worth every penny! 💻",
    media_files: [
      { id: "m4", file_url: "https://picsum.photos/800/600?random=4", type: "image" },
    ],
    reaction_count: 89,
    comment_count: 34,
    share_count: 12,
    user_reaction: "like",
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "post-006",
    author: mockUsers[2],
    content_text: "Cuối tuần này ai có plan gì chưa? Mình đang tính đi hiking ở Ba Vì 🏔️",
    media_files: [],
    reaction_count: 12,
    comment_count: 8,
    share_count: 0,
    user_reaction: null,
    visibility: "friends",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "post-007",
    author: mockUsers[0],
    content_text: "Đang học React Query, thấy manage server state dễ hơn Redux nhiều. Ai có tips gì không? 🤔",
    media_files: [],
    reaction_count: 23,
    comment_count: 15,
    share_count: 3,
    user_reaction: null,
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "post-008",
    author: mockUsers[1],
    content_text: "Chia sẻ album du lịch Đà Nẵng 📸",
    media_files: [
      { id: "m5", file_url: "https://picsum.photos/800/600?random=5", type: "image" },
      { id: "m6", file_url: "https://picsum.photos/800/600?random=6", type: "image" },
      { id: "m7", file_url: "https://picsum.photos/800/600?random=7", type: "image" },
      { id: "m8", file_url: "https://picsum.photos/800/600?random=8", type: "image" },
    ],
    reaction_count: 234,
    comment_count: 45,
    share_count: 28,
    user_reaction: "love",
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "post-009",
    author: mockUsers[2],
    content_text: "Just pushed a major refactor to production. Zero bugs so far 🤞 #DevLife",
    media_files: [],
    reaction_count: 67,
    comment_count: 9,
    share_count: 4,
    user_reaction: null,
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "post-010",
    author: mockUsers[0],
    content_text: "Tổng kết tháng này:\n✅ Hoàn thành 3 projects\n✅ Học được 2 công nghệ mới\n✅ Đọc 4 cuốn sách\n\nTháng sau tiếp tục cố gắng! 💪",
    media_files: [],
    reaction_count: 98,
    comment_count: 22,
    share_count: 15,
    user_reaction: "like",
    visibility: "public",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

// ============================================
// HELPERS
// ============================================
export const createMockPost = (
  authorId?: string,
  override: Partial<MockPost> = {}
): MockPost => {
  const author = authorId
    ? mockUsers.find((u) => u.id === authorId) || currentMockUser
    : currentMockUser;

  return {
    id: `post-${Date.now()}`,
    author,
    content_text: "Bài viết mới được tạo từ mock",
    media_files: [],
    reaction_count: 0,
    comment_count: 0,
    share_count: 0,
    user_reaction: null,
    visibility: "public",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...override,
  };
};

export const findMockPostById = (id: string): MockPost | undefined => {
  return mockPosts.find((p) => p.id === id);
};
