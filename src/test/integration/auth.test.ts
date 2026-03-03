import { describe, it, expect } from 'vitest';
import { client, ALICE } from './testClient';

describe('Auth API', () => {
  it('POST /auth/login — success returns access + refresh token', async () => {
    const res = await client.post('/auth/login', {
      email: ALICE.email,
      password: ALICE.password,
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toMatchObject({
      access: expect.any(String),
      refresh: expect.any(String),
      tenant_slug: expect.any(String),
    });
  });

  it('POST /auth/login — wrong password returns 401', async () => {
    await expect(
      client.post('/auth/login', { email: ALICE.email, password: 'wrong_password' })
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('POST /auth/login — unknown email returns 401', async () => {
    await expect(
      client.post('/auth/login', { email: 'noone@etechs.vn', password: 'password123' })
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it('POST /auth/register — creates new user', async () => {
    const unique = Date.now();
    const res = await client.post('/auth/register', {
      email: `test${unique}@etechs.vn`,
      password: 'password123',
      display_name: 'Test User',
      gender: 'OTHER',
      role: 'STUDENT',
    });
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data).toMatchObject({
      email: `test${unique}@etechs.vn`,
      id: expect.any(String),
    });
  });

  it('POST /auth/register — duplicate email returns 409', async () => {
    await expect(
      client.post('/auth/register', {
        email: ALICE.email,
        password: 'password123',
        display_name: 'Dupe',
        gender: 'OTHER',
        role: 'STUDENT',
      })
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  it('POST /auth/refresh — returns new access token', async () => {
    const loginRes = await client.post('/auth/login', {
      email: ALICE.email,
      password: ALICE.password,
    });
    const refresh: string = loginRes.data.data.refresh;
    const res = await client.post('/auth/refresh', { refresh });
    expect(res.status).toBe(200);
    expect(res.data.data).toMatchObject({ access: expect.any(String) });
  });
});
