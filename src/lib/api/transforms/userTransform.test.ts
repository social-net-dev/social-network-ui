import { describe, it, expect } from 'vitest';
import { transformAuthor, transformUser } from './userTransform';

describe('userTransform', () => {
  it('should transform AuthorInfo to FE Author', () => {
    const mockAuthor = {
      id: 'u1',
      display_name: 'Jane Doe',
      username: 'janedoe',
      avatar_path: null,
    };

    const result = transformAuthor(mockAuthor);

    expect(result.id).toBe('u1');
    expect(result.displayName).toBe('Jane Doe');
    expect(result.username).toBe('janedoe');
  });

  it('should handle null author', () => {
    const result = transformAuthor(null);
    expect(result.displayName).toBe('Người dùng');
  });

  it('should transform UserMeResponse to FE User', () => {
    const mockUser: any = {
      id: 'me',
      display_name: 'Admin User',
      email: 'admin@test.com',
      account_status: 'VERIFIED',
      created_at: '2021-01-01',
    };

    const result = transformUser(mockUser);

    expect(result.displayName).toBe('Admin User');
    expect(result.accountStatus).toBe('VERIFIED');
    expect(result.createdAt).toBe('2021-01-01');
  });
});
