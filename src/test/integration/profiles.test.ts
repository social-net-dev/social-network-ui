import { describe, it, expect, beforeAll } from 'vitest';
import { loginAs, authedClient, ALICE, BOB } from './testClient';
import type { AxiosInstance } from 'axios';

let aliceApi: AxiosInstance;
let bobApi: AxiosInstance;

beforeAll(async () => {
  const [aliceToken, bobToken] = await Promise.all([
    loginAs(ALICE.email, ALICE.password),
    loginAs(BOB.email, BOB.password),
  ]);
  aliceApi = authedClient(aliceToken);
  bobApi = authedClient(bobToken);
});

describe('Profiles API', () => {
  it('GET /profiles/{username} — returns full user object', async () => {
    const res = await aliceApi.get(`/profiles/${BOB.username}`);
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    const user = res.data.data;
    expect(user).toMatchObject({
      id: BOB.id,
      username: BOB.username,
      display_name: expect.any(String),
      account_status: 'active',
    });
  });

  it('GET /profiles/{username} — viewer_context is NOT null', async () => {
    const res = await aliceApi.get(`/profiles/${BOB.username}`);
    const ctx = res.data.data.viewer_context;
    expect(ctx).not.toBeNull();
    expect(ctx).toMatchObject({
      is_owner: expect.any(Boolean),
      is_friend: expect.any(Boolean),
      friendship_status: expect.any(String),
    });
  });

  it('GET /profiles/{username} — is_owner=false when viewing other user', async () => {
    const res = await aliceApi.get(`/profiles/${BOB.username}`);
    expect(res.data.data.viewer_context.is_owner).toBe(false);
  });

  it('GET /profiles/{username} — is_owner=true when viewing own profile', async () => {
    const res = await aliceApi.get(`/profiles/${ALICE.username}`);
    expect(res.data.data.viewer_context.is_owner).toBe(true);
  });

  it('GET /profiles/{username} — alice and bob are friends (seeded)', async () => {
    const res = await aliceApi.get(`/profiles/${BOB.username}`);
    expect(res.data.data.viewer_context.is_friend).toBe(true);
    expect(res.data.data.viewer_context.friendship_status).toBe('FRIENDS');
  });

  it('GET /profiles/{username} — 404 for unknown username', async () => {
    await expect(aliceApi.get('/profiles/noone_unknown_xyz')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it('GET /users/me — returns private user fields', async () => {
    const res = await aliceApi.get('/users/me');
    expect(res.status).toBe(200);
    const me = res.data.data;
    expect(me).toMatchObject({
      id: ALICE.id,
      email: ALICE.email,
      username: ALICE.username,
      privacy: expect.objectContaining({ default_visibility: expect.any(String) }),
    });
  });
});

describe('Follows API', () => {
  it('POST /users/{userId}/follow — alice follows bob', async () => {
    // Unfollow first to reset state
    await aliceApi.delete(`/users/${BOB.id}/follow`).catch(() => {});
    const res = await aliceApi.post(`/users/${BOB.id}/follow`);
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('GET /users/{userId}/followers — bob has alice as follower', async () => {
    const res = await bobApi.get(`/users/${BOB.id}/followers`);
    expect(res.status).toBe(200);
    const followerIds: string[] = res.data.data.items.map((u: { id: string }) => u.id);
    expect(followerIds).toContain(ALICE.id);
  });

  it('GET /users/{userId}/following — alice follows bob', async () => {
    const res = await aliceApi.get(`/users/${ALICE.id}/following`);
    expect(res.status).toBe(200);
    const followingIds: string[] = res.data.data.items.map((u: { id: string }) => u.id);
    expect(followingIds).toContain(BOB.id);
  });

  it('DELETE /users/{userId}/follow — alice unfollows bob', async () => {
    const res = await aliceApi.delete(`/users/${BOB.id}/follow`);
    expect(res.status).toBe(200);
    const followersRes = await bobApi.get(`/users/${BOB.id}/followers`);
    const ids: string[] = followersRes.data.data.items.map((u: { id: string }) => u.id);
    expect(ids).not.toContain(ALICE.id);
  });
});
