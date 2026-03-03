import { faker } from '@faker-js/faker';
import type {
  Author,
  Comment,
  Friend,
  FriendRequest,
  Notification,
  PostSummary,
  UserMe,
  UserPublic,
} from '@/lib/api/generated/model';
import { NotificationType, PostType, ReactionType, Visibility } from '@/lib/api/generated/model';

// Local type for Field (not in generated model)
interface Field {
  id: string;
  name: string;
  hashtag?: string;
  description?: string;
  banner_url?: string;
  avatar_url?: string;
  stats?: { posts_count: number; followers_count: number };
  is_following?: boolean;
}

// ─── helpers ────────────────────────────────────────────────────────────────

let _seq = 1000;
export const makeId = (prefix: string) => `${prefix}_${String(++_seq).padStart(4, '0')}`;

const AVATARS = Array.from({ length: 70 }, (_, i) => `https://i.pravatar.cc/160?img=${i + 1}`);
const pickAvatar = () => AVATARS[faker.number.int({ min: 0, max: 69 })];

const UNSPLASH: Record<string, string> = {
  code: 'photo-1461749280684-dccba630e2f6',
  design: 'photo-1559028006-08167dd04271',
  ai: 'photo-1677442136019-21780ecad995',
  cloud: 'photo-1451187580459-43490279c0fa',
  frontend: 'photo-1542831371-29b0f74f9713',
  backend: 'photo-1558494949-ef010cbdcc31',
  mobile: 'photo-1512941937609-7625e61fe288',
  data: 'photo-1551288049-bebda4e38f71',
};
export const unsplash = (key: keyof typeof UNSPLASH = 'code', w = 1200) =>
  `https://images.unsplash.com/${UNSPLASH[key]}?w=${w}`;

const VN_TECH_POSTS = [
  'Vừa hoàn thành luồng contract-first với TypeSpec + Orval + MSW. Dev experience mượt hơn hẳn 🔥',
  'Case study mới: cải thiện onboarding từ 41% lên 68% bằng progressive disclosure.',
  'Anh em cần tài liệu học RAG cho production không? Mình tổng hợp 1 checklist thực chiến rồi.',
  'So sánh 3 chiến lược cache invalidation cho social feed ở quy mô 100k DAU.',
  'Weekly learning: 5 anti-pattern phổ biến khi scale micro-frontend và cách tránh.',
  'Bên mình đang tuyển Fresher DevOps intern (HCM, hybrid). Có mentor 1-1 và budget học cert.',
  'React Server Components giờ đây mới thực sự bắt đầu được dùng trong production. Trải nghiệm của mình.',
  'Mình vừa migrate xong 200k dòng code từ JavaScript sang TypeScript. Bài học rút ra.',
  'System design: Thiết kế notification service cho 1 triệu user. Thread dài nhưng xứng đáng đọc.',
  'Kubernetes hay Docker Compose cho project nhỏ? Câu trả lời không đơn giản như bạn nghĩ.',
  'Chia sẻ template CI/CD production-ready dùng GitHub Actions + Docker + nginx.',
  'Học Next.js App Router mà không hiểu Server Components? Đây là foundation cần biết.',
];

const VN_COMMENTS = [
  'Flow này sạch và dễ scale đó. Nhớ thêm case test cho refresh token nữa nhé.',
  'Cho mình xin branch này để demo cho team frontend với.',
  'Rất hữu ích! Mình đang gặp vấn đề tương tự, thử ngay.',
  'Cách tiếp cận hay đấy. Bạn có tính dùng WebSocket không?',
  'Thanks for sharing! Đã bookmark lại để đọc kỹ hơn.',
  'Mình đã thử cách này nhưng gặp vấn đề với cache invalidation. Bạn xử lý thế nào?',
  'Bài viết rất chi tiết. Cần thêm phần error handling thì hoàn hảo.',
  'Đồng ý với approach này. Mình cũng đang làm tương tự cho dự án hiện tại.',
];

// ─── model factories ──────────────────────────────────────────────────────────

export function makeAuthor(overrides: Partial<Author> = {}): Author {
  return {
    id: makeId('usr'),
    display_name: faker.person.fullName(),
    username: faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '.')
      .slice(0, 20),
    avatar: pickAvatar(),
    role: faker.helpers.arrayElement(['STUDENT', 'TEACHER', 'USER']),
    account_status: 'ACTIVE',
    ...overrides,
  };
}

export function makePostSummary(overrides: Partial<PostSummary> = {}): PostSummary {
  const baseDate = faker.date.recent({ days: 7 });
  return {
    id: makeId('post'),
    author: makeAuthor(),
    content: faker.helpers.arrayElement(VN_TECH_POSTS),
    media_urls: [],
    media: [],
    stats: {
      reactions: faker.number.int({ min: 0, max: 120 }),
      comments: faker.number.int({ min: 0, max: 50 }),
      shares: faker.number.int({ min: 0, max: 20 }),
    },
    user_reaction: faker.helpers.arrayElement([
      ...Object.values(ReactionType),
      null,
      null,
      null,
    ]),
    visibility: Visibility.PUBLIC,
    post_type: faker.helpers.arrayElement(Object.values(PostType)),
    created_at: baseDate.toISOString(),
    updated_at: new Date(baseDate.getTime() + faker.number.int({ min: 0, max: 3_600_000 })).toISOString(),
    ...overrides,
  };
}

export function makeComment(post_id: string, overrides: Partial<Comment> = {}): Comment {
  const baseDate = faker.date.recent({ days: 2 });
  return {
    id: makeId('cmt'),
    post_id: post_id,
    author: makeAuthor(),
    parent_comment_id: null,
    content: faker.helpers.arrayElement(VN_COMMENTS),
    media_urls: [],
    stats: {
      reactions: faker.number.int({ min: 0, max: 15 }),
      replies: 0,
    },
    user_reaction: null,
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    ...overrides,
  };
}

export function makeUserMe(overrides: Partial<UserMe> = {}): UserMe {
  return {
    id: makeId('usr'),
    username: faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '.')
      .slice(0, 20),
    display_name: faker.person.fullName(),
    bio: faker.lorem.sentences(2),
    avatar: pickAvatar(),
    background: null,
    account_status: 'ACTIVE',
    role: 'STUDENT',
    created_at: faker.date.past({ years: 1 }).toISOString(),
    email: faker.internet.email(),
    phone: null,
    birth_date: null,
    followers: faker.number.int({ min: 0, max: 500 }),
    following: faker.number.int({ min: 0, max: 300 }),
    posts_count: faker.number.int({ min: 0, max: 100 }),
    ...overrides,
  };
}

export function makeUserPublic(overrides: Partial<UserPublic> = {}): UserPublic {
  return {
    id: makeId('usr'),
    username: faker.internet
      .username()
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, '.')
      .slice(0, 20),
    display_name: faker.person.fullName(),
    bio: faker.lorem.sentences(2),
    avatar: pickAvatar(),
    background: null,
    account_status: 'ACTIVE',
    role: 'STUDENT',
    created_at: faker.date.past({ years: 1 }).toISOString(),
    followers: faker.number.int({ min: 0, max: 1000 }),
    following: faker.number.int({ min: 0, max: 500 }),
    posts_count: faker.number.int({ min: 0, max: 150 }),
    viewer_context: { is_owner: false, is_friend: false, friendship_status: 'NONE', friend_request_id: null },
    redacted_fields: [],
    ...overrides,
  };
}

export function makeNotification(
  actor: Author,
  overrides: Partial<Notification> = {},
): Notification {
  const type = faker.helpers.arrayElement(Object.values(NotificationType));
  const messages: Record<NotificationType, string> = {
    [NotificationType.FRIEND_REQUEST]: `${actor.display_name} đã gửi lời mời kết bạn cho bạn`,
    [NotificationType.FRIEND_ACCEPT]: `${actor.display_name} đã chấp nhận lời mời kết bạn`,
    [NotificationType.POST_LIKE]: `${actor.display_name} đã thích bài viết của bạn`,
    [NotificationType.POST_COMMENT]: `${actor.display_name} đã bình luận về bài viết của bạn`,
    [NotificationType.COMMENT_REPLY]: `${actor.display_name} đã trả lời bình luận của bạn`,
    [NotificationType.MENTION]: `${actor.display_name} đã đề cập đến bạn`,
    [NotificationType.SYSTEM]: 'Thông báo hệ thống: Hoàn thiện profile để kết nối dễ hơn',
  };
  return {
    id: makeId('notif'),
    type,
    actor,
    is_read: faker.datatype.boolean({ probability: 0.4 }),
    message: messages[type],
    created_at: faker.date.recent({ days: 7 }).toISOString(),
    ...overrides,
  };
}

export function makeFriend(user: Author, overrides: Partial<Friend> = {}): Friend {
  return {
    id: makeId('friend'),
    user,
    created_at: faker.date.past({ years: 1 }).toISOString(),
    ...overrides,
  };
}

export function makeFriendRequest(
  requester: Author,
  addressee: Author,
  overrides: Partial<FriendRequest> = {},
): FriendRequest {
  return {
    id: makeId('req'),
    requester,
    addressee,
    status: 'PENDING',
    created_at: faker.date.recent({ days: 14 }).toISOString(),
    ...overrides,
  };
}

export function makeField(id: string, name: string, overrides: Partial<Field> = {}): Field {
  return {
    id,
    name,
    hashtag: `#${name.replace(/\s+/g, '')}`,
    description: faker.lorem.sentences(2),
    banner_url: unsplash('code'),
    stats: {
      posts_count: faker.number.int({ min: 50, max: 300 }),
      followers_count: faker.number.int({ min: 500, max: 5000 }),
    },
    is_following: false,
    ...overrides,
  };
}
