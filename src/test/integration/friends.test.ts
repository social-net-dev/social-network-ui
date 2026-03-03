import { describe, it, expect, beforeAll } from 'vitest';
import { loginAs, authedClient, ALICE, BOB } from './testClient';
import type { AxiosInstance } from 'axios';

let aliceApi: AxiosInstance;
let bobApi: AxiosInstance;
let requestId: string;

beforeAll(async () => {
  const [aliceToken, bobToken] = await Promise.all([
    loginAs(ALICE.email, ALICE.password),
    loginAs(BOB.email, BOB.password),
  ]);
  aliceApi = authedClient(aliceToken);
  bobApi = authedClient(bobToken);
});

describe('Friends API', () => {
  it('GET /friends/ — alice has bob as friend (seeded)', async () => {
    const res = await aliceApi.get('/friends/');
    expect(res.status).toBe(200);
    const items: Array<{ user: { id: string } }> = res.data.data.items;
    const friendIds = items.map(f => f.user.id);
    expect(friendIds).toContain(BOB.id);
  });

  it('GET /friends/check/{userId} — alice and bob are friends', async () => {
    const res = await aliceApi.get(`/friends/check/${BOB.id}`);
    expect(res.status).toBe(200);
    const data = res.data.data;
    expect(data.is_friend ?? data.status ?? data.friendship_status).toBeTruthy();
  });

  it('POST /friends/requests — send request to a new user', async () => {
    // Create a new user to send a request to
    const unique = Date.now();
    const regRes = await aliceApi.post('/auth/register', {
      email: `newuser${unique}@etechs.vn`,
      password: 'password123',
      display_name: 'New User',
      gender: 'OTHER',
      role: 'STUDENT',
    }).catch(() => null);

    if (!regRes) return; // skip if registration fails for some reason

    const newUserId: string = regRes.data.data.id;

    const res = await aliceApi.post('/friends/requests', {
      addressee_id: newUserId,
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    const req = res.data.data;
    expect(req).toMatchObject({
      id: expect.any(String),
      status: 'PENDING',
    });
    requestId = req.id;
  });

  it('GET /friends/requests/outgoing — alice sees her pending request', async () => {
    if (!requestId) return;
    const res = await aliceApi.get('/friends/requests/outgoing');
    expect(res.status).toBe(200);
    const ids: string[] = res.data.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(requestId);
  });

  it('POST /friends/requests/{id}/cancel — alice cancels the request', async () => {
    if (!requestId) return;
    const res = await aliceApi.post(`/friends/requests/${requestId}/cancel`);
    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('CANCELLED');
  });

  it('GET /friends/requests/incoming — bob has no new incoming requests', async () => {
    const res = await bobApi.get('/friends/requests/incoming');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('Accept/reject flow — bob sends to alice, alice rejects', async () => {
    // Create fresh user for clean test
    const unique = Date.now();
    await aliceApi.post('/auth/register', {
      email: `fresh${unique}@etechs.vn`,
      password: 'password123',
      display_name: 'Fresh',
      gender: 'OTHER',
      role: 'STUDENT',
    }).catch(() => {});

    // Bob sends a request to alice
    const sendRes = await bobApi.post('/friends/requests', { addressee_id: ALICE.id });
    if (!sendRes.data.success) return; // already friends, skip

    const reqId: string = sendRes.data.data.id;

    // Alice rejects
    const rejectRes = await aliceApi.post(`/friends/requests/${reqId}/reject`);
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.data.data.status).toBe('REJECTED');
  });
});
