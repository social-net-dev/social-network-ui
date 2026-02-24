import { delay, HttpResponse, http } from 'msw';
import type {
  AuthLogin200,
  Comment,
  CommentsCreateComment201,
  CommentsDeleteComment200,
  CommentsReplyToComment201,
  CommentsUpdateComment200,
  CreateCommentRequest,
  FeedGetFeed200,
  LoginRequest,
  PostSummary,
  PostsGetPostComments200,
  UpdateCommentRequest,
  UsersGetMe200,
  UserMe,
} from '@/lib/api/generated/model';

const now = new Date();

const studentUser: UserMe = {
  id: 'usr_student_001',
  username: 'hiru.dev',
  displayName: 'Hiru Nguyễn',
  email: 'hiru@example.com',
  avatar: 'https://i.pravatar.cc/160?img=12',
  accountStatus: 'ACTIVE',
  role: 'USER',
  createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 280).toISOString(),
  followers: 128,
  following: 87,
  postsCount: 42,
};

const adminUser: UserMe = {
  id: 'usr_admin_001',
  username: 'admin.etechs',
  displayName: 'Etechs Admin',
  email: 'admin@etechs.vn',
  avatar: 'https://i.pravatar.cc/160?img=50',
  accountStatus: 'ACTIVE',
  role: 'ADMIN',
  createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 640).toISOString(),
  followers: 502,
  following: 16,
  postsCount: 8,
};

let activeUser: UserMe = studentUser;

const commentAuthors = {
  mentor: {
    id: 'usr_mentor_001',
    displayName: 'Mentor Hoàng',
    username: 'mentor.hoang',
    avatar: 'https://i.pravatar.cc/160?img=65',
    role: 'INSTRUCTOR',
    accountStatus: 'VERIFIED',
  },
  student: {
    id: 'usr_student_001',
    displayName: 'Hiru Nguyễn',
    username: 'hiru.dev',
    avatar: 'https://i.pravatar.cc/160?img=12',
    role: 'STUDENT',
    accountStatus: 'VERIFIED',
  },
  peer: {
    id: 'usr_peer_001',
    displayName: 'Linh Trần',
    username: 'linh.ui',
    avatar: 'https://i.pravatar.cc/160?img=31',
    role: 'STUDENT',
    accountStatus: 'VERIFIED',
  },
} as const;

const allFeedPosts: PostSummary[] = [
  {
    id: 'post_001',
    author: {
      id: 'usr_student_001',
      displayName: 'Hiru Nguyễn',
      username: 'hiru.dev',
      avatar: 'https://i.pravatar.cc/160?img=12',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content:
      'Vừa hoàn thành luồng contract-first với TypeSpec + Orval + MSW. Dev experience mượt hơn hẳn 🔥',
    mediaUrls: [],
    stats: {
      reactions: 26,
      comments: 9,
      shares: 2,
    },
    userReaction: 'LIKE',
    visibility: 'PUBLIC',
    postType: 'SOCIAL',
    fieldId: 'software-engineering',
    createdAt: new Date(now.getTime() - 1000 * 60 * 22).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'post_002',
    author: {
      id: 'usr_design_001',
      displayName: 'Linh Trần',
      username: 'linh.ui',
      avatar: 'https://i.pravatar.cc/160?img=31',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Case study mới: cải thiện onboarding từ 41% lên 68% bằng progressive disclosure.',
    mediaUrls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200'],
    stats: {
      reactions: 41,
      comments: 14,
      shares: 6,
    },
    userReaction: null,
    visibility: 'PUBLIC',
    postType: 'SOCIAL',
    fieldId: 'product-design',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 'post_003',
    author: {
      id: 'usr_data_001',
      displayName: 'Phúc Lê',
      username: 'phucle.ai',
      avatar: 'https://i.pravatar.cc/160?img=19',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Anh em cần tài liệu học RAG cho production không? Mình tổng hợp 1 checklist thực chiến rồi.',
    mediaUrls: [],
    stats: {
      reactions: 33,
      comments: 17,
      shares: 4,
    },
    userReaction: 'LOVE',
    visibility: 'PUBLIC',
    postType: 'QUESTION',
    fieldId: 'ai-ml',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'post_004',
    author: {
      id: 'usr_ops_001',
      displayName: 'An Vũ',
      username: 'an.devops',
      avatar: 'https://i.pravatar.cc/160?img=21',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Bên mình đang tuyển Fresher DevOps intern (HCM, hybrid). Có mentor 1-1 và budget học cert.',
    mediaUrls: [],
    stats: {
      reactions: 12,
      comments: 5,
      shares: 10,
    },
    userReaction: null,
    visibility: 'PUBLIC',
    postType: 'JOB',
    fieldId: 'cloud-devops',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'post_005',
    author: {
      id: 'usr_pm_001',
      displayName: 'Mai Nguyễn',
      username: 'mai.pm',
      avatar: 'https://i.pravatar.cc/160?img=44',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'Weekly learning: 5 anti-pattern phổ biến khi scale micro-frontend và cách tránh.',
    mediaUrls: [],
    stats: {
      reactions: 18,
      comments: 7,
      shares: 3,
    },
    userReaction: 'WOW',
    visibility: 'PUBLIC',
    postType: 'SOCIAL',
    fieldId: 'frontend-architecture',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 11).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'post_006',
    author: {
      id: 'usr_backend_001',
      displayName: 'Duy Phạm',
      username: 'duy.backend',
      avatar: 'https://i.pravatar.cc/160?img=7',
      role: 'USER',
      accountStatus: 'ACTIVE',
    },
    content: 'So sánh 3 chiến lược cache invalidation cho social feed ở quy mô 100k DAU.',
    mediaUrls: [],
    stats: {
      reactions: 24,
      comments: 11,
      shares: 5,
    },
    userReaction: null,
    visibility: 'PUBLIC',
    postType: 'QUESTION',
    fieldId: 'backend',
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 19).toISOString(),
  },
];

const commentsByPost = new Map<string, Comment[]>([
  [
    'post_001',
    [
      {
        id: 'cmt_001',
        postId: 'post_001',
        author: commentAuthors.mentor,
        parentCommentId: null,
        content: 'Flow này sạch và dễ scale đó. Nhớ thêm case test cho refresh token nữa nhé.',
        mediaUrls: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'],
        stats: { reactions: 7, replies: 1 },
        userReaction: 'LIKE',
        createdAt: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 16).toISOString(),
      },
      {
        id: 'cmt_002',
        postId: 'post_001',
        author: commentAuthors.student,
        parentCommentId: 'cmt_001',
        content: 'Dạ em đang thêm luôn scenario mock lỗi 401 để cover UX fallback.',
        mediaUrls: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600'],
        stats: { reactions: 2, replies: 0 },
        userReaction: null,
        createdAt: new Date(now.getTime() - 1000 * 60 * 13).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: 'cmt_003',
        postId: 'post_001',
        author: commentAuthors.peer,
        parentCommentId: null,
        content: 'Cho mình xin branch này để demo cho team frontend với.',
        mediaUrls: [],
        stats: { reactions: 1, replies: 0 },
        userReaction: null,
        createdAt: new Date(now.getTime() - 1000 * 60 * 9).toISOString(),
        updatedAt: new Date(now.getTime() - 1000 * 60 * 9).toISOString(),
      },
    ],
  ],
]);

const getPostComments = (postId: string): Comment[] => commentsByPost.get(postId) ?? [];

const setPostComments = (postId: string, comments: Comment[]) => {
  commentsByPost.set(postId, comments);
};

const findCommentLocation = (commentId: string): { postId: string; comment: Comment } | null => {
  for (const [postId, comments] of commentsByPost.entries()) {
    const comment = comments.find((item) => item.id === commentId);
    if (comment) {
      return { postId, comment };
    }
  }
  return null;
};

const toMediaUrls = (mediaAssetIds?: string[]) => {
  if (!mediaAssetIds?.length) return [];
  return mediaAssetIds.map((assetId, index) => {
    const suffix = encodeURIComponent(`${assetId}-${index}`);
    return `https://picsum.photos/seed/${suffix}/640/480`;
  });
};

const buildLoginResponse = (user: UserMe): AuthLogin200 => ({
  success: true,
  data: {
    access: `mock_access_token_${user.id}`,
    refresh: `mock_refresh_token_${user.id}`,
    tenant_slug: `tenant-${user.id}`,
  },
  request_id: `req_login_${Date.now()}`,
});

const buildMeResponse = (user: UserMe): UsersGetMe200 => ({
  success: true,
  data: user,
  request_id: `req_me_${Date.now()}`,
});

const buildFeedResponse = (items: PostSummary[], page: number, pageSize: number, total: number): FeedGetFeed200 => ({
  success: true,
  data: {
    items,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  },
  request_id: `req_feed_${Date.now()}`,
});

const buildPostCommentsResponse = (comments: Comment[], page: number, pageSize: number): PostsGetPostComments200 => ({
  success: true,
  data: {
    items: comments,
    pagination: {
      page,
      page_size: pageSize,
      total: comments.length,
      total_pages: Math.max(1, Math.ceil(comments.length / pageSize)),
    },
  },
  request_id: `req_comments_${Date.now()}`,
});

export const customHandlers = [
  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;

    await delay(350);

    activeUser = body.email.includes('admin') ? adminUser : studentUser;

    return HttpResponse.json(buildLoginResponse(activeUser), { status: 200 });
  }),

  http.get('*/users/me/', async () => {
    await delay(120);
    return HttpResponse.json(buildMeResponse(activeUser), { status: 200 });
  }),

  http.get('*/users/me', async () => {
    await delay(120);
    return HttpResponse.json(buildMeResponse(activeUser), { status: 200 });
  }),

  http.get('*/feed', async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const pageSize = Number(url.searchParams.get('page_size') ?? 3) || 3;
    const postType = url.searchParams.get('post_type');
    const fieldId = url.searchParams.get('field_id');

    let filtered = allFeedPosts;

    if (postType) {
      filtered = filtered.filter(post => post.postType === postType);
    }

    if (fieldId) {
      filtered = filtered.filter(post => post.fieldId === fieldId);
    }

    const start = Math.max(0, (page - 1) * pageSize);
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    await delay(450);

    return HttpResponse.json(
      buildFeedResponse(pageItems, page, pageSize, filtered.length),
      { status: 200 },
    );
  }),

  http.get('*/posts/:postId/comments', async ({ request, params }) => {
    const postId = String(params.postId ?? '');
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1) || 1;
    const pageSize = Number(url.searchParams.get('page_size') ?? 20) || 20;

    const source = getPostComments(postId);
    const start = Math.max(0, (page - 1) * pageSize);
    const end = start + pageSize;
    const items = source.slice(start, end);

    await delay(200);
    return HttpResponse.json(buildPostCommentsResponse(items, page, pageSize), { status: 200 });
  }),

  http.post('*/comments/', async ({ request }) => {
    const body = (await request.json()) as CreateCommentRequest;

    const nextComment: Comment = {
      id: `cmt_${Date.now()}`,
      postId: body.post_id,
      parentCommentId: null,
      author: {
        id: activeUser.id,
        displayName: activeUser.displayName,
        username: activeUser.username,
        avatar: activeUser.avatar ?? null,
        role: activeUser.role,
        accountStatus: activeUser.accountStatus,
      },
      content: body.content_text,
      mediaUrls: toMediaUrls(body.media_asset_ids),
      stats: { reactions: 0, replies: 0 },
      userReaction: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = getPostComments(body.post_id);
    setPostComments(body.post_id, [nextComment, ...current]);

    const response: CommentsCreateComment201 = {
      success: true,
      data: nextComment,
      request_id: `req_create_comment_${Date.now()}`,
    };

    await delay(180);
    return HttpResponse.json(response, { status: 201 });
  }),

  http.post('*/comments/:commentId/replies', async ({ request, params }) => {
    const body = (await request.json()) as CreateCommentRequest;
    const parentCommentId = String(params.commentId ?? '');

    const reply: Comment = {
      id: `cmt_${Date.now()}`,
      postId: body.post_id,
      parentCommentId,
      author: {
        id: activeUser.id,
        displayName: activeUser.displayName,
        username: activeUser.username,
        avatar: activeUser.avatar ?? null,
        role: activeUser.role,
        accountStatus: activeUser.accountStatus,
      },
      content: body.content_text,
      mediaUrls: toMediaUrls(body.media_asset_ids),
      stats: { reactions: 0, replies: 0 },
      userReaction: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = getPostComments(body.post_id);
    const updated = [...current, reply].map((item) => {
      if (item.id !== parentCommentId) return item;
      return {
        ...item,
        stats: {
          ...item.stats,
          replies: item.stats.replies + 1,
        },
      };
    });
    setPostComments(body.post_id, updated);

    const response: CommentsReplyToComment201 = {
      success: true,
      data: reply,
      request_id: `req_reply_comment_${Date.now()}`,
    };

    await delay(180);
    return HttpResponse.json(response, { status: 201 });
  }),

  http.patch('*/comments/:commentId', async ({ request, params }) => {
    const commentId = String(params.commentId ?? '');
    const body = (await request.json()) as UpdateCommentRequest;
    const location = findCommentLocation(commentId);

    if (!location) {
      return HttpResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    const comments = getPostComments(location.postId).map((item) => {
      if (item.id !== commentId) return item;
      return {
        ...item,
        content: body.content_text ?? item.content,
        updatedAt: new Date().toISOString(),
      };
    });
    setPostComments(location.postId, comments);

    const updated = comments.find((item) => item.id === commentId) ?? location.comment;
    const response: CommentsUpdateComment200 = {
      success: true,
      data: updated,
      request_id: `req_update_comment_${Date.now()}`,
    };

    await delay(140);
    return HttpResponse.json(response, { status: 200 });
  }),

  http.delete('*/comments/:commentId', async ({ params }) => {
    const commentId = String(params.commentId ?? '');
    const location = findCommentLocation(commentId);

    if (!location) {
      return HttpResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
    }

    const comments = getPostComments(location.postId).filter(
      (item) => item.id !== commentId && item.parentCommentId !== commentId,
    );
    setPostComments(location.postId, comments);

    const response: CommentsDeleteComment200 = {
      success: true,
      data: { message: 'Đã xoá bình luận' },
      request_id: `req_delete_comment_${Date.now()}`,
    };

    await delay(140);
    return HttpResponse.json(response, { status: 200 });
  }),
];
