/**
 * Shared axios client for integration tests.
 * Points directly at the running backend: http://localhost:8000/api
 */
import axios from 'axios';

const BASE_URL = typeof process !== 'undefined' ? (process.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api') : 'http://localhost:8000/api';

export const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/** Login and return the access token. */
export async function loginAs(email: string, password: string): Promise<string> {
  const res = await client.post('/auth/login', { email, password });
  const token: string = res.data?.data?.access;
  if (!token) throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  return token;
}

/** Create an axios instance pre-configured with a Bearer token. */
export function authedClient(token: string) {
  return axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

export const ALICE = { email: 'alice@etechs.vn', password: 'password123', id: 'user-001', username: 'alice' };
export const BOB   = { email: 'bob@etechs.vn',   password: 'password123', id: 'user-002', username: 'bob' };
