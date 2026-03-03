/**
 * MSW custom handlers — single source of truth: src/mocks/db/index.ts
 *
 * Covers all endpoints in the OpenAPI spec with stateful, realistic behaviour.
 * Non-contract features (groups, marketplace, messages) keep local state here.
 */
import { delay, HttpResponse, http } from 'msw';
import type {
  Comment,
  CreatePostRequest,
  FriendRequest,
  LoginRequest,
  PostSummary,
  ReactionType,
  UserPublic,
} from '@/lib/api/generated/model';
import { db, AUTHORS } from './db';
import { makeId } from './factories';

// ─── helpers ──────────────────────────────────────────────────────────────────

const rid = () => `req_${Date.now()}`;
const ok = (data: unknown) => HttpResponse.json({ success: true, data, request_id: rid() });
const notFound = (msg = 'Not found') =>
  HttpResponse.json({ success: false, error: msg }, { status: 404 });

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = Math.max(0, (page - 1) * pageSize);
  return items.slice(start, start + pageSize);
}

function paginatedData<T>(items: T[], page: number, pageSize: number, total: number) {
  return {
    items: paginate(items, page, pageSize),
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

function qp(req: Request, key: string, fallback: string | number | null = null) {
  const v = new URL(req.url).searchParams.get(key);
  if (v === null) return fallback;
  if (typeof fallback === 'number') return Number(v) || fallback;
  return v;
}

const toMediaUrls = (ids?: string[]) =>
  (ids ?? []).map((id) => `https://mock-cdn.example.com/assets/${id}`);

// ─── non-contract seed data (groups, marketplace, messages) ──────────────────

const allGroups = [
  { id: 'react-vietnam', name: 'React Vietnam Community', description: 'Cộng đồng React developers Việt Nam.', avatarUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', bannerUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200', stats: { membersCount: 3421, posts_count: 892, onlineCount: 156 }, isJoined: true, tags: ['React', 'Next.js', 'JavaScript'], type: 'PUBLIC', created_at: new Date(Date.now() - 365 * 86_400_000).toISOString() },
  { id: 'ai-ml-vietnam', name: 'AI/ML Vietnam', description: 'Nhóm nghiên cứu AI/ML tại Việt Nam.', avatarUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400', bannerUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200', stats: { membersCount: 2856, posts_count: 1234, onlineCount: 89 }, isJoined: false, tags: ['AI', 'Machine Learning', 'Python'], type: 'PUBLIC', created_at: new Date(Date.now() - 400 * 86_400_000).toISOString() },
  { id: 'devops-vn', name: 'DevOps Vietnam', description: 'Cộng đồng DevOps Việt Nam.', avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200', stats: { membersCount: 1923, posts_count: 567, onlineCount: 67 }, isJoined: true, tags: ['DevOps', 'Kubernetes', 'Docker'], type: 'PUBLIC', created_at: new Date(Date.now() - 280 * 86_400_000).toISOString() },
  { id: 'ux-design-vn', name: 'UX/UI Design Vietnam', description: 'Cộng đồng designer Việt Nam.', avatarUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=400', bannerUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=1200', stats: { membersCount: 2678, posts_count: 445, onlineCount: 98 }, isJoined: false, tags: ['UI/UX', 'Design', 'Figma'], type: 'PUBLIC', created_at: new Date(Date.now() - 320 * 86_400_000).toISOString() },
  { id: 'backend-vietnam', name: 'Backend Vietnam', description: 'Cộng đồng backend developers Việt Nam.', avatarUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', bannerUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200', stats: { membersCount: 2234, posts_count: 678, onlineCount: 112 }, isJoined: true, tags: ['Backend', 'API', 'Database'], type: 'PUBLIC', created_at: new Date(Date.now() - 450 * 86_400_000).toISOString() },
];

const allMarketplaceItems = [
  { id: 'course-react-advanced', title: 'React Advanced Patterns', description: 'Khóa học chuyên sâu về React patterns.', price: 2990000, type: 'COURSE', category: 'Frontend Development', seller: { id: AUTHORS.hoang.id, name: AUTHORS.hoang.display_name, avatar: AUTHORS.hoang.avatar, rating: 4.8, reviewsCount: 234 }, thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400', tags: ['React', 'JavaScript', 'Frontend'], stats: { studentsCount: 1234, rating: 4.8, reviewsCount: 156 }, isPurchased: false, created_at: new Date(Date.now() - 30 * 86_400_000).toISOString() },
  { id: 'book-system-design', title: 'System Design Interview Guide', description: 'Ebook toàn tập về system design.', price: 499000, type: 'EBOOK', category: 'Career Development', seller: { id: AUTHORS.duy.id, name: AUTHORS.duy.display_name, avatar: AUTHORS.duy.avatar, rating: 4.6, reviewsCount: 89 }, thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400', tags: ['System Design', 'Interview', 'Backend'], stats: { studentsCount: 892, rating: 4.6, reviewsCount: 78 }, isPurchased: true, created_at: new Date(Date.now() - 45 * 86_400_000).toISOString() },
  { id: 'service-code-review', title: 'Code Review Service', description: 'Dịch vụ review code frontend.', price: 500000, type: 'SERVICE', category: 'Code Review', seller: { id: AUTHORS.linh.id, name: AUTHORS.linh.display_name, avatar: AUTHORS.linh.avatar, rating: 4.9, reviewsCount: 67 }, thumbnailUrl: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=400', tags: ['Code Review', 'Frontend', 'Mentoring'], stats: { studentsCount: 234, rating: 4.9, reviewsCount: 45 }, isPurchased: false, created_at: new Date(Date.now() - 15 * 86_400_000).toISOString() },
  { id: 'workshop-devops', title: 'DevOps Hands-on Workshop', description: 'Workshop thực chiến CI/CD, Docker, Kubernetes.', price: 1890000, type: 'WORKSHOP', category: 'DevOps', seller: { id: AUTHORS.an.id, name: AUTHORS.an.display_name, avatar: AUTHORS.an.avatar, rating: 4.8, reviewsCount: 156 }, thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', tags: ['DevOps', 'Docker', 'Kubernetes'], stats: { studentsCount: 445, rating: 4.8, reviewsCount: 67 }, isPurchased: true, created_at: new Date(Date.now() - 10 * 86_400_000).toISOString() },
];

const allConversations = [
  { id: 'conv_001', type: 'DIRECT', name: AUTHORS.hoang.display_name, other_user: { id: AUTHORS.hoang.id, display_name: AUTHORS.hoang.display_name, avatar: AUTHORS.hoang.avatar, username: AUTHORS.hoang.username }, last_message: { id: 'msg_001', sender_id: AUTHORS.hoang.id, created_at: new Date(Date.now() - 10 * 60_000).toISOString(), snippet: 'Nhớ commit trước khi merge nhé!' }, unread: 1, created_at: new Date(Date.now() - 90 * 86_400_000).toISOString() },
  { id: 'conv_002', type: 'DIRECT', name: AUTHORS.linh.display_name, other_user: { id: AUTHORS.linh.id, display_name: AUTHORS.linh.display_name, avatar: AUTHORS.linh.avatar, username: AUTHORS.linh.username }, last_message: { id: 'msg_002', sender_id: AUTHORS.linh.id, created_at: new Date(Date.now() - 3 * 3_600_000).toISOString(), snippet: 'Bạn có thể share branch đó không?' }, unread: 0, created_at: new Date(Date.now() - 60 * 86_400_000).toISOString() },
  { id: 'conv_003', type: 'DIRECT', name: AUTHORS.phuc.display_name, other_user: { id: AUTHORS.phuc.id, display_name: AUTHORS.phuc.display_name, avatar: AUTHORS.phuc.avatar, username: AUTHORS.phuc.username }, last_message: { id: 'msg_003', sender_id: 'usr_student_001', created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(), snippet: 'Cảm ơn bạn nhiều!' }, unread: 0, created_at: new Date(Date.now() - 45 * 86_400_000).toISOString() },
];

const allMessages = [
  { id: 'msg_001', room_id: 'conv_001', sender_id: AUTHORS.hoang.id, ciphertext: 'Nhớ commit trước khi merge nhé!', created_at: new Date(Date.now() - 10 * 60_000).toISOString(), attachment_urls: null, pinned: false, reactions: [] },
  { id: 'msg_001b', room_id: 'conv_001', sender_id: 'usr_student_001', ciphertext: 'Vâng mentor, em sẽ làm ngay!', created_at: new Date(Date.now() - 8 * 60_000).toISOString(), attachment_urls: null, pinned: false, reactions: [] },
  { id: 'msg_002', room_id: 'conv_002', sender_id: AUTHORS.linh.id, ciphertext: 'Bạn có thể share branch đó không?', created_at: new Date(Date.now() - 3 * 3_600_000).toISOString(), attachment_urls: null, pinned: false, reactions: [] },
  { id: 'msg_003', room_id: 'conv_003', sender_id: 'usr_student_001', ciphertext: 'Cảm ơn bạn nhiều!', created_at: new Date(Date.now() - 1 * 86_400_000).toISOString(), attachment_urls: null, pinned: false, reactions: [] },
];

const allAdminUsers = [
  { ...AUTHORS.hiru, email: 'hiru@example.com', account_status: 'ACTIVE', role: 'USER', created_at: new Date(Date.now() - 280 * 86_400_000).toISOString(), last_active: new Date(Date.now() - 5 * 60_000).toISOString(), posts_count: 42, verification_status: 'VERIFIED' },
  { ...AUTHORS.admin, email: 'admin@etechs.vn', account_status: 'ACTIVE', role: 'ADMIN', created_at: new Date(Date.now() - 640 * 86_400_000).toISOString(), last_active: new Date(Date.now() - 30 * 60_000).toISOString(), posts_count: 8, verification_status: 'VERIFIED' },
  { ...AUTHORS.hoang, email: 'hoang@etechs.vn', account_status: 'ACTIVE', role: 'TEACHER', created_at: new Date(Date.now() - 700 * 86_400_000).toISOString(), last_active: new Date(Date.now() - 2 * 3_600_000).toISOString(), posts_count: 156, verification_status: 'VERIFIED' },
  { ...AUTHORS.linh, email: 'linh@example.com', account_status: 'ACTIVE', role: 'USER', created_at: new Date(Date.now() - 620 * 86_400_000).toISOString(), last_active: new Date(Date.now() - 6 * 3_600_000).toISOString(), posts_count: 72, verification_status: 'PENDING' },
  { ...AUTHORS.phuc, email: 'phuc@example.com', account_status: 'ACTIVE', role: 'USER', created_at: new Date(Date.now() - 450 * 86_400_000).toISOString(), last_active: new Date(Date.now() - 1 * 86_400_000).toISOString(), posts_count: 38, verification_status: 'VERIFIED' },
];

// ─── recommendations seed ─────────────────────────────────────────────────────

const SUGGESTIONS = [AUTHORS.duy, AUTHORS.mai, AUTHORS.an, AUTHORS.phuc].map((a) => ({
  id: a.id,
  name: a.display_name,
  username: a.username,
  avatar_path: null,
  role: a.role,
  friend_status: 'NONE',
  friend_request_id: null,
  connected_via: 'Có cùng lĩnh vực quan tâm',
}));

// ─── handlers ─────────────────────────────────────────────────────────────────

export const customHandlers = [

  // ── Auth ──────────────────────────────────────────────────────────────────
  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    await delay(350);
    db.switchUser(body.email.toLowerCase().includes('admin') ? 'admin' : 'student');
    return ok({ access: 'mock_access_token', refresh: 'mock_refresh_token', tenant_slug: 'etechs' });
  }),

  http.post('*/auth/logout', async () => {
    await delay(100);
    return ok({ message: 'Đã đăng xuất' });
  }),

  http.post('*/auth/refresh', async () => {
    await delay(150);
    return ok({ access: 'mock_access_token_new', refresh: 'mock_refresh_token_new', tenant_slug: 'etechs' });
  }),

  http.post('*/auth/register', async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    await delay(500);
    return HttpResponse.json({ success: true, data: { message: `Đã gửi OTP đến ${body.email ?? 'email'}` }, request_id: rid() }, { status: 201 });
  }),

  http.post('*/auth/verify-otp', async () => {
    await delay(300);
    return ok({ message: 'Xác thực thành công' });
  }),

  http.post('*/auth/resend-otp', async () => {
    await delay(200);
    return ok({ message: 'Đã gửi lại OTP' });
  }),

  http.post('*/auth/forgot-password', async () => {
    await delay(300);
    return ok({ message: 'Đã gửi link đặt lại mật khẩu' });
  }),

  http.post('*/auth/reset-password', async () => {
    await delay(300);
    return ok({ message: 'Đặt lại mật khẩu thành công' });
  }),

  http.post('*/auth/change-password', async () => {
    await delay(300);
    return ok({ message: 'Đổi mật khẩu thành công' });
  }),

  http.get('*/auth/me', async () => {
    await delay(120);
    return ok(db.currentUser);
  }),

  // ── Users ──────────────────────────────────────────────────────────────────
  http.get('*/users/me/', async () => {
    await delay(120);
    return ok(db.currentUser);
  }),

  http.get('*/users/me', async () => {
    await delay(120);
    return ok(db.currentUser);
  }),

  http.patch('*/users/me/profile', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    await delay(250);
    if (body.display_name !== undefined) db.currentUser.display_name = body.display_name as string;
    if (body.username !== undefined) db.currentUser.username = body.username as string;
    if (body.bio !== undefined) db.currentUser.bio = body.bio as string;
    if (body.birth_date !== undefined) db.currentUser.birth_date = body.birth_date as string;
    if (body.personal_info !== undefined) {
      db.currentUser.personal_info = { ...db.currentUser.personal_info, ...(body.personal_info as Record<string, unknown>) } as typeof db.currentUser.personal_info;
    }
    db.currentUser.updated_at = new Date().toISOString();
    return ok(db.currentUser);
  }),

  http.get('*/users/me/privacy', async () => {
    await delay(150);
    return ok(db.privacy);
  }),

  http.patch('*/users/me/privacy', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    await delay(200);
    db.updatePrivacy(body as Parameters<typeof db.updatePrivacy>[0]);
    return ok(db.privacy);
  }),

  http.post('*/users/me/avatar', async ({ request }) => {
    await delay(400);
    const formData = await request.formData().catch(() => null);
    const assetId = formData?.get('asset_id') as string | null;
    if (assetId) db.currentUser.avatar = `https://mock-cdn.example.com/assets/${assetId}`;
    return ok(db.currentUser);
  }),

  http.post('*/users/me/background', async ({ request }) => {
    await delay(400);
    const formData = await request.formData().catch(() => null);
    const assetId = formData?.get('asset_id') as string | null;
    if (assetId) db.currentUser.background = `https://mock-cdn.example.com/assets/${assetId}`;
    return ok(db.currentUser);
  }),

  http.post('*/users/me/deactivate', async () => {
    await delay(300);
    return ok({ message: 'Tài khoản đã được vô hiệu hoá' });
  }),

  http.post('*/users/me/reactivate', async () => {
    await delay(300);
    return ok({ message: 'Tài khoản đã được kích hoạt lại' });
  }),

  http.post('*/users/me/reactivation-requests', async () => {
    await delay(300);
    return ok({ message: 'Đã gửi yêu cầu kích hoạt lại' });
  }),

  // ── Profiles ───────────────────────────────────────────────────────────────
  http.get('*/profiles/:username', async ({ params }) => {
    const username = String(params.username ?? '').toLowerCase();
    await delay(220);

    const profile = db.getProfile(username);
    if (!profile) return notFound('Không tìm thấy profile');
    return ok(profile);
  }),

  // ── Feed ───────────────────────────────────────────────────────────────────
  http.get('*/feed', async ({ request }) => {
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 5) as number;
    const postType = qp(request, 'post_type') as string | null;
    const fieldId = qp(request, 'field_id') as string | null;

    let filtered = db.posts;
    if (postType) filtered = filtered.filter((p) => p.post_type === postType);
    if (fieldId) filtered = filtered.filter((p) => p.field_id === fieldId);

    await delay(400);
    return ok(paginatedData(filtered, page, pageSize, filtered.length));
  }),

  // ── Posts ──────────────────────────────────────────────────────────────────
  http.get('*/posts/', async ({ request }) => {
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 10) as number;
    await delay(300);
    return ok(paginatedData(db.posts, page, pageSize, db.posts.length));
  }),

  http.post('*/posts/', async ({ request }) => {
    const body = (await request.json()) as CreatePostRequest;
    await delay(400);

    const author = {
      id: db.currentUser.id,
      display_name: db.currentUser.display_name,
      username: db.currentUser.username,
      avatar: db.currentUser.avatar ?? null,
      role: db.currentUser.role,
      account_status: db.currentUser.account_status,
    };

    const newPost: PostSummary = {
      id: makeId('post'),
      author,
      content: body.content_text,
      media_urls: toMediaUrls(body.media_asset_ids),
      media: [],
      stats: { reactions: 0, comments: 0, shares: 0 },
      user_reaction: null,
      visibility: (body.visibility ?? 'PUBLIC') as PostSummary['visibility'],
      post_type: (body.post_type ?? 'SOCIAL') as PostSummary['post_type'],
      field_id: body.field_id ?? undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.createPost(newPost);
    db.currentUser.posts_count = (db.currentUser.posts_count ?? 0) + 1;
    return HttpResponse.json({ success: true, data: newPost, request_id: rid() }, { status: 201 });
  }),

  http.get('*/posts/me', async ({ request }) => {
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 10) as number;
    const filtered = db.posts.filter((p) => p.author.id === db.currentUser.id);
    await delay(300);
    return ok(paginatedData(filtered, page, pageSize, filtered.length));
  }),

  http.get('*/posts/users/:userId', async ({ request, params }) => {
    const userId = String(params.userId ?? '');
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 10) as number;
    const filtered = db.posts.filter((p) => p.author.id === userId);
    await delay(300);
    return ok(paginatedData(filtered, page, pageSize, filtered.length));
  }),

  http.get('*/posts/:postId/comments', async ({ request, params }) => {
    const postId = String(params.postId ?? '');
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 20) as number;
    const comments = db.getComments(postId);
    await delay(200);
    return ok(paginatedData(comments, page, pageSize, comments.length));
  }),

  http.get('*/posts/:postId', async ({ params }) => {
    const postId = String(params.postId ?? '');
    await delay(200);
    const post = db.getPost(postId);
    if (!post) return notFound('Bài viết không tồn tại');
    return ok({ ...post, shared_post: null });
  }),

  http.patch('*/posts/:postId', async ({ request, params }) => {
    const postId = String(params.postId ?? '');
    const body = (await request.json()) as Record<string, unknown>;
    await delay(300);

    const post = db.getPost(postId);
    if (!post) return notFound('Bài viết không tồn tại');
    if (post.author.id !== db.currentUser.id) {
      return HttpResponse.json({ success: false, error: 'Không có quyền chỉnh sửa' }, { status: 403 });
    }

    const updated = db.updatePost(postId, {
      content: (body.content_text as string) ?? post.content,
      visibility: (body.visibility as PostSummary['visibility']) ?? post.visibility,
    });
    return ok(updated);
  }),

  http.delete('*/posts/:postId', async ({ params }) => {
    const postId = String(params.postId ?? '');
    await delay(250);
    const post = db.getPost(postId);
    if (!post) return notFound('Bài viết không tồn tại');
    if (post.author.id !== db.currentUser.id) {
      return HttpResponse.json({ success: false, error: 'Không có quyền xóa' }, { status: 403 });
    }
    db.deletePost(postId);
    db.currentUser.posts_count = Math.max(0, (db.currentUser.posts_count ?? 0) - 1);
    return ok({ message: 'Đã xóa bài viết' });
  }),

  // ── Comments ───────────────────────────────────────────────────────────────
  http.post('*/comments/', async ({ request }) => {
    const body = (await request.json()) as { post_id: string; content_text: string; media_asset_ids?: string[] };
    await delay(180);

    const comment: Comment = {
      id: makeId('cmt'),
      post_id: body.post_id,
      parent_comment_id: null,
      author: { id: db.currentUser.id, display_name: db.currentUser.display_name, username: db.currentUser.username, avatar: db.currentUser.avatar ?? null, role: db.currentUser.role, account_status: db.currentUser.account_status },
      content: body.content_text,
      media_urls: toMediaUrls(body.media_asset_ids),
      stats: { reactions: 0, replies: 0 },
      user_reaction: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.addComment(comment);
    const post = db.getPost(body.post_id);
    if (post) db.updatePost(body.post_id, { stats: { ...post.stats, comments: post.stats.comments + 1 } });

    return HttpResponse.json({ success: true, data: comment, request_id: rid() }, { status: 201 });
  }),

  http.post('*/comments/:commentId/replies', async ({ request, params }) => {
    const parentCommentId = String(params.commentId ?? '');
    const body = (await request.json()) as { post_id: string; content_text: string; media_asset_ids?: string[] };
    await delay(180);

    const reply: Comment = {
      id: makeId('cmt'),
      post_id: body.post_id,
      parent_comment_id: parentCommentId,
      author: { id: db.currentUser.id, display_name: db.currentUser.display_name, username: db.currentUser.username, avatar: db.currentUser.avatar ?? null, role: db.currentUser.role, account_status: db.currentUser.account_status },
      content: body.content_text,
      media_urls: toMediaUrls(body.media_asset_ids),
      stats: { reactions: 0, replies: 0 },
      user_reaction: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.addComment(reply);
    db.updateComment(parentCommentId, { stats: { ...db.findComment(parentCommentId)?.comment.stats ?? { reactions: 0, replies: 0 }, replies: (db.findComment(parentCommentId)?.comment.stats.replies ?? 0) + 1 } });

    const post = db.getPost(body.post_id);
    if (post) db.updatePost(body.post_id, { stats: { ...post.stats, comments: post.stats.comments + 1 } });

    return HttpResponse.json({ success: true, data: reply, request_id: rid() }, { status: 201 });
  }),

  http.patch('*/comments/:commentId', async ({ request, params }) => {
    const commentId = String(params.commentId ?? '');
    const body = (await request.json()) as { content_text?: string };
    await delay(150);

    const loc = db.findComment(commentId);
    if (!loc) return notFound('Bình luận không tồn tại');

    const updated = db.updateComment(commentId, { content: body.content_text ?? loc.comment.content });
    return ok(updated);
  }),

  http.delete('*/comments/:commentId', async ({ params }) => {
    const commentId = String(params.commentId ?? '');
    await delay(150);

    const loc = db.findComment(commentId);
    if (!loc) return notFound('Bình luận không tồn tại');

    const post = db.getPost(loc.post_id);
    db.deleteComment(commentId);
    if (post) db.updatePost(loc.post_id, { stats: { ...post.stats, comments: Math.max(0, post.stats.comments - 1) } });

    return ok({ message: 'Đã xóa bình luận' });
  }),

  // ── Reactions ──────────────────────────────────────────────────────────────
  http.post('*/posts/:postId/reactions', async ({ request, params }) => {
    const postId = String(params.postId ?? '');
    const body = (await request.json()) as { reaction: ReactionType };
    await delay(120);

    db.reactToPost(postId, body.reaction);
    return ok({ id: makeId('reaction'), post_id: postId, user_id: db.currentUser.id, reaction: body.reaction, created_at: new Date().toISOString() });
  }),

  http.delete('*/posts/:postId/reactions', async ({ params }) => {
    const postId = String(params.postId ?? '');
    await delay(120);
    db.unreactPost(postId);
    return ok({ message: 'Đã bỏ thích bài viết' });
  }),

  http.post('*/comments/:commentId/reactions', async ({ request, params }) => {
    const commentId = String(params.commentId ?? '');
    const body = (await request.json()) as { reaction: ReactionType };
    await delay(120);
    db.reactToComment(commentId, body.reaction);
    return ok({ id: makeId('reaction'), comment_id: commentId, user_id: db.currentUser.id, reaction: body.reaction, created_at: new Date().toISOString() });
  }),

  http.delete('*/comments/:commentId/reactions', async ({ params }) => {
    const commentId = String(params.commentId ?? '');
    await delay(120);
    db.unreactComment(commentId);
    return ok({ message: 'Đã bỏ thích bình luận' });
  }),

  // ── Shares ─────────────────────────────────────────────────────────────────
  http.post('*/posts/:postId/share', async ({ request, params }) => {
    const postId = String(params.postId ?? '');
    const body = (await request.json()) as { message?: string };
    await delay(300);

    const originalPost = db.getPost(postId);
    if (!originalPost) return notFound('Bài viết không tồn tại');

    const share = db.addShare(postId, db.currentUser.id, body.message);

    // Create a new shared post in the feed
    const sharedPost = {
      id: makeId('post'),
      author: { id: db.currentUser.id, display_name: db.currentUser.display_name, username: db.currentUser.username, avatar: db.currentUser.avatar ?? null, role: db.currentUser.role, account_status: db.currentUser.account_status },
      content: body.message ?? '',
      media_urls: [],
      media: [],
      stats: { reactions: 0, comments: 0, shares: 0 },
      user_reaction: null,
      visibility: 'PUBLIC',
      post_type: 'SOCIAL',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sharedPost: originalPost,
    } as PostSummary;
    db.createPost(sharedPost);

    return ok(share);
  }),

  http.delete('*/posts/:postId/share', async ({ params }) => {
    const postId = String(params.postId ?? '');
    await delay(200);
    db.removeShare(postId, db.currentUser.id);
    return ok({ message: 'Đã bỏ chia sẻ' });
  }),

  // ── Friends ────────────────────────────────────────────────────────────────
  http.get('*/friends/', async ({ request }) => {
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 20) as number;
    const q = qp(request, 'q') as string | null;

    let filtered = db.friends;
    if (q) {
      const lq = q.toLowerCase();
      filtered = filtered.filter((f) => f.user.display_name.toLowerCase().includes(lq) || f.user.username.toLowerCase().includes(lq));
    }
    await delay(300);
    return ok(paginatedData(filtered, page, pageSize, filtered.length));
  }),

  http.get('*/friends/check/:userId', async ({ params }) => {
    const userId = String(params.userId ?? '');
    await delay(160);
    const status = db.friendshipStatus(userId);
    return ok(status);
  }),

  http.post('*/friends/requests', async ({ request }) => {
    const body = (await request.json()) as { addressee_id: string };
    await delay(250);

    const addresseeAuthor = Object.values(AUTHORS).find((a) => a.id === body.addressee_id);
    if (!addresseeAuthor) return notFound('Người dùng không tồn tại');

    const newRequest = {
      id: makeId('req'),
      requester: { id: db.currentUser.id, display_name: db.currentUser.display_name, username: db.currentUser.username, avatar: db.currentUser.avatar ?? null, role: db.currentUser.role, account_status: db.currentUser.account_status },
      addressee: addresseeAuthor,
      status: 'PENDING' as const,
      created_at: new Date().toISOString(),
    };
    db.outgoingRequests.push(newRequest);
    return HttpResponse.json({ success: true, data: newRequest, request_id: rid() }, { status: 201 });
  }),

  http.get('*/friends/requests/incoming', async () => {
    await delay(250);
    return ok(db.incomingRequests);
  }),

  http.get('*/friends/requests/outgoing', async () => {
    await delay(250);
    return ok(db.outgoingRequests);
  }),

  http.post('*/friends/requests/:requestId/accept', async ({ params }) => {
    const requestId = String(params.requestId ?? '');
    await delay(200);

    const idx = db.incomingRequests.findIndex((r) => r.id === requestId);
    if (idx === -1) return notFound('Lời mời không tồn tại');

    const req = db.incomingRequests[idx] as FriendRequest;
    db.incomingRequests.splice(idx, 1);
    db.friends.push({ id: makeId('friend'), user: req.requester, created_at: new Date().toISOString() });
    db.currentUser.followers = (db.currentUser.followers ?? 0) + 1;
    return ok({ message: 'Đã chấp nhận lời mời kết bạn' });
  }),

  http.post('*/friends/requests/:requestId/reject', async ({ params }) => {
    const requestId = String(params.requestId ?? '');
    await delay(200);

    const idx = db.incomingRequests.findIndex((r) => r.id === requestId);
    if (idx === -1) return notFound('Lời mời không tồn tại');
    db.incomingRequests.splice(idx, 1);
    return ok({ message: 'Đã từ chối lời mời kết bạn' });
  }),

  http.post('*/friends/requests/:requestId/cancel', async ({ params }) => {
    const requestId = String(params.requestId ?? '');
    await delay(200);

    const idx = db.outgoingRequests.findIndex((r) => r.id === requestId);
    if (idx === -1) return notFound('Lời mời không tồn tại');
    db.outgoingRequests.splice(idx, 1);
    return ok({ message: 'Đã hủy lời mời kết bạn' });
  }),

  http.delete('*/friends/:friendId', async ({ params }) => {
    const friendId = String(params.friendId ?? '');
    await delay(200);

    const idx = db.friends.findIndex((f) => f.id === friendId);
    if (idx === -1) return notFound('Bạn bè không tồn tại');
    db.friends.splice(idx, 1);
    return ok({ message: 'Đã hủy kết bạn' });
  }),

  // ── Notifications ──────────────────────────────────────────────────────────
  http.get('*/notifications/', async ({ request }) => {
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 20) as number;
    await delay(250);
    return ok(paginatedData(db.notifications, page, pageSize, db.notifications.length));
  }),

  http.get('*/notifications/unread-count', async () => {
    await delay(100);
    return ok({ count: db.unreadCount() });
  }),

  http.post('*/notifications/:notificationId/read', async ({ params }) => {
    const id = String(params.notificationId ?? '');
    await delay(100);
    const n = db.markRead(id);
    if (!n) return notFound('Thông báo không tồn tại');
    return ok({ message: 'Đã đánh dấu đã đọc' });
  }),

  http.post('*/notifications/read-all', async () => {
    await delay(150);
    db.markAllRead();
    return ok({ message: 'Đã đánh dấu tất cả đã đọc' });
  }),

  http.delete('*/notifications/:notificationId', async ({ params }) => {
    const id = String(params.notificationId ?? '');
    await delay(100);
    const deleted = db.deleteNotification(id);
    if (!deleted) return notFound('Thông báo không tồn tại');
    return ok({ message: 'Đã xóa thông báo' });
  }),

  // ── Media uploads ──────────────────────────────────────────────────────────
  http.post('*/media/uploads', async () => {
    await delay(200);
    const upload = db.initUpload();
    return HttpResponse.json({ success: true, data: { upload_id: upload.upload_id, asset_id: upload.asset_id, method: 'PUT', upload_url: upload.upload_url, headers: [], expires_at: upload.expires_at }, request_id: rid() }, { status: 201 });
  }),

  http.post('*/media/uploads/public', async () => {
    await delay(200);
    const upload = db.initUpload();
    return HttpResponse.json({ success: true, data: { upload_id: upload.upload_id, asset_id: upload.asset_id, method: 'PUT', upload_url: upload.upload_url, headers: [], expires_at: upload.expires_at }, request_id: rid() }, { status: 201 });
  }),

  http.post('*/media/uploads/:uploadId/complete', async ({ params }) => {
    const uploadId = String(params.uploadId ?? '');
    await delay(300);
    const assetId = db.completeUpload(uploadId) ?? makeId('asset');
    return ok({ asset_id: assetId, cdn_url: `https://mock-cdn.example.com/assets/${assetId}`, status: 'ready' });
  }),

  http.post('*/media/uploads/public/:uploadId/complete', async ({ params }) => {
    const uploadId = String(params.uploadId ?? '');
    await delay(300);
    const assetId = db.completeUpload(uploadId) ?? makeId('asset');
    return ok({ asset_id: assetId, cdn_url: `https://mock-cdn.example.com/assets/${assetId}`, status: 'ready' });
  }),

  http.get('*/media/assets/:assetId', async ({ params }) => {
    const assetId = String(params.assetId ?? '');
    await delay(150);
    return ok({ id: assetId, cdn_url: `https://mock-cdn.example.com/assets/${assetId}`, status: 'ready', type: 'image', access: 'public' });
  }),

  http.post('*/media/assets/:assetId/download-url', async ({ params }) => {
    const assetId = String(params.assetId ?? '');
    await delay(150);
    return ok({ url: `https://mock-cdn.example.com/assets/${assetId}?token=mock`, expires_at: new Date(Date.now() + 3600_000).toISOString() });
  }),

  // ── Search ─────────────────────────────────────────────────────────────────
  http.get('*/search/users', async ({ request }) => {
    const q = (qp(request, 'q', '') as string).toLowerCase().trim();
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 10) as number;
    await delay(300);

    if (!q) return ok({ users: [], total: 0 });

    const allKnownUsers: UserPublic[] = [
      db._selfAsPublic(),
      ...Object.values(db.profiles),
    ];

    const matched = allKnownUsers.filter((u) =>
      u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
    );
    const paged = paginate(matched, page, pageSize);
    return ok({ users: paged, total: matched.length });
  }),

  // Legacy /search endpoint (non-contract, for UI features)
  http.get('*/search', async ({ request }) => {
    const q = (qp(request, 'q', '') as string).toLowerCase().trim();
    const type = qp(request, 'type') as string | null;
    await delay(300);

    if (!q) return ok({ users: [], posts: [], total: 0 });

    const allKnownUsers: UserPublic[] = [db._selfAsPublic(), ...Object.values(db.profiles)];
    const matchedUsers = allKnownUsers.filter((u) => u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    const matchedPosts = db.posts.filter((p) => p.content.toLowerCase().includes(q) || p.author.display_name.toLowerCase().includes(q));

    if (type === 'users') return ok({ users: matchedUsers, posts: [], total: matchedUsers.length });
    if (type === 'posts') return ok({ users: [], posts: matchedPosts, total: matchedPosts.length });
    return ok({ users: matchedUsers, posts: matchedPosts, total: matchedUsers.length + matchedPosts.length });
  }),

  // ── Recommendations ────────────────────────────────────────────────────────
  http.get('*/recommendations/suggestions', async () => {
    await delay(400);
    const notFriendIds = new Set(db.friends.map((f) => f.user.id));
    const suggestions = SUGGESTIONS.filter((s) => !notFriendIds.has(s.id));
    return ok({ suggestions, total: suggestions.length });
  }),

  // ── Fields (non-contract, used by feed UI) ─────────────────────────────────
  http.get('*/fields/:fieldId/', async ({ params }) => {
    const fieldId = String(params.fieldId ?? '');
    await delay(200);
    const field = db.getField(fieldId);
    if (!field) return notFound('Lĩnh vực không tồn tại');
    return ok(field);
  }),

  http.get('*/fields/:fieldId', async ({ params }) => {
    const fieldId = String(params.fieldId ?? '');
    await delay(200);
    const field = db.getField(fieldId);
    if (!field) return notFound('Lĩnh vực không tồn tại');
    return ok(field);
  }),

  http.get('*/fields/:fieldId/posts/', async ({ request, params }) => {
    const fieldId = String(params.fieldId ?? '');
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 10) as number;
    const fieldPosts = db.posts.filter((p) => p.field_id === fieldId);
    await delay(300);
    return ok(paginatedData(fieldPosts, page, pageSize, fieldPosts.length));
  }),

  http.post('*/fields/:fieldId/follow/', async ({ params }) => {
    const fieldId = String(params.fieldId ?? '');
    await delay(150);
    const field = db.toggleFollowField(fieldId, true);
    if (!field) return notFound('Lĩnh vực không tồn tại');
    return ok({ message: 'Đã theo dõi lĩnh vực' });
  }),

  http.delete('*/fields/:fieldId/follow/', async ({ params }) => {
    const fieldId = String(params.fieldId ?? '');
    await delay(150);
    const field = db.toggleFollowField(fieldId, false);
    if (!field) return notFound('Lĩnh vực không tồn tại');
    return ok({ message: 'Đã bỏ theo dõi lĩnh vực' });
  }),

  // ── Groups (non-contract) ──────────────────────────────────────────────────
  http.get('*/groups', async () => {
    await delay(300);
    return ok(allGroups);
  }),

  http.get('*/groups/:groupId', async ({ params }) => {
    const group = allGroups.find((g) => g.id === String(params.groupId));
    await delay(200);
    if (!group) return notFound('Nhóm không tồn tại');
    return ok(group);
  }),

  http.post('*/groups/:groupId/join', async ({ params }) => {
    const group = allGroups.find((g) => g.id === String(params.groupId));
    if (!group) return notFound('Nhóm không tồn tại');
    group.isJoined = true;
    group.stats.membersCount += 1;
    await delay(150);
    return ok({ message: 'Đã tham gia nhóm' });
  }),

  http.delete('*/groups/:groupId/leave', async ({ params }) => {
    const group = allGroups.find((g) => g.id === String(params.groupId));
    if (!group) return notFound('Nhóm không tồn tại');
    group.isJoined = false;
    group.stats.membersCount = Math.max(0, group.stats.membersCount - 1);
    await delay(150);
    return ok({ message: 'Đã rời nhóm' });
  }),

  // ── Marketplace (non-contract) ─────────────────────────────────────────────
  http.get('*/marketplace', async ({ request }) => {
    const category = qp(request, 'category') as string | null;
    const type = qp(request, 'type') as string | null;
    const search = (qp(request, 'search') as string | null)?.toLowerCase();

    let filtered = allMarketplaceItems;
    if (category) filtered = filtered.filter((i) => i.category.toLowerCase().includes(category.toLowerCase()));
    if (type) filtered = filtered.filter((i) => i.type.toLowerCase() === type.toLowerCase());
    if (search) filtered = filtered.filter((i) => i.title.toLowerCase().includes(search) || i.description.toLowerCase().includes(search) || i.tags.some((t) => t.toLowerCase().includes(search)));

    await delay(300);
    return ok(filtered);
  }),

  http.get('*/marketplace/:itemId', async ({ params }) => {
    const item = allMarketplaceItems.find((i) => i.id === String(params.itemId));
    await delay(200);
    if (!item) return notFound('Sản phẩm không tồn tại');
    return ok(item);
  }),

  // ── Messages (non-contract, message service) ───────────────────────────────
  http.get('*/api/users/:userId/rooms', async () => {
    await delay(300);
    return ok(allConversations);
  }),

  http.get('*/api/rooms/dm', async ({ request }) => {
    const userB = qp(request, 'user_b') as string | null;
    const existing = allConversations.find((c) => c.type === 'DIRECT' && c.other_user?.id === userB);
    await delay(200);
    if (existing) return ok(existing);

    const newConv = { id: makeId('conv'), type: 'DIRECT', name: 'Cuộc trò chuyện mới', created_at: new Date().toISOString(), other_user: { id: userB ?? '', display_name: '', avatar: null as string | null, username: '' }, last_message: { id: makeId('msg'), sender_id: 'system', created_at: new Date().toISOString(), snippet: 'Bắt đầu cuộc trò chuyện' }, unread: 0 };
    allConversations.push(newConv);
    return HttpResponse.json({ success: true, data: newConv, request_id: rid() }, { status: 201 });
  }),

  http.get('*/api/rooms/:roomId/messages', async ({ params }) => {
    const roomId = String(params.roomId ?? '');
    const msgs = allMessages.filter((m) => m.room_id === roomId);
    await delay(250);
    return ok(msgs);
  }),

  http.post('*/api/rooms/:roomId/messages', async ({ request, params }) => {
    const roomId = String(params.roomId ?? '');
    const body = (await request.json()) as Record<string, unknown>;

    const newMsg = { id: makeId('msg'), room_id: roomId, sender_id: (body.sender_id as string) || db.currentUser.id, ciphertext: (body.content as string) || (body.ciphertext as string) || '', created_at: new Date().toISOString(), attachment_urls: null, pinned: false, reactions: [] };
    allMessages.push(newMsg);

    const conv = allConversations.find((c) => c.id === roomId);
    if (conv) conv.last_message = { id: newMsg.id, sender_id: newMsg.sender_id, created_at: newMsg.created_at, snippet: newMsg.ciphertext };

    await delay(150);
    return HttpResponse.json({ success: true, data: newMsg, request_id: rid() }, { status: 201 });
  }),

  http.post('*/api/rooms/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newRoom = { id: makeId('conv'), type: (body.type as string) || 'DIRECT', name: (body.name as string) || '', created_at: new Date().toISOString() };
    allConversations.push({ ...newRoom, other_user: { id: '', display_name: '', avatar: null as string | null, username: '' }, last_message: { id: makeId('msg'), sender_id: 'system', created_at: new Date().toISOString(), snippet: 'Cuộc trò chuyện mới' }, unread: 0 });
    await delay(200);
    return HttpResponse.json({ success: true, data: newRoom, request_id: rid() }, { status: 201 });
  }),

  // ── Admin (non-contract) ───────────────────────────────────────────────────
  http.get('*/admin/users', async ({ request }) => {
    const page = qp(request, 'page', 1) as number;
    const pageSize = qp(request, 'page_size', 20) as number;
    const q = (qp(request, 'q', '') as string).toLowerCase();
    let filtered = allAdminUsers;
    if (q) filtered = filtered.filter((u) => u.display_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    await delay(300);
    return ok(paginatedData(filtered, page, pageSize, filtered.length));
  }),

  http.post('*/admin/users/:userId/verify', async ({ params }) => {
    const u = allAdminUsers.find((x) => x.id === String(params.userId));
    if (u) (u as Record<string, unknown>).verification_status = 'VERIFIED';
    await delay(200);
    return ok({ message: 'Đã xác thực tài khoản' });
  }),

  http.post('*/admin/users/:userId/reject', async ({ params }) => {
    const u = allAdminUsers.find((x) => x.id === String(params.userId));
    if (u) (u as Record<string, unknown>).verification_status = 'REJECTED';
    await delay(200);
    return ok({ message: 'Đã từ chối xác thực' });
  }),

  http.post('*/admin/users/:userId/deactivate', async ({ params }) => {
    const u = allAdminUsers.find((x) => x.id === String(params.userId));
    if (u) u.account_status = 'INACTIVE' as typeof u.account_status;
    await delay(200);
    return ok({ message: 'Đã vô hiệu hoá tài khoản' });
  }),

  http.post('*/admin/users/:userId/reactivate', async ({ params }) => {
    const u = allAdminUsers.find((x) => x.id === String(params.userId));
    if (u) u.account_status = 'ACTIVE' as typeof u.account_status;
    await delay(200);
    return ok({ message: 'Đã kích hoạt lại tài khoản' });
  }),
];
