/**
 * Seed script – generates mock/db.json from @faker-js/faker.
 * Run: pnpm mock:seed
 */
import { faker } from '@faker-js/faker'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

faker.seed(42)

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── helpers ────────────────────────────────────────────────────────────────

function uid() {
  return faker.string.uuid()
}

function isoDate(daysAgo = 0) {
  return faker.date.recent({ days: 30 + daysAgo }).toISOString()
}

const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as const
const VISIBILITIES = ['PUBLIC', 'FRIENDS', 'PRIVATE'] as const
const POST_TYPES = ['SOCIAL', 'JOB', 'QUESTION'] as const
const NOTIFICATION_TYPES = [
  'FRIEND_REQUEST',
  'FRIEND_ACCEPT',
  'POST_LIKE',
  'POST_COMMENT',
  'COMMENT_REPLY',
  'MENTION',
] as const
const ROLES = ['STUDENT', 'TEACHER', 'ADMIN', 'STAFF'] as const
const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── users ──────────────────────────────────────────────────────────────────

function makeAuthor(u: ReturnType<typeof makeUser>) {
  return {
    id: u.id,
    display_name: u.display_name,
    username: u.username,
    avatar: u.avatar,
    role: u.role,
    account_status: u.account_status,
  }
}

function makeUser(overrides: Partial<ReturnType<typeof _makeUser>> = {}) {
  return { ..._makeUser(), ...overrides }
}

function _makeUser() {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const username = faker.internet.username({ firstName, lastName }).toLowerCase().replace(/[^a-z0-9_]/g, '_')
  return {
    id: uid(),
    username,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: 'password123',
    display_name: `${firstName} ${lastName}`,
    avatar: faker.image.avatar(),
    background: faker.image.urlPicsumPhotos({ width: 1200, height: 400 }),
    bio: faker.lorem.sentence(),
    birth_date: faker.date.birthdate({ min: 18, max: 35, mode: 'age' }).toISOString().split('T')[0],
    role: pick(ROLES),
    gender: pick(GENDERS),
    account_status: 'active',
    storage_quota_mb: 1024,
    followers: faker.number.int({ min: 0, max: 500 }),
    following: faker.number.int({ min: 0, max: 300 }),
    posts_count: 0,
    privacy: { default_visibility: 'PUBLIC', overrides: [] },
    personal_info: {
      education_level: 'university',
      school: faker.company.name() + ' University',
      major: faker.person.jobArea(),
      location: `${faker.location.city()}, ${faker.location.country()}`,
    },
    created_at: isoDate(90),
    updated_at: isoDate(5),
  }
}

// ─── generate data ───────────────────────────────────────────────────────────

const ME_USER = makeUser({
  id: 'user-me',
  username: 'hieu_dev',
  email: 'hieu@example.com',
  display_name: 'Hiếu Developer',
  role: 'STUDENT',
  avatar: faker.image.avatar(),
})

const OTHER_USERS = Array.from({ length: 12 }, () => makeUser())
const ALL_USERS = [ME_USER, ...OTHER_USERS]

// ─── posts ───────────────────────────────────────────────────────────────────

const POST_CONTENT_SAMPLES = [
  'Hôm nay mình đã hoàn thành project cuối kỳ! 🎉 Cảm giác thật tuyệt vời sau bao ngày nỗ lực.',
  'Ai có tài liệu ôn tập môn Giải tích chương 3 không? Mình đang cần gấp 😅',
  'Vừa tham gia workshop về AI và Machine Learning. Kiến thức thực sự bổ ích!',
  'Chia sẻ một số mẹo học lập trình hiệu quả mà mình đã áp dụng...',
  'Mình vừa được nhận vào công ty X để thực tập mùa hè này! So excited 🚀',
  'Code mãi không chạy... Debugging là cả một nghệ thuật 😤',
  'Bài tập nhóm xong rồi! Team mình làm việc ăn ý lắm hehe',
  'Thư viện trường đóng cửa sớm quá, mình không kịp mượn sách 😢',
  'Đang tìm hiểu về Docker và Kubernetes. Có ai muốn học cùng không?',
  'Kết quả thi cuối kỳ ra rồi, may mắn qua được môn khó nhất 😅',
  'Seminar về Blockchain chiều nay rất hay! Hiểu hơn về công nghệ này.',
  'Ai biết bug này do đâu không? TypeError: Cannot read properties of undefined 🤔',
  'Mình đang làm đồ án tốt nghiệp về nhận dạng khuôn mặt bằng AI.',
  'Team building hôm nay vui quá! Cả lớp chơi cùng nhau thật thân thiện.',
  'Chia sẻ resources học React.js cho người mới bắt đầu:',
  'Cuộc thi lập trình đang đến gần, ai muốn lập team không?',
  'Cuối tuần này có buổi hackathon tại trường, ai tham gia không?',
  'Vừa đọc xong cuốn sách "Clean Code" - thực sự thay đổi cách mình viết code!',
  'Môn Cơ sở dữ liệu semester này khó thật, nhưng rất thú vị.',
  'Mình đang tìm kiếm mentor để định hướng career path. Có ai giúp được không?',
]

function makePost(authorUser: typeof ME_USER) {
  const reactions = faker.number.int({ min: 0, max: 200 })
  const comments = faker.number.int({ min: 0, max: 50 })
  const shares = faker.number.int({ min: 0, max: 30 })
  return {
    id: uid(),
    author: makeAuthor(authorUser),
    content: pick(POST_CONTENT_SAMPLES as readonly string[]),
    media_urls: Math.random() > 0.7 ? [faker.image.urlPicsumPhotos({ width: 800, height: 600 })] : [],
    media: [] as unknown[],
    stats: { reactions, comments, shares },
    user_reaction: null,
    visibility: pick(VISIBILITIES),
    post_type: pick(POST_TYPES),
    field_id: Math.random() > 0.5 ? faker.string.uuid() : undefined,
    shared_post: null,
    created_at: isoDate(faker.number.int({ min: 0, max: 20 })),
    updated_at: isoDate(faker.number.int({ min: 0, max: 5 })),
  }
}

// 8 posts by me, 32 by others
const MY_POSTS = Array.from({ length: 8 }, () => makePost(ME_USER))
const OTHER_POSTS = Array.from({ length: 32 }, () => makePost(pick(OTHER_USERS)))
const ALL_POSTS = [...MY_POSTS, ...OTHER_POSTS]

// Update posts_count for me
;(ME_USER as Record<string, unknown>).posts_count = MY_POSTS.length

// ─── comments ────────────────────────────────────────────────────────────────

function makeComment(postId: string, parentId: string | null = null) {
  const author = pick(ALL_USERS)
  return {
    id: uid(),
    post_id: postId,
    author: makeAuthor(author),
    parent_comment_id: parentId,
    content: faker.lorem.sentences({ min: 1, max: 3 }),
    media_urls: [] as string[],
    stats: {
      reactions: faker.number.int({ min: 0, max: 50 }),
      replies: 0,
    },
    user_reaction: null,
    created_at: isoDate(faker.number.int({ min: 0, max: 15 })),
    updated_at: isoDate(0),
  }
}

const ALL_COMMENTS: ReturnType<typeof makeComment>[] = []
for (const post of ALL_POSTS) {
  const count = faker.number.int({ min: 0, max: 6 })
  const postComments: typeof ALL_COMMENTS = []
  for (let i = 0; i < count; i++) {
    const comment = makeComment(post.id)
    postComments.push(comment)
    ALL_COMMENTS.push(comment)
    // Add 0–2 replies
    const replyCount = faker.number.int({ min: 0, max: 2 })
    for (let j = 0; j < replyCount; j++) {
      const reply = makeComment(post.id, comment.id)
      comment.stats.replies++
      ALL_COMMENTS.push(reply)
    }
  }
}

// ─── reactions ───────────────────────────────────────────────────────────────

const POST_REACTIONS: {
  id: string
  post_id: string
  user_id: string
  reaction: string
  created_at: string
}[] = []

// Add some reactions from ME to random posts
const reactedPosts = OTHER_POSTS.slice(0, 10)
for (const post of reactedPosts) {
  const reaction = pick(REACTION_TYPES)
  POST_REACTIONS.push({
    id: uid(),
    post_id: post.id,
    user_id: ME_USER.id,
    reaction,
    created_at: isoDate(),
  })
  post.user_reaction = reaction
}

// ─── friend requests ──────────────────────────────────────────────────────────

function makeFriendRequest(
  requesterId: string,
  addresseeId: string,
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' = 'PENDING',
) {
  const requester = ALL_USERS.find(u => u.id === requesterId)!
  const addressee = ALL_USERS.find(u => u.id === addresseeId)!
  return {
    id: uid(),
    requester: makeAuthor(requester),
    addressee: makeAuthor(addressee),
    status,
    created_at: isoDate(faker.number.int({ min: 0, max: 30 })),
  }
}

// Me sent requests to users 5–7, received from users 8–10
const FRIEND_REQUESTS = [
  makeFriendRequest(ME_USER.id, OTHER_USERS[4].id, 'PENDING'),
  makeFriendRequest(ME_USER.id, OTHER_USERS[5].id, 'ACCEPTED'),
  makeFriendRequest(ME_USER.id, OTHER_USERS[6].id, 'REJECTED'),
  makeFriendRequest(OTHER_USERS[7].id, ME_USER.id, 'PENDING'),
  makeFriendRequest(OTHER_USERS[8].id, ME_USER.id, 'PENDING'),
  makeFriendRequest(OTHER_USERS[9].id, ME_USER.id, 'ACCEPTED'),
]

// ─── friends ─────────────────────────────────────────────────────────────────

const FRIENDS = [
  { id: uid(), user_id: ME_USER.id, friend_id: OTHER_USERS[0].id, user: makeAuthor(OTHER_USERS[0]), created_at: isoDate(60) },
  { id: uid(), user_id: ME_USER.id, friend_id: OTHER_USERS[1].id, user: makeAuthor(OTHER_USERS[1]), created_at: isoDate(45) },
  { id: uid(), user_id: ME_USER.id, friend_id: OTHER_USERS[2].id, user: makeAuthor(OTHER_USERS[2]), created_at: isoDate(30) },
  { id: uid(), user_id: ME_USER.id, friend_id: OTHER_USERS[3].id, user: makeAuthor(OTHER_USERS[3]), created_at: isoDate(20) },
  { id: uid(), user_id: ME_USER.id, friend_id: OTHER_USERS[5].id, user: makeAuthor(OTHER_USERS[5]), created_at: isoDate(5) },
  { id: uid(), user_id: ME_USER.id, friend_id: OTHER_USERS[9].id, user: makeAuthor(OTHER_USERS[9]), created_at: isoDate(2) },
]

// ─── follows ─────────────────────────────────────────────────────────────────

const FOLLOWS = [
  ...Array.from({ length: 8 }, (_, i) => ({
    id: uid(),
    follower_id: ME_USER.id,
    followed_id: OTHER_USERS[i].id,
    created_at: isoDate(faker.number.int({ min: 1, max: 30 })),
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: uid(),
    follower_id: OTHER_USERS[i].id,
    followed_id: ME_USER.id,
    created_at: isoDate(faker.number.int({ min: 1, max: 30 })),
  })),
]

// ─── notifications ────────────────────────────────────────────────────────────

function makeNotification(type: (typeof NOTIFICATION_TYPES)[number], isRead = false) {
  const actor = pick(OTHER_USERS)
  const targetPost = pick(ALL_POSTS)
  const messages: Record<string, string> = {
    FRIEND_REQUEST: `${actor.display_name} đã gửi lời mời kết bạn cho bạn.`,
    FRIEND_ACCEPT: `${actor.display_name} đã chấp nhận lời mời kết bạn.`,
    POST_LIKE: `${actor.display_name} đã thích bài viết của bạn.`,
    POST_COMMENT: `${actor.display_name} đã bình luận về bài viết của bạn.`,
    COMMENT_REPLY: `${actor.display_name} đã trả lời bình luận của bạn.`,
    MENTION: `${actor.display_name} đã đề cập đến bạn trong một bài viết.`,
    SYSTEM: 'Có thông báo hệ thống mới từ ban quản trị.',
  }
  return {
    id: uid(),
    type,
    actor: makeAuthor(actor),
    target_id: targetPost.id,
    target_type: 'post' as const,
    message: messages[type] || 'Thông báo mới.',
    is_read: isRead,
    created_at: isoDate(faker.number.int({ min: 0, max: 7 })),
  }
}

const NOTIFICATIONS = [
  makeNotification('FRIEND_REQUEST', false),
  makeNotification('POST_LIKE', false),
  makeNotification('POST_COMMENT', false),
  makeNotification('FRIEND_ACCEPT', true),
  makeNotification('COMMENT_REPLY', false),
  makeNotification('POST_LIKE', true),
  makeNotification('MENTION', false),
  makeNotification('POST_COMMENT', true),
  makeNotification('FRIEND_REQUEST', false),
  makeNotification('POST_LIKE', true),
  makeNotification('COMMENT_REPLY', true),
  makeNotification('POST_COMMENT', false),
]

// ─── shares ───────────────────────────────────────────────────────────────────

const SHARES = ALL_POSTS.slice(0, 3).map(post => ({
  id: uid(),
  post_id: post.id,
  user_id: ME_USER.id,
  message: faker.lorem.sentence(),
  created_at: isoDate(),
}))

// ─── media assets ─────────────────────────────────────────────────────────────

const MEDIA_ASSETS = Array.from({ length: 10 }, () => ({
  id: uid(),
  type: pick(['image', 'video', 'file'] as const),
  access: 'public' as const,
  status: 'ready' as const,
  cdn_url: faker.image.urlPicsumPhotos({ width: 800, height: 600 }),
  original_url: faker.image.urlPicsumPhotos({ width: 800, height: 600 }),
  thumbnail_url: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),
  width: 800,
  height: 600,
  content_type: 'image/jpeg',
  size_bytes: faker.number.int({ min: 100000, max: 5000000 }),
  created_at: isoDate(),
}))

// ─── write db.json ────────────────────────────────────────────────────────────

const db = {
  users: ALL_USERS,
  posts: ALL_POSTS,
  comments: ALL_COMMENTS,
  post_reactions: POST_REACTIONS,
  friend_requests: FRIEND_REQUESTS,
  friends: FRIENDS,
  follows: FOLLOWS,
  notifications: NOTIFICATIONS,
  shares: SHARES,
  media_assets: MEDIA_ASSETS,
}

mkdirSync(__dirname, { recursive: true })
const dbPath = join(__dirname, 'db.json')
writeFileSync(dbPath, JSON.stringify(db, null, 2))
console.log(`✅ Seed written to ${dbPath}`)
console.log(`   Users: ${ALL_USERS.length}`)
console.log(`   Posts: ${ALL_POSTS.length}`)
console.log(`   Comments: ${ALL_COMMENTS.length}`)
console.log(`   Notifications: ${NOTIFICATIONS.length}`)
console.log(``)
console.log(`🔑 Login with:  email=hieu@example.com  password=password123`)
