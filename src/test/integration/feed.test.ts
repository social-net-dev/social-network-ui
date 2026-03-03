import { describe, it, expect, beforeAll } from 'vitest';
import { loginAs, authedClient, ALICE } from './testClient';
import type { AxiosInstance } from 'axios';

let api: AxiosInstance;

beforeAll(async () => {
  const token = await loginAs(ALICE.email, ALICE.password);
  api = authedClient(token);
});

describe('Feed API', () => {
  it('GET /feed — returns items array and pagination', async () => {
    const res = await api.get('/feed');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    const { items, pagination } = res.data.data;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(pagination).toMatchObject({
      has_next_page: expect.any(Boolean),
    });
  });

  it('GET /feed — each item has required post fields', async () => {
    const res = await api.get('/feed');
    const items = res.data.data.items;
    for (const post of items) {
      expect(post).toMatchObject({
        id: expect.any(String),
        author: expect.objectContaining({
          id: expect.any(String),
          username: expect.any(String),
          display_name: expect.any(String),
        }),
        content: expect.any(String),
        stats: expect.objectContaining({
          reactions: expect.any(Number),
          comments: expect.any(Number),
          shares: expect.any(Number),
        }),
        visibility: expect.any(String),
        post_type: expect.any(String),
        created_at: expect.any(String),
      });
    }
  });

  it('GET /feed?limit=2 — respects limit and returns cursor', async () => {
    const res = await api.get('/feed?limit=2');
    const { items, pagination } = res.data.data;
    expect(items.length).toBeLessThanOrEqual(2);
    if (items.length === 2) {
      // With 7 seeded posts, there should be a next page
      expect(pagination.has_next_page).toBe(true);
      expect(pagination.next_cursor).toBeTruthy();
    }
  });

  it('GET /feed cursor pagination — second page differs from first', async () => {
    const page1 = await api.get('/feed?limit=3');
    const { next_cursor } = page1.data.data.pagination;
    if (!next_cursor) return; // skip if not enough data

    const page2 = await api.get(`/feed?limit=3&cursor=${encodeURIComponent(next_cursor)}`);
    expect(page2.status).toBe(200);
    const ids1: string[] = page1.data.data.items.map((p: { id: string }) => p.id);
    const ids2: string[] = page2.data.data.items.map((p: { id: string }) => p.id);
    // No overlap between pages
    const overlap = ids1.filter(id => ids2.includes(id));
    expect(overlap).toHaveLength(0);
  });

  it('GET /feed — requires auth (no token returns 401)', async () => {
    const { client } = await import('./testClient');
    await expect(client.get('/feed')).rejects.toMatchObject({ response: { status: 401 } });
  });
});
