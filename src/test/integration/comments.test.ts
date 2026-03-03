import { describe, it, expect, beforeAll } from 'vitest';
import { loginAs, authedClient, ALICE } from './testClient';
import type { AxiosInstance } from 'axios';

let api: AxiosInstance;
let commentId: string;
let replyId: string;

const SEED_POST_ID = 'post-001';

beforeAll(async () => {
  const token = await loginAs(ALICE.email, ALICE.password);
  api = authedClient(token);
});

describe('Comments API', () => {
  it('GET /posts/{id}/comments — returns seeded comments', async () => {
    const res = await api.get(`/posts/${SEED_POST_ID}/comments`);
    expect(res.status).toBe(200);
    const { items, pagination } = res.data.data;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    expect(pagination).toMatchObject({ has_next_page: expect.any(Boolean) });
  });

  it('GET /posts/{id}/comments — each comment has required fields', async () => {
    const res = await api.get(`/posts/${SEED_POST_ID}/comments`);
    for (const comment of res.data.data.items) {
      expect(comment).toMatchObject({
        id: expect.any(String),
        post_id: SEED_POST_ID,
        author: expect.objectContaining({ id: expect.any(String), username: expect.any(String) }),
        content: expect.any(String),
        stats: expect.objectContaining({ reactions: expect.any(Number), replies: expect.any(Number) }),
        created_at: expect.any(String),
      });
    }
  });

  it('POST /comments/ — creates a new comment', async () => {
    const res = await api.post('/comments/', {
      post_id: SEED_POST_ID,
      content_text: 'Hello from integration test',
      media_urls: [],
    });
    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    const comment = res.data.data;
    expect(comment).toMatchObject({
      id: expect.any(String),
      post_id: SEED_POST_ID,
      content: 'Hello from integration test',
      author: expect.objectContaining({ id: ALICE.id }),
    });
    commentId = comment.id;
  });

  it('PATCH /comments/{id} — updates comment text', async () => {
    const res = await api.patch(`/comments/${commentId}`, {
      content_text: 'Updated comment text',
    });
    expect(res.status).toBe(200);
    expect(res.data.data.content).toBe('Updated comment text');
  });

  it('POST /comments/{id}/replies — adds a reply', async () => {
    const res = await api.post(`/comments/${commentId}/replies`, {
      post_id: SEED_POST_ID,
      content_text: 'This is a reply',
      media_urls: [],
    });
    expect(res.status).toBe(201);
    const reply = res.data.data;
    expect(reply.parent_comment_id).toBe(commentId);
    replyId = reply.id;
  });

  it('GET /comments/{id}/replies — returns replies', async () => {
    const res = await api.get(`/comments/${commentId}/replies`);
    expect(res.status).toBe(200);
    const ids: string[] = res.data.data.items.map((c: { id: string }) => c.id);
    expect(ids).toContain(replyId);
  });

  it('POST /comments/{id}/reactions — react to comment', async () => {
    const res = await api.post(`/comments/${commentId}/reactions`, { reaction: 'LIKE' });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('DELETE /comments/{id}/reactions — remove reaction', async () => {
    const res = await api.delete(`/comments/${commentId}/reactions`);
    expect(res.status).toBe(200);
  });

  it('DELETE /comments/{id} — deletes comment', async () => {
    const res = await api.delete(`/comments/${commentId}`);
    expect(res.status).toBe(200);
  });

  it('PATCH /comments/{id} — 404 after deletion', async () => {
    await expect(
      api.patch(`/comments/${commentId}`, { content_text: 'ghost' })
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
});
