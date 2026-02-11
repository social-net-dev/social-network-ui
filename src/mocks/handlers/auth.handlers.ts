/**
 * Auth API Handlers
 * Handles: login, register, verify-otp, resend-otp, users/me
 */
import { http, HttpResponse, delay } from 'msw';
import { currentMockUser } from '../fixtures';

export const authHandlers = [
  // ============================================
  // POST /auth/login
  // ============================================
  http.post('*api/auth/login', async () => {
    await delay(500);
    // Match backend format EXACTLY: { access, refresh, tenant_slug }
    return HttpResponse.json({
      success: true,
      data: {
        access: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-${Date.now()}`,
        refresh: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-${Date.now()}`,
        tenant_slug: `t-${currentMockUser.id}`, // Format: t-{uuid}
      },
    });
  }),

  // ============================================
  // POST /auth/register
  // ============================================
  http.post('*/auth/register', async () => {
    await delay(800);
    return HttpResponse.json({
      success: true,
      data: {
        user_id: `new-user-${Date.now()}`,
        message: 'OTP đã được gửi đến email của bạn',
      },
    });
  }),

  // ============================================
  // POST /auth/verify-otp
  // ============================================
  http.post('*/auth/verify-otp', async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Xác thực OTP thành công',
      },
    });
  }),

  // ============================================
  // POST /auth/resend-otp
  // ============================================
  http.post('*/auth/resend-otp', async () => {
    await delay(600);
    return HttpResponse.json({
      success: true,
      data: {
        message: 'OTP mới đã được gửi',
      },
    });
  }),

  // ============================================
  // POST /auth/refresh
  // ============================================
  http.post('*/auth/refresh', async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        access: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refreshed-${Date.now()}`,
      },
    });
  }),

  // ============================================
  // POST /auth/logout
  // ============================================
  http.post('*/auth/logout', async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // ============================================
  // GET /users/me & /auth/me
  // ============================================
  http.get('*/users/me*', async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        ...currentMockUser,
        role: 'USER',
        tenant_slug: `t-${currentMockUser.id}`,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    });
  }),

  http.get('*/auth/me*', async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: {
        ...currentMockUser,
        role: 'USER',
        tenant_slug: `t-${currentMockUser.id}`,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    });
  }),
];
