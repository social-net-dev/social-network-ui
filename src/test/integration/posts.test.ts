import { describe, it, expect, beforeAll } from 'vitest';
import { loginAs, authedClient, ALICE } from './testClient';
import type { AxiosInstance } from 'axios';

let api: AxiosInstance;
let createdPostId: string;

beforeAll(async () => {
  const token = await loginAs(ALICE.email, ALICE.password);
  api = authedClient(token);
});

describe('Posts API', () => {
  it('GET /posts/ — returns cursor paginated list', async () => {
    const res = await api.get('/posts/');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data.items)).toBe(true);
    expect(res.data.data.pagination).toBeDefined();
  });

  it('POST /posts/ — creates a new post', async () => {
    const res = await api.post('/posts/', {
      content_text: 'Integration test post',
      visibility: 'PUBLIC',
      post_type: 'SOCIAL',
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    const post = res.data.data;
    expect(post).toMatchObject({
      id: expect.any(String),
      content: 'Integration test post',
      visibility: 'PUBLIC',
      author: expect.objectContaining({ id: ALICE.id }),
    });
    createdPostId = post.id;
  });

  it('GET /posts/{id} — returns post with stats', async () => {
    const res = await api.get(`/posts/${createdPostId}`);
    expect(res.status).toBe(200);
    expect(res.data.data).toMatchObject({
      id: createdPostId,
      content: 'Integration test post',
      stats: expect.objectContaining({ reactions: 0, comments: 0 }),
    });
  });

  it('PATCH /posts/{id} — updates post content', async () => {
    const res = await api.patch(`/posts/${createdPostId}`, {
      content_text: 'Updated content',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.content).toBe('Updated content');
  });

  it('GET /posts/me — returns current user posts', async () => {
    const res = await api.get('/posts/me');
    expect(res.status).toBe(200);
    const items: Array<{ author: { id: string } }> = res.data.data.items;
    // All posts belong to alice
    for (const post of items) {
      expect(post.author.id).toBe(ALICE.id);
    }
  });

  it('GET /posts/users/{userId} — returns posts for specific user', async () => {
    const res = await api.get(`/posts/users/${ALICE.id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data.items)).toBe(true);
  });

  it('GET /posts/{id} — 404 for unknown post', async () => {
    await expect(api.get('/posts/nonexistent-post')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

describe('Reactions API', () => {
  it('POST /posts/{id}/reactions — react with LIKE', async () => {
    const res = await api.post(`/posts/${createdPostId}/reactions`, { reaction: 'LIKE' });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.reaction).toBe('LIKE');
  });

  it('GET /posts/{id} — user_reaction is LIKE after reacting', async () => {
    const res = await api.get(`/posts/${createdPostId}`);
    expect(res.data.data.user_reaction).toBe('LIKE');
    expect(res.data.data.stats.reactions).toBe(1);
  });

  it('POST /posts/{id}/reactions — upsert changes reaction type', async () => {
    const res = await api.post(`/posts/${createdPostId}/reactions`, { reaction: 'LOVE' });
    expect(res.status).toBe(200);
    expect(res.data.data.reaction).toBe('LOVE');
  });

  it('DELETE /posts/{id}/reactions — removes reaction', async () => {
    const res = await api.delete(`/posts/${createdPostId}/reactions`);
    expect(res.status).toBe(200);
    const postRes = await api.get(`/posts/${createdPostId}`);
    expect(postRes.data.data.user_reaction).toBeNull();
    expect(postRes.data.data.stats.reactions).toBe(0);
  });

  it('GET /posts/{id}/reactions — returns reaction list', async () => {
    const res = await api.get(`/posts/post-001/reactions`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data) || typeof res.data.data === 'object').toBe(true);
  });
});

describe('Posts cleanup', () => {
  it('DELETE /posts/{id} — deletes the created post', async () => {
    const res = await api.delete(`/posts/${createdPostId}`);
    expect(res.status).toBe(200);
    // Confirm it's gone
    await expect(api.get(`/posts/${createdPostId}`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
