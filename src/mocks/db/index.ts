/**
 * In-memory mock database.
 * Single source of truth for all MSW handler state.
 */
import type {
  Author,
  Comment,
  Field,
  Friend,
  FriendRequest,
  Notification,
  PostSummary,
  UserMe,
  UserPublic,
} from '@/lib/api/generated/model';
import { NotificationType, PostType, Visibility } from '@/lib/api/generated/model';
import { makeFriend, makeFriendRequest, makeNotification } from '../factories';

// ─── seed authors ────────────────────────────────────────────────────────────

export const AUTHORS = {
  hiru: {
    id: 'usr_student_001',
    display_name: 'Hiru Nguyễn',
    username: 'hiru.dev',
    avatar: 'https://i.pravatar.cc/160?img=12',
    avatar_path: null,
    role: 'USER',
    account_status: 'ACTIVE',
  } as Author,
  admin: {
    id: 'usr_admin_001',
    display_name: 'Etechs Admin',
    username: 'admin.etechs',
    avatar: 'https://i.pravatar.cc/160?img=50',
    avatar_path: null,
    role: 'ADMIN',
    account_status: 'ACTIVE',
  } as Author,
  hoang: {
    id: 'usr_mentor_001',
    display_name: 'Mentor Hoàng',
    username: 'mentor.hoang',
    avatar: 'https://i.pravatar.cc/160?img=65',
    avatar_path: null,
    role: 'TEACHER',
    account_status: 'ACTIVE',
  } as Author,
  linh: {
    id: 'usr_peer_001',
    display_name: 'Linh Trần',
    username: 'linh.ui',
    avatar: 'https://i.pravatar.cc/160?img=31',
    avatar_path: null,
    role: 'USER',
    account_status: 'ACTIVE',
  } as Author,
  phuc: {
    id: 'usr_data_001',
    display_name: 'Phúc Lê',
    username: 'phucle.ai',
    avatar: 'https://i.pravatar.cc/160?img=19',
    avatar_path: null,
    role: 'USER',
    account_status: 'ACTIVE',
  } as Author,
  an: {
    id: 'usr_ops_001',
    display_name: 'An Vũ',
    username: 'an.devops',
    avatar: 'https://i.pravatar.cc/160?img=21',
    avatar_path: null,
    role: 'USER',
    account_status: 'ACTIVE',
  } as Author,
  mai: {
    id: 'usr_pm_001',
    display_name: 'Mai Nguyễn',
    username: 'mai.pm',
    avatar: 'https://i.pravatar.cc/160?img=44',
    avatar_path: null,
    role: 'USER',
    account_status: 'ACTIVE',
  } as Author,
  duy: {
    id: 'usr_backend_001',
    display_name: 'Duy Phạm',
    username: 'duy.backend',
    avatar: 'https://i.pravatar.cc/160?img=7',
    avatar_path: null,
    role: 'USER',
    account_status: 'ACTIVE',
  } as Author,
} as const;

// ─── seed users ───────────────────────────────────────────────────────────────

const _now = new Date();
const daysAgo = (n: number) => new Date(_now.getTime() - n * 86_400_000).toISOString();
const minsAgo = (n: number) => new Date(_now.getTime() - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(_now.getTime() - n * 3_600_000).toISOString();

const STUDENT_USER: UserMe = {
  id: AUTHORS.hiru.id,
  username: AUTHORS.hiru.username,
  display_name: AUTHORS.hiru.display_name,
  email: 'hiru@example.com',
  avatar: AUTHORS.hiru.avatar,
  avatar_path: null,
  background: null,
  bio: 'Full-stack developer passionate về TypeScript, React và system design. Đang học AI/ML.',
  birth_date: '2000-05-15',
  account_status: 'ACTIVE',
  role: 'USER',
  created_at: daysAgo(280),
  followers: 128,
  following: 87,
  posts_count: 42,
  personal_info: {
    education_level: 'university',
    school: 'Đại học Bách Khoa Hà Nội',
    major: 'Khoa học máy tính',
    class_name: 'K65-CS1',
    academic_year: '2023-2024',
    graduation_year: '2024',
    favorite_subjects: ['Software Engineering', 'AI & Machine Learning', 'Cloud & DevOps'],
    hobbies: ['Coding', 'Reading tech blogs', 'Gaming', 'Photography'],
    location: 'Hà Nội, Việt Nam',
    projects: [
      {
        id: 'proj_001',
        title: 'Social Network Platform',
        category: 'Web Development',
        description:
          'Nền tảng mạng xã hội với TypeSpec contract-first architecture, React, và MSW cho testing.',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        source_link: 'https://github.com/hiru/social-network',
      },
      {
        id: 'proj_002',
        title: 'AI Chat Assistant',
        category: 'AI/ML',
        description:
          'Chatbot thông minh sử dụng RAG và LangChain để trả lời câu hỏi về tài liệu kỹ thuật.',
        image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        source_link: 'https://github.com/hiru/ai-chat',
      },
    ],
  },
};

const ADMIN_USER: UserMe = {
  id: AUTHORS.admin.id,
  username: AUTHORS.admin.username,
  display_name: AUTHORS.admin.display_name,
  email: 'admin@etechs.vn',
  avatar: AUTHORS.admin.avatar,
  avatar_path: null,
  background: null,
  bio: 'Platform administrator. Hỗ trợ cộng đồng và quản lý hệ thống.',
  birth_date: '1995-03-20',
  account_status: 'ACTIVE',
  role: 'ADMIN',
  created_at: daysAgo(640),
  followers: 502,
  following: 16,
  posts_count: 8,
  personal_info: {
    education_level: 'university',
    school: 'Đại học Công nghệ',
    major: 'Hệ thống thông tin',
    degree: 'Thạc sĩ',
    graduation_year: '2019',
    favorite_subjects: ['System Architecture', 'Database Design', 'Security'],
    hobbies: ['Community building', 'Mentoring', 'Tech events'],
    location: 'Hà Nội, Việt Nam',
  },
};

// ─── seed posts ───────────────────────────────────────────────────────────────

const SEED_POSTS: PostSummary[] = [
  {
    id: 'post_001',
    author: AUTHORS.hiru,
    content:
      'Vừa hoàn thành luồng contract-first với TypeSpec + Orval + MSW. Dev experience mượt hơn hẳn 🔥',
    media_urls: [],
    media: [],
    stats: { reactions: 26, comments: 9, shares: 2 },
    user_reaction: 'LIKE',
    visibility: Visibility.PUBLIC,
    post_type: PostType.SOCIAL,
    field_id: 'software-engineering',
    created_at: minsAgo(22),
    updated_at: minsAgo(20),
  },
  {
    id: 'post_002',
    author: AUTHORS.linh,
    content:
      'Case study mới: cải thiện onboarding từ 41% lên 68% bằng progressive disclosure.',
    media_urls: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200'],
    media: [],
    stats: { reactions: 41, comments: 14, shares: 6 },
    user_reaction: null,
    visibility: Visibility.PUBLIC,
    post_type: PostType.SOCIAL,
    field_id: 'product-design',
    created_at: hoursAgo(2),
    updated_at: hoursAgo(1),
  },
  {
    id: 'post_003',
    author: AUTHORS.phuc,
    content:
      'Anh em cần tài liệu học RAG cho production không? Mình tổng hợp 1 checklist thực chiến rồi.',
    media_urls: [],
    media: [],
    stats: { reactions: 33, comments: 17, shares: 4 },
    user_reaction: 'LOVE',
    visibility: Visibility.PUBLIC,
    post_type: PostType.QUESTION,
    field_id: 'ai-ml',
    created_at: hoursAgo(4),
    updated_at: hoursAgo(4),
  },
  {
    id: 'post_004',
    author: AUTHORS.an,
    content:
      'Bên mình đang tuyển Fresher DevOps intern (HCM, hybrid). Có mentor 1-1 và budget học cert.',
    media_urls: [],
    media: [],
    stats: { reactions: 12, comments: 5, shares: 10 },
    user_reaction: null,
    visibility: Visibility.PUBLIC,
    post_type: PostType.JOB,
    field_id: 'cloud-devops',
    created_at: hoursAgo(6),
    updated_at: hoursAgo(5),
  },
  {
    id: 'post_005',
    author: AUTHORS.mai,
    content:
      'Weekly learning: 5 anti-pattern phổ biến khi scale micro-frontend và cách tránh.',
    media_urls: [],
    media: [],
    stats: { reactions: 18, comments: 7, shares: 3 },
    user_reaction: 'WOW',
    visibility: Visibility.PUBLIC,
    post_type: PostType.SOCIAL,
    field_id: 'frontend-architecture',
    created_at: hoursAgo(11),
    updated_at: hoursAgo(10),
  },
  {
    id: 'post_006',
    author: AUTHORS.duy,
    content:
      'So sánh 3 chiến lược cache invalidation cho social feed ở quy mô 100k DAU.',
    media_urls: [],
    media: [],
    stats: { reactions: 24, comments: 11, shares: 5 },
    user_reaction: null,
    visibility: Visibility.PUBLIC,
    post_type: PostType.QUESTION,
    field_id: 'backend',
    created_at: hoursAgo(20),
    updated_at: hoursAgo(19),
  },
];

// ─── seed profiles ────────────────────────────────────────────────────────────

const SEED_PROFILES: Record<string, UserPublic> = {
  'linh.ui': {
    id: AUTHORS.linh.id,
    username: AUTHORS.linh.username,
    display_name: AUTHORS.linh.display_name,
    bio: 'Product designer tập trung vào trải nghiệm học tập và cộng đồng. Mê design systems.',
    avatar: AUTHORS.linh.avatar,
    avatar_path: null,
    background: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200',
    account_status: 'ACTIVE',
    role: 'USER',
    created_at: daysAgo(620),
    updated_at: hoursAgo(6),
    followers: 1840,
    following: 326,
    posts_count: 72,
    birth_date: '1998-07-12',
    personal_info: {
      school: 'Đại học Mỹ thuật Công nghiệp',
      major: 'Thiết kế sản phẩm số',
      academic_year: '2024',
      favorite_subjects: ['Design Systems', 'UX Research', 'Motion'],
      hobbies: ['Sketching', 'Coffee brewing', 'Trail running'],
      location: 'TP.HCM, Việt Nam',
      projects: [
        {
          id: 'proj_linh_001',
          title: 'Onboarding 2.0 Experience',
          category: 'Product Design',
          description:
            'Thiết kế onboarding đa bước giúp tăng completion rate +41% cho app học online.',
          image_url: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=800',
          source_link: 'https://dribbble.com/shots/linh-onboarding',
        },
      ],
    },
    viewer_context: { is_owner: false, is_friend: true },
    redacted_fields: [],
    friendship_status: 'FRIENDS',
    friend_request_id: null,
  },
  'duy.backend': {
    id: AUTHORS.duy.id,
    username: AUTHORS.duy.username,
    display_name: AUTHORS.duy.display_name,
    bio: 'Backend engineer. Nghĩ nhiều về caching, observability và resiliency.',
    avatar: AUTHORS.duy.avatar,
    avatar_path: null,
    background: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200',
    account_status: 'ACTIVE',
    role: 'USER',
    created_at: daysAgo(780),
    updated_at: hoursAgo(12),
    followers: 980,
    following: 210,
    posts_count: 54,
    birth_date: null,
    personal_info: undefined,
    viewer_context: { is_owner: false, is_friend: false },
    redacted_fields: [],
    friendship_status: 'NONE',
    friend_request_id: null,
  },
  'phucle.ai': {
    id: AUTHORS.phuc.id,
    username: AUTHORS.phuc.username,
    display_name: AUTHORS.phuc.display_name,
    bio: 'AI/ML engineer. Đang research về RAG và LLM deployment.',
    avatar: AUTHORS.phuc.avatar,
    avatar_path: null,
    background: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    account_status: 'ACTIVE',
    role: 'USER',
    created_at: daysAgo(450),
    followers: 567,
    following: 145,
    posts_count: 38,
    viewer_context: { is_owner: false, is_friend: true },
    redacted_fields: [],
    friendship_status: 'FRIENDS',
    friend_request_id: null,
  },
  'mentor.hoang': {
    id: AUTHORS.hoang.id,
    username: AUTHORS.hoang.username,
    display_name: AUTHORS.hoang.display_name,
    bio: 'Senior developer & mentor. 10+ năm kinh nghiệm. Passionate về education tech.',
    avatar: AUTHORS.hoang.avatar,
    avatar_path: null,
    background: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200',
    account_status: 'ACTIVE',
    role: 'TEACHER',
    created_at: daysAgo(900),
    followers: 3200,
    following: 98,
    posts_count: 156,
    viewer_context: { is_owner: false, is_friend: true },
    redacted_fields: [],
    friendship_status: 'FRIENDS',
    friend_request_id: null,
  },
};

// ─── seed comments ────────────────────────────────────────────────────────────

const SEED_COMMENTS = new Map<string, Comment[]>([
  [
    'post_001',
    [
      {
        id: 'cmt_001',
        post_id: 'post_001',
        author: AUTHORS.hoang,
        parent_comment_id: null,
        content:
          'Flow này sạch và dễ scale đó. Nhớ thêm case test cho refresh token nữa nhé.',
        media_urls: [],
        stats: { reactions: 7, replies: 1 },
        user_reaction: 'LIKE',
        created_at: minsAgo(18),
        updated_at: minsAgo(16),
      },
      {
        id: 'cmt_002',
        post_id: 'post_001',
        author: AUTHORS.hiru,
        parent_comment_id: 'cmt_001',
        content: 'Dạ em đang thêm luôn scenario mock lỗi 401 để cover UX fallback.',
        media_urls: [],
        stats: { reactions: 2, replies: 0 },
        user_reaction: null,
        created_at: minsAgo(13),
        updated_at: minsAgo(12),
      },
      {
        id: 'cmt_003',
        post_id: 'post_001',
        author: AUTHORS.linh,
        parent_comment_id: null,
        content: 'Cho mình xin branch này để demo cho team frontend với.',
        media_urls: [],
        stats: { reactions: 1, replies: 0 },
        user_reaction: null,
        created_at: minsAgo(9),
        updated_at: minsAgo(9),
      },
    ],
  ],
  [
    'post_002',
    [
      {
        id: 'cmt_010',
        post_id: 'post_002',
        author: AUTHORS.hiru,
        parent_comment_id: null,
        content: 'Số liệu 68% rất ấn tượng. Bạn có thể chia sẻ thêm methodology không?',
        media_urls: [],
        stats: { reactions: 3, replies: 0 },
        user_reaction: null,
        created_at: hoursAgo(1),
        updated_at: hoursAgo(1),
      },
    ],
  ],
]);

// ─── seed friends & requests ──────────────────────────────────────────────────

const SEED_FRIENDS: Friend[] = [
  makeFriend(AUTHORS.hoang, { id: 'friend_001', created_at: daysAgo(120) }),
  makeFriend(AUTHORS.linh, { id: 'friend_002', created_at: daysAgo(90) }),
  makeFriend(AUTHORS.phuc, { id: 'friend_003', created_at: daysAgo(60) }),
  makeFriend(AUTHORS.an, { id: 'friend_004', created_at: daysAgo(45) }),
];

const SEED_INCOMING: FriendRequest[] = [
  makeFriendRequest(AUTHORS.duy, AUTHORS.hiru, {
    id: 'req_in_001',
    status: 'PENDING',
    created_at: daysAgo(2),
  }),
  makeFriendRequest(AUTHORS.mai, AUTHORS.hiru, {
    id: 'req_in_002',
    status: 'PENDING',
    created_at: daysAgo(5),
  }),
];

const SEED_OUTGOING: FriendRequest[] = [
  makeFriendRequest(AUTHORS.hiru, AUTHORS.an, {
    id: 'req_out_001',
    status: 'PENDING',
    created_at: daysAgo(1),
  }),
];

// ─── seed notifications ───────────────────────────────────────────────────────

const SEED_NOTIFICATIONS: Notification[] = [
  makeNotification(AUTHORS.hoang, {
    id: 'notif_001',
    type: NotificationType.POST_LIKE,
    target_id: 'post_001',
    target_type: 'post',
    message: `${AUTHORS.hoang.display_name} đã thích bài viết của bạn`,
    is_read: false,
    created_at: minsAgo(15),
  }),
  makeNotification(AUTHORS.linh, {
    id: 'notif_002',
    type: NotificationType.POST_COMMENT,
    target_id: 'post_001',
    target_type: 'post',
    message: `${AUTHORS.linh.display_name} đã bình luận về bài viết của bạn`,
    is_read: false,
    created_at: minsAgo(30),
  }),
  makeNotification(AUTHORS.phuc, {
    id: 'notif_003',
    type: NotificationType.FRIEND_ACCEPT,
    message: `${AUTHORS.phuc.display_name} đã chấp nhận lời mời kết bạn`,
    is_read: true,
    created_at: hoursAgo(2),
  }),
  makeNotification(AUTHORS.an, {
    id: 'notif_004',
    type: NotificationType.MENTION,
    target_id: 'post_004',
    target_type: 'post',
    message: `${AUTHORS.an.display_name} đã đề cập đến bạn trong một bình luận`,
    is_read: true,
    created_at: hoursAgo(4),
  }),
  makeNotification(AUTHORS.duy, {
    id: 'notif_005',
    type: NotificationType.FRIEND_REQUEST,
    message: `${AUTHORS.duy.display_name} đã gửi lời mời kết bạn cho bạn`,
    is_read: false,
    created_at: hoursAgo(1),
  }),
  makeNotification(AUTHORS.hiru, {
    id: 'notif_006',
    type: NotificationType.SYSTEM,
    message: 'Chào mừng đến với Etechs Social Network! Hoàn thiện profile để kết nối dễ hơn.',
    is_read: true,
    created_at: daysAgo(7),
  }),
];

// ─── seed fields ──────────────────────────────────────────────────────────────

const SEED_FIELDS: Field[] = [
  {
    id: 'software-engineering',
    name: 'Software Engineering',
    hashtag: '#SoftwareEngineering',
    description: 'Khám phá các phương pháp lập trình, kiến trúc phần mềm, và best practices.',
    banner_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400',
    stats: { posts_count: 156, followers_count: 2847 },
    is_following: false,
  },
  {
    id: 'product-design',
    name: 'Product Design',
    hashtag: '#ProductDesign',
    description: 'UI/UX design, design systems, user research và product thinking.',
    banner_url: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1559028006-08167dd04271?w=400',
    stats: { posts_count: 89, followers_count: 1923 },
    is_following: true,
  },
  {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    hashtag: '#AIMachineLearning',
    description: 'Deep learning, NLP, computer vision và các ứng dụng AI trong thực tế.',
    banner_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    stats: { posts_count: 234, followers_count: 3567 },
    is_following: false,
  },
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    hashtag: '#CloudDevOps',
    description: 'Cloud architecture, CI/CD, Kubernetes và DevOps practices.',
    banner_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
    stats: { posts_count: 178, followers_count: 2145 },
    is_following: true,
  },
  {
    id: 'frontend-architecture',
    name: 'Frontend Architecture',
    hashtag: '#FrontendArchitecture',
    description: 'Modern frontend patterns, micro-frontends, performance optimization.',
    banner_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400',
    stats: { posts_count: 92, followers_count: 1567 },
    is_following: false,
  },
  {
    id: 'backend',
    name: 'Backend Development',
    hashtag: '#BackendDevelopment',
    description: 'API design, database architecture, microservices và backend optimization.',
    banner_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400',
    stats: { posts_count: 145, followers_count: 2341 },
    is_following: true,
  },
  {
    id: 'mobile-development',
    name: 'Mobile Development',
    hashtag: '#MobileDevelopment',
    description: 'iOS, Android, React Native, Flutter và mobile app development.',
    banner_url: 'https://images.unsplash.com/photo-1512941937609-7625e61fe288?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1512941937609-7625e61fe288?w=400',
    stats: { posts_count: 67, followers_count: 1234 },
    is_following: false,
  },
  {
    id: 'data-science',
    name: 'Data Science',
    hashtag: '#DataScience',
    description: 'Data analysis, visualization, statistics và business intelligence.',
    banner_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',
    avatar_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
    stats: { posts_count: 198, followers_count: 2890 },
    is_following: true,
  },
];

// ─── mutable state ────────────────────────────────────────────────────────────

export const db = {
  // ── auth ──────────────────────────────────────────────────────────────────
  currentUser: STUDENT_USER as UserMe,
  switchUser(role: 'student' | 'admin') {
    this.currentUser = role === 'admin' ? { ...ADMIN_USER } : { ...STUDENT_USER };
  },

  // ── posts ─────────────────────────────────────────────────────────────────
  posts: [...SEED_POSTS] as PostSummary[],
  getPost(id: string) {
    return this.posts.find((p) => p.id === id) ?? null;
  },
  createPost(post: PostSummary) {
    this.posts.unshift(post);
    return post;
  },
  updatePost(id: string, patch: Partial<PostSummary>) {
    const idx = this.posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.posts[idx] = { ...this.posts[idx], ...patch, updated_at: new Date().toISOString() };
    return this.posts[idx];
  },
  deletePost(id: string) {
    const idx = this.posts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.posts.splice(idx, 1);
    return true;
  },

  // ── comments ──────────────────────────────────────────────────────────────
  comments: new Map(SEED_COMMENTS) as Map<string, Comment[]>,
  getComments(postId: string): Comment[] {
    return this.comments.get(postId) ?? [];
  },
  setComments(postId: string, comments: Comment[]) {
    this.comments.set(postId, comments);
  },
  addComment(comment: Comment) {
    const list = this.getComments(comment.post_id);
    this.setComments(comment.post_id, [comment, ...list]);
    return comment;
  },
  findComment(commentId: string): { postId: string; comment: Comment } | null {
    for (const [postId, list] of this.comments) {
      const comment = list.find((c) => c.id === commentId);
      if (comment) return { postId, comment };
    }
    return null;
  },
  updateComment(commentId: string, patch: Partial<Comment>) {
    const loc = this.findComment(commentId);
    if (!loc) return null;
    const updated = this.getComments(loc.postId).map((c) =>
      c.id === commentId ? { ...c, ...patch, updated_at: new Date().toISOString() } : c,
    );
    this.setComments(loc.postId, updated);
    return updated.find((c) => c.id === commentId) ?? null;
  },
  deleteComment(commentId: string) {
    const loc = this.findComment(commentId);
    if (!loc) return false;
    const filtered = this.getComments(loc.postId).filter(
      (c) => c.id !== commentId && c.parent_comment_id !== commentId,
    );
    this.setComments(loc.postId, filtered);
    return true;
  },

  // ── profiles ──────────────────────────────────────────────────────────────
  profiles: { ...SEED_PROFILES } as Record<string, UserPublic>,
  getProfile(username: string): UserPublic | null {
    const key = username.toLowerCase().trim();
    if (key === this.currentUser.username.toLowerCase()) {
      return this._selfAsPublic();
    }
    return this.profiles[key] ?? null;
  },
  _selfAsPublic(): UserPublic {
    const u = this.currentUser;
    return {
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      bio: u.bio,
      avatar: u.avatar,
      avatar_path: u.avatar_path,
      background: u.background,
      account_status: u.account_status,
      role: u.role,
      created_at: u.created_at,
      updated_at: u.updated_at,
      followers: u.followers,
      following: u.following,
      posts_count: u.posts_count,
      birth_date: u.birth_date,
      personal_info: u.personal_info,
      viewer_context: { is_owner: true, is_friend: true },
      redacted_fields: [],
      friendship_status: 'SELF',
      friend_request_id: null,
    };
  },

  // ── friends ───────────────────────────────────────────────────────────────
  friends: [...SEED_FRIENDS] as Friend[],
  incomingRequests: [...SEED_INCOMING] as FriendRequest[],
  outgoingRequests: [...SEED_OUTGOING] as FriendRequest[],
  isFriend(userId: string) {
    return this.friends.some((f) => f.user.id === userId);
  },
  friendshipStatus(userId: string): {
    is_friend: boolean;
    is_requested?: boolean;
    is_received?: boolean;
  } {
    if (this.isFriend(userId)) return { is_friend: true };
    const out = this.outgoingRequests.find((r) => r.addressee.id === userId);
    if (out) return { is_friend: false, is_requested: true };
    const inc = this.incomingRequests.find((r) => r.requester.id === userId);
    if (inc) return { is_friend: false, is_received: true };
    return { is_friend: false };
  },

  // ── notifications ─────────────────────────────────────────────────────────
  notifications: [...SEED_NOTIFICATIONS] as Notification[],
  unreadCount() {
    return this.notifications.filter((n) => !n.is_read).length;
  },
  markRead(id: string) {
    const n = this.notifications.find((x) => x.id === id);
    if (n) n.is_read = true;
    return n ?? null;
  },
  markAllRead() {
    this.notifications.forEach((n) => (n.is_read = true));
  },
  deleteNotification(id: string) {
    const idx = this.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.notifications.splice(idx, 1);
    return true;
  },

  // ── fields ────────────────────────────────────────────────────────────────
  fields: [...SEED_FIELDS] as Field[],
  getField(id: string) {
    return this.fields.find((f) => f.id === id) ?? null;
  },
  toggleFollowField(id: string, follow: boolean) {
    const f = this.fields.find((x) => x.id === id);
    if (!f) return null;
    f.is_following = follow;
    f.stats.followers_count += follow ? 1 : -1;
    return f;
  },
};
