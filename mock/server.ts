/**
 * Mock API server – Express + json-server on port 3001.
 *
 * Endpoints mirror the contract (contract/main.tsp).
 * All responses are wrapped in { success: true, data: T, request_id: string }.
 *
 * Run: pnpm mock:server
 * Login: hieu@example.com / password123
 */
import { createRequire } from 'module'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// json-server v0 is CommonJS – load via createRequire for ESM compat
const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jsonServer = require('json-server') as {
  create: () => ReturnType<typeof express>
  router: (path: string) => {
    db: { get: (k: string) => { value: () => unknown[] } }
    render: (req: Request, res: Response) => void
  } & ReturnType<typeof express.Router>
  defaults: (opts?: object) => ReturnType<typeof express>
  bodyParser: ReturnType<typeof express>
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'db.json')
const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 3001

// ─── db helpers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

function getDb(): AnyRecord {
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
}

function saveDb(data: AnyRecord) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── response helpers ─────────────────────────────────────────────────────────

function wrap<T>(data: T) {
  return { success: true as const, data, request_id: `mock_${Date.now()}` }
}

function reply<T>(res: Response, data: T, status = 200) {
  res.status(status).json(wrap(data))
}

function notFound(res: Response, message = 'Not found') {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } })
}

function badRequest(res: Response, message = 'Bad request') {
  res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message } })
}

// ─── auth helpers ─────────────────────────────────────────────────────────────

function tokenForUser(userId: string) {
  return `mock_${userId}`
}

function userIdFromToken(token: string): string | null {
  if (token.startsWith('mock_')) return token.slice(5)
  return null
}

function getCurrentUser(req: Request): AnyRecord | null {
  const auth = req.headers.authorization ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  const userId = userIdFromToken(token)
  if (!userId) return null
  const db = getDb()
  return (db.users as AnyRecord[]).find(u => u.id === userId) ?? null
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getCurrentUser(req)
  if (!user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } })
    return
  }
  ;(req as AnyRecord)._user = user
  next()
}

// ─── pagination helpers ───────────────────────────────────────────────────────

function cursorPaginate<T extends AnyRecord>(
  items: T[],
  cursor: string | undefined,
  limit: number,
): { items: T[]; pagination: { next_cursor: string | null; has_next_page: boolean } } {
  const sorted = [...items].sort((a, b) => (a.created_at > b.created_at ? -1 : 1))
  let startIdx = 0
  if (cursor) {
    const idx = sorted.findIndex(i => i.id === cursor)
    startIdx = idx >= 0 ? idx + 1 : 0
  }
  const page = sorted.slice(startIdx, startIdx + limit)
  const hasNext = startIdx + limit < sorted.length
  return {
    items: page,
    pagination: {
      next_cursor: hasNext ? page[page.length - 1]?.id ?? null : null,
      has_next_page: hasNext,
    },
  }
}

function offsetPaginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; pagination: { page: number; page_size: number; total: number; total_pages: number } } {
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    pagination: { page, page_size: pageSize, total, total_pages: totalPages },
  }
}

function safeUser(user: AnyRecord): AnyRecord {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = user
  return safe
}

function toAuthor(user: AnyRecord) {
  return {
    id: user.id,
    display_name: user.display_name,
    username: user.username,
    avatar: user.avatar ?? null,
    role: user.role,
    account_status: user.account_status,
  }
}

// ─── server setup ─────────────────────────────────────────────────────────────

const server = jsonServer.create()
const router = jsonServer.router(DB_PATH)

server.use(cors({ origin: true, credentials: true }))
server.use(jsonServer.bodyParser)

// ─── AUTH ─────────────────────────────────────────────────────────────────────

server.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) return badRequest(res, 'email and password are required')
  const db = getDb()
  const user = (db.users as AnyRecord[]).find(u => u.email === email)
  if (!user || password !== 'password123') {
    return res
      .status(400)
      .json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
  }
  reply(res, { access: tokenForUser(user.id), refresh: `refresh_${user.id}`, tenant_slug: user.username })
})

server.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, display_name, role, gender } = req.body as AnyRecord
  if (!email || !password || !display_name) return badRequest(res, 'Missing required fields')
  const db = getDb()
  if ((db.users as AnyRecord[]).some(u => u.email === email)) {
    return badRequest(res, 'Email already registered')
  }
  const newUser: AnyRecord = {
    id: genId(),
    username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    email,
    password,
    display_name,
    avatar: null,
    background: null,
    bio: '',
    role: role ?? 'STUDENT',
    gender: gender ?? 'OTHER',
    account_status: 'pending_verification',
    storage_quota_mb: 1024,
    followers: 0,
    following: 0,
    posts_count: 0,
    privacy: { default_visibility: 'PUBLIC', overrides: [] },
    personal_info: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.users.push(newUser)
  saveDb(db)
  reply(res, { id: newUser.id, email: newUser.email, username: newUser.username }, 201)
})

server.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { user_id } = req.body as AnyRecord
  const db = getDb()
  const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === user_id)
  if (userIdx >= 0) {
    db.users[userIdx].account_status = 'active'
    saveDb(db)
  }
  reply(res, { tenant_id: `tenant_${user_id}`, tenant_slug: db.users[userIdx]?.username ?? user_id, status: 'active' })
})

server.post('/api/auth/resend-otp', (_req: Request, res: Response) => {
  reply(res, { message: 'OTP sent' })
})

server.post('/api/auth/refresh', (req: Request, res: Response) => {
  const { refresh } = req.body as { refresh?: string }
  if (!refresh || !refresh.startsWith('refresh_')) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } })
  }
  const userId = refresh.replace('refresh_', '')
  reply(res, { access: tokenForUser(userId), refresh })
})

server.post('/api/auth/forgot-password', (_req: Request, res: Response) => {
  reply(res, { message: 'Password reset email sent' })
})

server.post('/api/auth/reset-password', (_req: Request, res: Response) => {
  reply(res, { message: 'Password reset successfully' })
})

server.post('/api/auth/change-password', requireAuth, (_req: Request, res: Response) => {
  reply(res, { message: 'Password changed successfully' })
})

server.post('/api/auth/logout', requireAuth, (_req: Request, res: Response) => {
  res.status(204).send()
})

// ─── USERS / ME ───────────────────────────────────────────────────────────────

server.get('/api/users/me', requireAuth, (req: Request, res: Response) => {
  reply(res, safeUser((req as AnyRecord)._user))
})

server.patch('/api/users/me/profile', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === me.id)
  const updates = req.body as AnyRecord
  const allowed = ['display_name', 'username', 'bio', 'birth_date', 'personal_info']
  for (const key of allowed) {
    if (updates[key] !== undefined) db.users[userIdx][key] = updates[key]
  }
  db.users[userIdx].updated_at = new Date().toISOString()
  saveDb(db)
  reply(res, safeUser(db.users[userIdx]))
})

server.post('/api/users/me/avatar', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === me.id)
  const { asset_id } = req.body as { asset_id?: string }
  const asset = (db.media_assets as AnyRecord[]).find(a => a.id === asset_id)
  const avatarUrl = asset?.cdn_url ?? `https://picsum.photos/seed/${asset_id ?? genId()}/200/200`
  db.users[userIdx].avatar = avatarUrl
  db.users[userIdx].updated_at = new Date().toISOString()
  saveDb(db)
  reply(res, { avatar_url: avatarUrl })
})

server.post('/api/users/me/background', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === me.id)
  const { asset_id } = req.body as { asset_id?: string }
  const asset = (db.media_assets as AnyRecord[]).find(a => a.id === asset_id)
  const bgUrl = asset?.cdn_url ?? `https://picsum.photos/seed/${asset_id ?? genId()}/1200/400`
  db.users[userIdx].background = bgUrl
  db.users[userIdx].updated_at = new Date().toISOString()
  saveDb(db)
  reply(res, { background_url: bgUrl })
})

server.get('/api/users/me/privacy', requireAuth, (req: Request, res: Response) => {
  reply(res, ((req as AnyRecord)._user as AnyRecord).privacy ?? { default_visibility: 'PUBLIC', overrides: [] })
})

server.put('/api/users/me/privacy', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === me.id)
  const privacy = req.body as AnyRecord
  db.users[userIdx].privacy = { ...db.users[userIdx].privacy, ...privacy }
  db.users[userIdx].updated_at = new Date().toISOString()
  saveDb(db)
  reply(res, db.users[userIdx].privacy)
})

server.post('/api/users/me/deactivate', requireAuth, (_req: Request, res: Response) => {
  reply(res, { message: 'Account deactivated' })
})

server.post('/api/users/me/reactivate', (_req: Request, res: Response) => {
  reply(res, { message: 'Reactivation request submitted' })
})

server.get('/api/users/me/reactivation-requests', (_req: Request, res: Response) => {
  reply(res, { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 } })
})

// ─── PROFILES ─────────────────────────────────────────────────────────────────

server.get('/api/profiles/:username', (req: Request, res: Response) => {
  const db = getDb()
  const user = (db.users as AnyRecord[]).find(u => u.username === req.params.username)
  if (!user) return notFound(res, 'Profile not found')
  const me = getCurrentUser(req)
  const isFriend = me
    ? (db.friends as AnyRecord[]).some(
        f => (f.user_id === me.id && f.friend_id === user.id) || (f.user_id === user.id && f.friend_id === me.id),
      )
    : false
  const friendRequest = me
    ? (db.friend_requests as AnyRecord[]).find(
        fr =>
          (fr.requester.id === me.id && fr.addressee.id === user.id) ||
          (fr.requester.id === user.id && fr.addressee.id === me.id),
      )
    : null
  reply(res, {
    ...user,
    viewer_context: me
      ? {
          is_owner: me.id === user.id,
          is_friend: isFriend,
          friendship_status: isFriend ? 'ACCEPTED' : friendRequest?.status ?? null,
          friend_request_id: friendRequest?.id ?? null,
        }
      : undefined,
  })
})

// ─── FEED ─────────────────────────────────────────────────────────────────────

server.get('/api/feed', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const cursor = req.query.cursor as string | undefined
  const limit = Math.min(Number(req.query.limit ?? 10), 50)
  const postType = req.query.post_type as string | undefined
  const fieldId = req.query.field_id as string | undefined

  // Feed = my posts + friends' posts
  const friendIds = new Set<string>(
    (db.friends as AnyRecord[]).filter(f => f.user_id === me.id || f.friend_id === me.id).flatMap(f => [f.user_id, f.friend_id]),
  )
  friendIds.add(me.id)

  let posts = (db.posts as AnyRecord[]).filter(p => friendIds.has(p.author.id) || p.visibility === 'PUBLIC')
  if (postType) posts = posts.filter(p => p.post_type === postType)
  if (fieldId) posts = posts.filter(p => p.field_id === fieldId)

  // Attach current user's reactions
  const myReactions = new Map<string, string>(
    (db.post_reactions as AnyRecord[]).filter(r => r.user_id === me.id).map(r => [r.post_id, r.reaction]),
  )
  posts = posts.map(p => ({ ...p, user_reaction: myReactions.get(p.id) ?? null }))

  reply(res, cursorPaginate(posts, cursor, limit))
})

// ─── POSTS ────────────────────────────────────────────────────────────────────

server.get('/api/posts', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 10)
  const myReactions = new Map<string, string>(
    (db.post_reactions as AnyRecord[]).filter(r => r.user_id === me.id).map(r => [r.post_id, r.reaction]),
  )
  const posts = (db.posts as AnyRecord[]).map(p => ({ ...p, user_reaction: myReactions.get(p.id) ?? null }))
  reply(res, offsetPaginate(posts, page, pageSize))
})

server.post('/api/posts', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const { content_text, visibility, post_type, field_id, media_asset_ids } = req.body as AnyRecord
  if (!content_text) return badRequest(res, 'content_text is required')

  const mediaAssets = (db.media_assets as AnyRecord[]).filter(a => (media_asset_ids ?? []).includes(a.id))
  const newPost: AnyRecord = {
    id: genId(),
    author: toAuthor(me),
    content: content_text,
    media_urls: mediaAssets.map((a: AnyRecord) => a.cdn_url).filter(Boolean),
    media: mediaAssets,
    stats: { reactions: 0, comments: 0, shares: 0 },
    user_reaction: null,
    visibility: visibility ?? 'PUBLIC',
    post_type: post_type ?? 'SOCIAL',
    field_id: field_id ?? undefined,
    shared_post: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.posts.push(newPost)
  // update posts_count
  const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === me.id)
  if (userIdx >= 0) db.users[userIdx].posts_count = (db.users[userIdx].posts_count ?? 0) + 1
  saveDb(db)
  reply(res, newPost, 201)
})

server.get('/api/posts/me', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const cursor = req.query.cursor as string | undefined
  const limit = Math.min(Number(req.query.limit ?? 10), 50)
  const posts = (db.posts as AnyRecord[]).filter(p => p.author.id === me.id)
  reply(res, cursorPaginate(posts, cursor, limit))
})

server.get('/api/posts/users/:userId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const cursor = req.query.cursor as string | undefined
  const limit = Math.min(Number(req.query.limit ?? 10), 50)
  const posts = (db.posts as AnyRecord[]).filter(p => p.author.id === req.params.userId)
  reply(res, cursorPaginate(posts, cursor, limit))
})

server.get('/api/posts/:postId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const post = (db.posts as AnyRecord[]).find(p => p.id === req.params.postId)
  if (!post) return notFound(res, 'Post not found')
  reply(res, post)
})

server.patch('/api/posts/:postId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.posts as AnyRecord[]).findIndex(p => p.id === req.params.postId)
  if (idx < 0) return notFound(res, 'Post not found')
  if (db.posts[idx].author.id !== me.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } })
  }
  const { content_text, visibility } = req.body as AnyRecord
  if (content_text) db.posts[idx].content = content_text
  if (visibility) db.posts[idx].visibility = visibility
  db.posts[idx].updated_at = new Date().toISOString()
  saveDb(db)
  reply(res, db.posts[idx])
})

server.delete('/api/posts/:postId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.posts as AnyRecord[]).findIndex(p => p.id === req.params.postId)
  if (idx < 0) return notFound(res, 'Post not found')
  if (db.posts[idx].author.id !== me.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } })
  }
  db.posts.splice(idx, 1)
  saveDb(db)
  res.status(204).send()
})

// ─── POST COMMENTS ────────────────────────────────────────────────────────────

server.get('/api/posts/:postId/comments', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const cursor = req.query.cursor as string | undefined
  const limit = Math.min(Number(req.query.limit ?? 10), 50)
  const topLevel = (db.comments as AnyRecord[]).filter(
    c => c.post_id === req.params.postId && c.parent_comment_id === null,
  )
  reply(res, cursorPaginate(topLevel, cursor, limit))
})

// ─── POST REACTIONS ───────────────────────────────────────────────────────────

server.get('/api/posts/:postId/reactions', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 20)
  const reactions = (db.post_reactions as AnyRecord[]).filter(r => r.post_id === req.params.postId)
  reply(res, offsetPaginate(reactions, page, pageSize))
})

server.post('/api/posts/:postId/reactions', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const { reaction } = req.body as { reaction?: string }
  if (!reaction) return badRequest(res, 'reaction is required')

  const postIdx = (db.posts as AnyRecord[]).findIndex(p => p.id === req.params.postId)
  if (postIdx < 0) return notFound(res, 'Post not found')

  // Remove existing reaction first
  const existingIdx = (db.post_reactions as AnyRecord[]).findIndex(
    r => r.post_id === req.params.postId && r.user_id === me.id,
  )
  if (existingIdx >= 0) {
    db.post_reactions.splice(existingIdx, 1)
    db.posts[postIdx].stats.reactions = Math.max(0, db.posts[postIdx].stats.reactions - 1)
  }

  const newReaction: AnyRecord = {
    id: genId(),
    post_id: req.params.postId,
    user_id: me.id,
    reaction,
    created_at: new Date().toISOString(),
  }
  db.post_reactions.push(newReaction)
  db.posts[postIdx].stats.reactions++
  db.posts[postIdx].user_reaction = reaction
  saveDb(db)
  reply(res, newReaction, 201)
})

server.delete('/api/posts/:postId/reactions', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.post_reactions as AnyRecord[]).findIndex(
    r => r.post_id === req.params.postId && r.user_id === me.id,
  )
  if (idx >= 0) {
    db.post_reactions.splice(idx, 1)
    const postIdx = (db.posts as AnyRecord[]).findIndex(p => p.id === req.params.postId)
    if (postIdx >= 0) {
      db.posts[postIdx].stats.reactions = Math.max(0, db.posts[postIdx].stats.reactions - 1)
      db.posts[postIdx].user_reaction = null
    }
    saveDb(db)
  }
  res.status(204).send()
})

// ─── POST SHARES ──────────────────────────────────────────────────────────────

server.post('/api/posts/:postId/share', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const postIdx = (db.posts as AnyRecord[]).findIndex(p => p.id === req.params.postId)
  if (postIdx < 0) return notFound(res, 'Post not found')
  const { message } = req.body as { message?: string }
  const share: AnyRecord = {
    id: genId(),
    post_id: req.params.postId,
    user_id: me.id,
    message: message ?? '',
    created_at: new Date().toISOString(),
  }
  db.shares.push(share)
  db.posts[postIdx].stats.shares++
  saveDb(db)
  reply(res, share, 201)
})

server.delete('/api/posts/:postId/share', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.shares as AnyRecord[]).findIndex(s => s.post_id === req.params.postId && s.user_id === me.id)
  if (idx >= 0) {
    db.shares.splice(idx, 1)
    const postIdx = (db.posts as AnyRecord[]).findIndex(p => p.id === req.params.postId)
    if (postIdx >= 0) db.posts[postIdx].stats.shares = Math.max(0, db.posts[postIdx].stats.shares - 1)
    saveDb(db)
  }
  res.status(204).send()
})

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

server.post('/api/comments', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const { post_id, content_text, media_asset_ids } = req.body as AnyRecord
  if (!post_id || !content_text) return badRequest(res, 'post_id and content_text required')
  const postIdx = (db.posts as AnyRecord[]).findIndex(p => p.id === post_id)
  if (postIdx < 0) return notFound(res, 'Post not found')
  const mediaAssets = (db.media_assets as AnyRecord[]).filter(a => (media_asset_ids ?? []).includes(a.id))
  const newComment: AnyRecord = {
    id: genId(),
    post_id,
    author: toAuthor(me),
    parent_comment_id: null,
    content: content_text,
    media_urls: mediaAssets.map((a: AnyRecord) => a.cdn_url).filter(Boolean),
    stats: { reactions: 0, replies: 0 },
    user_reaction: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.comments.push(newComment)
  db.posts[postIdx].stats.comments++
  saveDb(db)
  reply(res, newComment, 201)
})

server.get('/api/comments/:commentId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const comment = (db.comments as AnyRecord[]).find(c => c.id === req.params.commentId)
  if (!comment) return notFound(res, 'Comment not found')
  reply(res, comment)
})

server.patch('/api/comments/:commentId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.comments as AnyRecord[]).findIndex(c => c.id === req.params.commentId)
  if (idx < 0) return notFound(res, 'Comment not found')
  if (db.comments[idx].author.id !== me.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } })
  }
  const { content_text } = req.body as { content_text?: string }
  if (content_text) db.comments[idx].content = content_text
  db.comments[idx].updated_at = new Date().toISOString()
  saveDb(db)
  reply(res, db.comments[idx])
})

server.delete('/api/comments/:commentId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.comments as AnyRecord[]).findIndex(c => c.id === req.params.commentId)
  if (idx < 0) return notFound(res, 'Comment not found')
  if (db.comments[idx].author.id !== me.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } })
  }
  // Update parent post's comment count
  const post = (db.posts as AnyRecord[]).find(p => p.id === db.comments[idx].post_id)
  if (post) post.stats.comments = Math.max(0, post.stats.comments - 1)
  db.comments.splice(idx, 1)
  saveDb(db)
  res.status(204).send()
})

server.get('/api/comments/:commentId/replies', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const cursor = req.query.cursor as string | undefined
  const limit = Math.min(Number(req.query.limit ?? 10), 50)
  const replies = (db.comments as AnyRecord[]).filter(c => c.parent_comment_id === req.params.commentId)
  reply(res, cursorPaginate(replies, cursor, limit))
})

server.post('/api/comments/:commentId/replies', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const parent = (db.comments as AnyRecord[]).find(c => c.id === req.params.commentId)
  if (!parent) return notFound(res, 'Comment not found')
  const { post_id, content_text } = req.body as AnyRecord
  if (!content_text) return badRequest(res, 'content_text required')
  const newReply: AnyRecord = {
    id: genId(),
    post_id: post_id ?? parent.post_id,
    author: toAuthor(me),
    parent_comment_id: req.params.commentId,
    content: content_text,
    media_urls: [],
    stats: { reactions: 0, replies: 0 },
    user_reaction: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  db.comments.push(newReply)
  // Update parent stats.replies
  const parentIdx = (db.comments as AnyRecord[]).findIndex(c => c.id === req.params.commentId)
  if (parentIdx >= 0) db.comments[parentIdx].stats.replies++
  saveDb(db)
  reply(res, newReply, 201)
})

// ─── COMMENT REACTIONS ────────────────────────────────────────────────────────

server.post('/api/comments/:commentId/reactions', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const { reaction } = req.body as { reaction?: string }
  if (!reaction) return badRequest(res, 'reaction is required')
  const commentIdx = (db.comments as AnyRecord[]).findIndex(c => c.id === req.params.commentId)
  if (commentIdx < 0) return notFound(res, 'Comment not found')
  db.comments[commentIdx].stats.reactions++
  db.comments[commentIdx].user_reaction = reaction
  saveDb(db)
  reply(
    res,
    {
      id: genId(),
      comment_id: req.params.commentId,
      user_id: me.id,
      reaction,
      created_at: new Date().toISOString(),
    },
    201,
  )
})

server.delete('/api/comments/:commentId/reactions', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const commentIdx = (db.comments as AnyRecord[]).findIndex(c => c.id === req.params.commentId)
  if (commentIdx >= 0) {
    db.comments[commentIdx].stats.reactions = Math.max(0, db.comments[commentIdx].stats.reactions - 1)
    db.comments[commentIdx].user_reaction = null
    saveDb(db)
  }
  res.status(204).send()
})

// ─── FRIENDS ──────────────────────────────────────────────────────────────────

server.get('/api/friends', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 20)
  const friends = (db.friends as AnyRecord[])
    .filter(f => f.user_id === me.id || f.friend_id === me.id)
    .map(f => ({
      id: f.id,
      user: f.user_id === me.id ? f.user : toAuthor((db.users as AnyRecord[]).find(u => u.id === f.user_id)!),
      created_at: f.created_at,
    }))
  reply(res, offsetPaginate(friends, page, pageSize))
})

server.post('/api/friends/requests', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const { addressee_id, addressee_username } = req.body as AnyRecord
  let addressee: AnyRecord | undefined
  if (addressee_id) addressee = (db.users as AnyRecord[]).find(u => u.id === addressee_id)
  else if (addressee_username) addressee = (db.users as AnyRecord[]).find(u => u.username === addressee_username)
  if (!addressee) return notFound(res, 'User not found')
  const existing = (db.friend_requests as AnyRecord[]).find(
    fr =>
      fr.requester.id === me.id && fr.addressee.id === addressee!.id && fr.status === 'PENDING',
  )
  if (existing) return badRequest(res, 'Friend request already sent')
  const newReq: AnyRecord = {
    id: genId(),
    requester: toAuthor(me),
    addressee: toAuthor(addressee),
    status: 'PENDING',
    created_at: new Date().toISOString(),
  }
  db.friend_requests.push(newReq)
  saveDb(db)
  reply(res, newReq, 201)
})

server.get('/api/friends/requests/incoming', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 20)
  const incoming = (db.friend_requests as AnyRecord[]).filter(
    fr => fr.addressee.id === me.id && fr.status === 'PENDING',
  )
  reply(res, offsetPaginate(incoming, page, pageSize))
})

server.get('/api/friends/requests/outgoing', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 20)
  const outgoing = (db.friend_requests as AnyRecord[]).filter(
    fr => fr.requester.id === me.id && fr.status === 'PENDING',
  )
  reply(res, offsetPaginate(outgoing, page, pageSize))
})

server.get('/api/friends/requests', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 20)
  const all = (db.friend_requests as AnyRecord[]).filter(
    fr => fr.requester.id === me.id || fr.addressee.id === me.id,
  )
  reply(res, offsetPaginate(all, page, pageSize))
})

server.post('/api/friends/requests/:requestId/accept', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.friend_requests as AnyRecord[]).findIndex(fr => fr.id === req.params.requestId)
  if (idx < 0) return notFound(res, 'Friend request not found')
  const fr = db.friend_requests[idx]
  if (fr.addressee.id !== me.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } })
  }
  db.friend_requests[idx].status = 'ACCEPTED'
  // Create friendship
  const friendship = { id: genId(), user_id: fr.requester.id, friend_id: me.id, user: fr.requester, created_at: new Date().toISOString() }
  db.friends.push(friendship)
  saveDb(db)
  reply(res, db.friend_requests[idx])
})

server.post('/api/friends/requests/:requestId/reject', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const idx = (db.friend_requests as AnyRecord[]).findIndex(fr => fr.id === req.params.requestId)
  if (idx < 0) return notFound(res, 'Friend request not found')
  db.friend_requests[idx].status = 'REJECTED'
  saveDb(db)
  reply(res, db.friend_requests[idx])
})

server.post('/api/friends/requests/:requestId/cancel', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const idx = (db.friend_requests as AnyRecord[]).findIndex(fr => fr.id === req.params.requestId)
  if (idx < 0) return notFound(res, 'Friend request not found')
  db.friend_requests[idx].status = 'CANCELLED'
  saveDb(db)
  reply(res, db.friend_requests[idx])
})

server.get('/api/friends/check/:userId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const targetId = req.params.userId
  const isFriend = (db.friends as AnyRecord[]).some(
    f => (f.user_id === me.id && f.friend_id === targetId) || (f.user_id === targetId && f.friend_id === me.id),
  )
  const pendingReq = (db.friend_requests as AnyRecord[]).find(
    fr =>
      fr.status === 'PENDING' &&
      ((fr.requester.id === me.id && fr.addressee.id === targetId) ||
        (fr.requester.id === targetId && fr.addressee.id === me.id)),
  )
  reply(res, {
    is_friend: isFriend,
    is_requested: !!pendingReq && pendingReq.requester.id === me.id,
    is_received: !!pendingReq && pendingReq.addressee.id === me.id,
  })
})

server.delete('/api/friends/:friendId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.friends as AnyRecord[]).findIndex(
    f =>
      f.id === req.params.friendId ||
      ((f.user_id === me.id || f.friend_id === me.id) &&
        (f.user_id === req.params.friendId || f.friend_id === req.params.friendId)),
  )
  if (idx >= 0) {
    db.friends.splice(idx, 1)
    saveDb(db)
  }
  res.status(204).send()
})

// ─── FOLLOWS ──────────────────────────────────────────────────────────────────

server.post('/api/users/:userId/follow', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const existing = (db.follows as AnyRecord[]).find(
    f => f.follower_id === me.id && f.followed_id === req.params.userId,
  )
  if (!existing) {
    db.follows.push({ id: genId(), follower_id: me.id, followed_id: req.params.userId, created_at: new Date().toISOString() })
    const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === req.params.userId)
    if (userIdx >= 0) db.users[userIdx].followers = (db.users[userIdx].followers ?? 0) + 1
    const meIdx = (db.users as AnyRecord[]).findIndex(u => u.id === me.id)
    if (meIdx >= 0) db.users[meIdx].following = (db.users[meIdx].following ?? 0) + 1
    saveDb(db)
  }
  reply(res, { message: 'Followed' })
})

server.delete('/api/users/:userId/follow', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const idx = (db.follows as AnyRecord[]).findIndex(f => f.follower_id === me.id && f.followed_id === req.params.userId)
  if (idx >= 0) {
    db.follows.splice(idx, 1)
    const userIdx = (db.users as AnyRecord[]).findIndex(u => u.id === req.params.userId)
    if (userIdx >= 0) db.users[userIdx].followers = Math.max(0, (db.users[userIdx].followers ?? 1) - 1)
    const meIdx = (db.users as AnyRecord[]).findIndex(u => u.id === me.id)
    if (meIdx >= 0) db.users[meIdx].following = Math.max(0, (db.users[meIdx].following ?? 1) - 1)
    saveDb(db)
  }
  res.status(204).send()
})

server.get('/api/users/:userId/followers', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 20)
  const followerIds = (db.follows as AnyRecord[])
    .filter(f => f.followed_id === req.params.userId)
    .map(f => f.follower_id)
  const followers = (db.users as AnyRecord[]).filter(u => followerIds.includes(u.id))
  reply(res, offsetPaginate(followers, page, pageSize))
})

server.get('/api/users/:userId/following', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 20)
  const followingIds = (db.follows as AnyRecord[])
    .filter(f => f.follower_id === req.params.userId)
    .map(f => f.followed_id)
  const following = (db.users as AnyRecord[]).filter(u => followingIds.includes(u.id))
  reply(res, offsetPaginate(following, page, pageSize))
})

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

server.get('/api/notifications/unread-count', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const unread = (db.notifications as AnyRecord[]).filter(n => !n.is_read && n.actor.id !== me.id).length
  reply(res, { unread_count: unread })
})

server.post('/api/notifications/read-all', requireAuth, (_req: Request, res: Response) => {
  const db = getDb()
  for (const n of db.notifications as AnyRecord[]) n.is_read = true
  saveDb(db)
  reply(res, { message: 'All notifications marked as read' })
})

server.get('/api/notifications', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const cursor = req.query.cursor as string | undefined
  const limit = Math.min(Number(req.query.limit ?? 10), 50)
  const unreadCount = (db.notifications as AnyRecord[]).filter(n => !n.is_read).length
  const paginated = cursorPaginate(db.notifications as AnyRecord[], cursor, limit)
  reply(res, { ...paginated, unread_count: unreadCount })
})

server.post('/api/notifications/:notificationId/read', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const idx = (db.notifications as AnyRecord[]).findIndex(n => n.id === req.params.notificationId)
  if (idx >= 0) {
    db.notifications[idx].is_read = true
    saveDb(db)
  }
  reply(res, { message: 'Marked as read' })
})

server.delete('/api/notifications/:notificationId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const idx = (db.notifications as AnyRecord[]).findIndex(n => n.id === req.params.notificationId)
  if (idx >= 0) {
    db.notifications.splice(idx, 1)
    saveDb(db)
  }
  res.status(204).send()
})

// ─── SEARCH ───────────────────────────────────────────────────────────────────

server.get('/api/search/users', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const q = ((req.query.q as string) ?? '').toLowerCase().trim()
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.page_size ?? 10)
  const matched = (db.users as AnyRecord[]).filter(
    u =>
      u.username.toLowerCase().includes(q) ||
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q),
  )
  const { items, pagination } = offsetPaginate(matched, page, pageSize)
  reply(res, { users: items, total: pagination.total })
})

// ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

server.get('/api/recommendations/suggestions', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const me = (req as AnyRecord)._user as AnyRecord
  const limit = Number(req.query.limit ?? 10)
  const friendIds = new Set((db.friends as AnyRecord[]).filter(f => f.user_id === me.id || f.friend_id === me.id).flatMap(f => [f.user_id, f.friend_id]))
  friendIds.add(me.id)
  const suggestions = (db.users as AnyRecord[])
    .filter(u => !friendIds.has(u.id))
    .slice(0, limit)
    .map(u => ({
      id: u.id,
      name: u.display_name,
      username: u.username,
      avatar_path: u.avatar,
      background_path: u.background,
      role: u.role,
      tags: [u.role],
      friend_status: 'NONE',
      friend_request_id: null,
      school: u.personal_info?.school,
    }))
  reply(res, { suggestions, total: suggestions.length })
})

// ─── MEDIA ────────────────────────────────────────────────────────────────────

server.post('/api/media/uploads', requireAuth, (req: Request, res: Response) => {
  const { filename, content_type } = req.body as AnyRecord
  const assetId = genId()
  const uploadId = genId()
  const fakeAsset: AnyRecord = {
    id: assetId,
    type: content_type?.startsWith('image/') ? 'image' : content_type?.startsWith('video/') ? 'video' : 'file',
    access: 'public',
    status: 'pending',
    cdn_url: `https://picsum.photos/seed/${assetId}/800/600`,
    original_url: `https://picsum.photos/seed/${assetId}/800/600`,
    thumbnail_url: `https://picsum.photos/seed/${assetId}/200/200`,
    width: 800,
    height: 600,
    content_type: content_type ?? 'image/jpeg',
    size_bytes: 500000,
    created_at: new Date().toISOString(),
  }
  const db = getDb()
  db.media_assets.push(fakeAsset)
  saveDb(db)
  reply(
    res,
    {
      upload_id: uploadId,
      asset_id: assetId,
      method: 'PUT',
      // In mock mode, client skips actual upload to this URL
      upload_url: `http://localhost:${PORT}/api/mock-upload/${uploadId}`,
      headers: [],
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    },
    201,
  )
})

// Accept the fake upload without doing anything
server.put('/api/mock-upload/:uploadId', (_req: Request, res: Response) => {
  res.status(200).send('OK')
})

server.post('/api/media/uploads/:uploadId/complete', requireAuth, (req: Request, res: Response) => {
  // Mark asset as ready – uploadId is not tracked here; just return success
  reply(res, { status: 'ready', created_at: new Date().toISOString() })
})

server.post('/api/media/uploads/public', requireAuth, (req: Request, res: Response) => {
  // Same as private uploads for mocking purposes
  const { filename, content_type } = req.body as AnyRecord
  const assetId = genId()
  const uploadId = genId()
  reply(
    res,
    {
      upload_id: uploadId,
      asset_id: assetId,
      method: 'PUT',
      upload_url: `http://localhost:${PORT}/api/mock-upload/${uploadId}`,
      headers: [],
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
    },
    201,
  )
})

server.post('/api/media/uploads/public/:uploadId/complete', requireAuth, (_req: Request, res: Response) => {
  reply(res, { status: 'ready', created_at: new Date().toISOString() })
})

server.get('/api/media/assets/:assetId', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const asset = (db.media_assets as AnyRecord[]).find(a => a.id === req.params.assetId)
  if (!asset) return notFound(res, 'Asset not found')
  reply(res, asset)
})

server.get('/api/media/assets/:assetId/download-url', requireAuth, (req: Request, res: Response) => {
  const db = getDb()
  const asset = (db.media_assets as AnyRecord[]).find(a => a.id === req.params.assetId)
  reply(res, {
    url: asset?.cdn_url ?? `https://picsum.photos/seed/${req.params.assetId}/800/600`,
    expires_at: new Date(Date.now() + 3600_000).toISOString(),
  })
})

// ─── json-server envelope + fallback CRUD ────────────────────────────────────

// Wrap json-server auto-CRUD responses in the envelope
router.render = (req: Request, res: Response) => {
  res.jsonp(wrap(res.locals.data))
}

server.use('/api', jsonServer.defaults({ noCors: true, logger: false }))
server.use('/api', router)

// ─── 404 fallback ─────────────────────────────────────────────────────────────

server.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// ─── start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(``)
  console.log(`🚀 Mock API server running at http://localhost:${PORT}/api`)
  console.log(``)
  console.log(`🔑 Login:  email=hieu@example.com  password=password123`)
  console.log(`📦 DB:     ${DB_PATH}`)
  console.log(``)
  console.log(`Set VITE_API_BASE_URL=http://localhost:${PORT}/api in .env.local`)
  console.log(`Or run:  pnpm mock:dev  (uses .env.mock automatically)`)
})
