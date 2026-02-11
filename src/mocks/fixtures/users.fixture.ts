/**
 * Mock User Types & Data
 * Basic set: 3 users for testing
 */

// ============================================
// TYPES
// ============================================
export interface MockUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  avatar_url?: string | null;
}

// ============================================
// MOCK DATA
// ============================================
export const mockUsers: MockUser[] = [
  {
    id: 'bd8565ff-be35-454a-b873-db6c84498afd', // UUID format to match tenant_slug
    email: 'demo@etechs.com',
    username: 'demo_user',
    display_name: 'Demo User',
    avatar_path: 'https://github.com/shadcn.png',
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    email: 'nguyen.van.a@etechs.com',
    username: 'nguyenvana',
    display_name: 'Nguyễn Văn A',
    avatar_path: 'https://i.pravatar.cc/150?u=user002',
  },
  {
    id: 'f9e8d7c6-b5a4-3210-9876-fedcba098765',
    email: 'tran.thi.b@etechs.com',
    username: 'tranthib',
    display_name: 'Trần Thị B',
    avatar_path: 'https://i.pravatar.cc/150?u=user003',
  },
];

// Current logged-in user (for mock session)
export const currentMockUser = mockUsers[0];

// ============================================
// HELPERS
// ============================================
export const createMockUser = (override: Partial<MockUser> = {}): MockUser => ({
  id: `user-${Date.now()}`,
  email: `user${Date.now()}@etechs.com`,
  username: `user_${Date.now()}`,
  display_name: 'New User',
  avatar_path: null,
  ...override,
});

export const findMockUserById = (id: string): MockUser | undefined => {
  return mockUsers.find(u => u.id === id);
};
