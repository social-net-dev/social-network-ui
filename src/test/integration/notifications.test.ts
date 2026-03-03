import { describe, it, expect, beforeAll } from 'vitest';
import { loginAs, authedClient, ALICE } from './testClient';
import type { AxiosInstance } from 'axios';

let api: AxiosInstance;

beforeAll(async () => {
  const token = await loginAs(ALICE.email, ALICE.password);
  api = authedClient(token);
});

describe('Notifications API', () => {
  it('GET /notifications/ — returns items and pagination', async () => {
    const res = await api.get('/notifications/');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    const { items, pagination } = res.data.data;
    expect(Array.isArray(items)).toBe(true);
    expect(pagination).toMatchObject({ has_next_page: expect.any(Boolean) });
  });

  it('GET /notifications/ — each item has required fields', async () => {
    const res = await api.get('/notifications/');
    for (const notif of res.data.data.items) {
      expect(notif).toMatchObject({
        id: expect.any(String),
        type: expect.any(String),
        is_read: expect.any(Boolean),
        created_at: expect.any(String),
      });
    }
  });

  it('GET /notifications/ — seeded notifications exist', async () => {
    const res = await api.get('/notifications/');
    expect(res.data.data.items.length).toBeGreaterThan(0);
  });

  it('GET /notifications/unread-count — returns numeric count', async () => {
    const res = await api.get('/notifications/unread-count');
    expect(res.status).toBe(200);
    expect(res.data.data.unread_count).toBeGreaterThanOrEqual(0);
  });

  it('POST /notifications/{id}/read — marks one notification as read', async () => {
    const listRes = await api.get('/notifications/');
    const unread: Array<{ id: string; is_read: boolean }> = listRes.data.data.items.filter(
      (n: { is_read: boolean }) => !n.is_read
    );
    if (unread.length === 0) return; // nothing to test

    const notifId = unread[0].id;
    const res = await api.post(`/notifications/${notifId}/read`);
    expect(res.status).toBe(200);

    // Verify count decreased
    const countRes = await api.get('/notifications/unread-count');
    expect(countRes.data.data.unread_count).toBeLessThan(unread.length);
  });

  it('POST /notifications/read-all — marks all as read, count becomes 0', async () => {
    const res = await api.post('/notifications/read-all');
    expect(res.status).toBe(200);

    const countRes = await api.get('/notifications/unread-count');
    expect(countRes.data.data.unread_count).toBe(0);
  });

  it('GET /notifications/?limit=1 — cursor pagination works', async () => {
    const page1 = await api.get('/notifications/?limit=1');
    const { items, pagination } = page1.data.data;
    if (items.length === 0 || !pagination.next_cursor) return;

    const page2 = await api.get(
      `/notifications/?limit=1&cursor=${encodeURIComponent(pagination.next_cursor)}`
    );
    expect(page2.status).toBe(200);
    const id1: string = items[0].id;
    const id2: string = page2.data.data.items[0]?.id;
    if (id2) expect(id2).not.toBe(id1);
  });

  it('DELETE /notifications/{id} — deletes a notification', async () => {
    const listRes = await api.get('/notifications/');
    const items: Array<{ id: string }> = listRes.data.data.items;
    if (items.length === 0) return;

    const notifId = items[0].id;
    const res = await api.delete(`/notifications/${notifId}`);
    expect(res.status).toBe(200);
  });
});
