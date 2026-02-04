import api from "@/lib/axios";
import type {
  Post as FeedPost,
  Comment,
  Author,
  IBackendPost,
  IBackendComment,
  IBackendAuthor,
  IBackendMediaFile,
} from "../types/feed.types";
import type { IBackendRes, PaginatedResponse } from "@/types/api.types";

// ===========================
// 🔄 TRANSFORM FUNCTIONS (BE -> FE)
// ===========================

/**
 * Chuyển đổi Backend Author -> Frontend Author
 */
const transformAuthor = (author: IBackendAuthor): Author => ({
  id: author.id,
  displayName: author.display_name,
  avatar: author.avatar_url || author.avatar_path || null,
  username: author.username,
});

/**
 * Chuyển đổi Backend Post -> Frontend Post
 */
const transformPost = (post: IBackendPost): any => {
  // Extract media URLs - Priority: media_files > media_urls > media_paths
  let mediaUrls: string[] = [];

  if (Array.isArray(post.media_files) && post.media_files.length > 0) {
    mediaUrls = post.media_files
      .map((m: IBackendMediaFile) => m.file_url || m.file_path)
      .filter(Boolean);
  }

  if (mediaUrls.length === 0 && Array.isArray(post.media_urls)) {
    mediaUrls = post.media_urls.filter(Boolean);
  }

  if (mediaUrls.length === 0 && Array.isArray(post.media_paths)) {
    mediaUrls = post.media_paths.filter(Boolean);
  }

  return {
    id: post.id,
    author: transformAuthor(post.author),
    content: post.content_text,
    mediaUrls,
    stats: {
      reactions: post.reaction_count,
      comments: post.comment_count,
      shares: post.share_count,
    },
    userReaction: post.user_reaction as any,
    sharedPost: post.shared_post ? transformPost(post.shared_post) : null,
    visibility: post.visibility,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
};

// ===========================
// 🔧 LEGACY SUPPORT
// ===========================

// Append auth token to media URLs for browser requests (img/src) which don't use axios headers
const appendTokenToUrl = (url: string) => {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return url;
    const clean = token.replace(/"/g, "");
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}access_token=${encodeURIComponent(clean)}`;
  } catch (e) {
    return url;
  }
};

// Wrap normalizePost to also attach token to media urls
const normalizePostWithToken = (p: any): FeedPost => {
  const base = normalizePost(p) as any;
  if (Array.isArray(base.media_urls)) {
    base.media_urls = base.media_urls.map((u: string) => appendTokenToUrl(u));
  }
  if (Array.isArray(base.images)) {
    base.images = base.images.map((u: string) => appendTokenToUrl(u));
  }
  return base;
};

const normalizeAuthor = (a: any) => ({
  id: a?.id || a?.user_id || "",
  displayName: a?.display_name || "",
  firstName:
    a?.first_name || a?.firstName || a?.display_name?.split?.(" ")[0] || "",
  lastName:
    a?.last_name || a?.lastName || a?.display_name?.split?.(" ")[1] || "",
  email: a?.email || "",
  avatar: a?.avatar || a?.avatar_path || a?.avatar_url || null,
});

const normalizePost = (p: any): any => {
  // Extract media URLs - support both old format (direct arrays) and new format (media_files objects)
  let mediaUrls: string[] = [];

  // Priority: media_files (new backend format with file_url) > media_urls > images > media_paths
  if (Array.isArray(p.media_files) && p.media_files.length > 0) {
    // New format: [{file_url: "...", ...}, ...]
    mediaUrls = p.media_files
      .map((m: any) => m.file_url || m.url)
      .filter(Boolean);
  }

  // Fallback to old formats (direct URL arrays)
  if (mediaUrls.length === 0 && Array.isArray(p.media_urls)) {
    mediaUrls = p.media_urls;
  }
  if (mediaUrls.length === 0 && Array.isArray(p.images)) {
    mediaUrls = p.images;
  }
  if (mediaUrls.length === 0 && Array.isArray(p.media_paths)) {
    mediaUrls = p.media_paths;
  }

  return {
    id: p.id,
    author_id: p.author_id || p.user_id || p.author?.id || "",
    author: normalizeAuthor(p.author || p.user || {}),
    content_text: p.content || p.content_text || p.text || "",
    // aliases for frontend components
    content: p.content || p.content_text || p.text || "",
    media_path: p.media_path || "",
    media_paths: mediaUrls,
    media_urls: mediaUrls,
    images: mediaUrls,
    visibility: p.visibility || "public",
    shared_post_id: p.shared_post_id || null,
    shared_post: p.shared_post ? normalizePost(p.shared_post) : null,
    created_at:
      p.created_at || p.createdAt || p.created || new Date().toISOString(),
    updated_at:
      p.updated_at || p.updatedAt || p.updated || new Date().toISOString(),
    reaction_count: p.reaction_count ?? p.likes ?? 0,
    comment_count: p.comment_count ?? p.comments ?? 0,
    share_count: p.share_count ?? p.shares ?? 0,
    likes: p.likes ?? p.reaction_count ?? 0,
    comments: p.comments ?? p.comment_count ?? 0,
    shares: p.shares ?? p.share_count ?? 0,
    likedByCurrentUser:
      p.likedByCurrentUser ?? (p.user_reaction ? true : false),
    user_reaction: p.user_reaction ?? (p.likedByCurrentUser ? "like" : null),
    // timestamps aliases
    createdAt:
      p.createdAt || p.created_at || p.created || new Date().toISOString(),
    updatedAt:
      p.updatedAt || p.updated_at || p.updated || new Date().toISOString(),
  };
};

// ===========================
// 🌐 API CALLS (Typed với IBackendRes)
// ===========================

export const feedApi = {
  // Fetch media with auth headers and convert to blob URL
  fetchMediaAsBlob: async (mediaUrl: string): Promise<string> => {
    try {
      const res = await api.get(mediaUrl, { responseType: "blob" });
      return URL.createObjectURL(res.data);
    } catch (error) {
      console.error("Failed to fetch media:", error);
      return "";
    }
  },

  /**
   * Lấy danh sách bài viết (feed)
   * GET /feed/?page=1&limit=10&all_tenants=1
   */
  getPosts: async (
    page = 1,
    limit = 10,
    options?: { all_tenants?: boolean },
  ): Promise<{ posts: FeedPost[]; total_pages: number; total: number }> => {
    const res = await api.get<PaginatedResponse<IBackendPost>>("/feed/", {
      params: {
        page,
        limit,
        page_size: limit,
        ...(options?.all_tenants ? { all_tenants: "1" } : {}),
      },
    });
    const data = res.data as {
      posts?: IBackendPost[];
      items?: IBackendPost[];
      total_pages?: number;
      total?: number;
    };

    const raw = data?.posts || data?.items || (Array.isArray(data) ? data : []);
    const posts = (Array.isArray(raw) ? raw : []).map(normalizePostWithToken);
    const total_pages = data?.total_pages ?? 1;
    const total = data?.total ?? posts.length;

    console.debug(
      "[feedApi.getPosts] page=",
      page,
      "items=",
      posts.length,
      "total_pages=",
      total_pages,
    );

    return { posts, total_pages, total };
  },

  /**
   * Tạo bài viết mới
   * POST /posts/
   */
  createPost: async (form: FormData | any): Promise<FeedPost> => {
    let body: FormData;
    if (form instanceof FormData) {
      body = form;
    } else {
      body = new FormData();
      if (form.content_text) body.append("content_text", form.content_text);
      if (form.visibility) body.append("visibility", form.visibility);
      if (Array.isArray(form.files)) {
        form.files.forEach((f: File) => body.append("files", f));
      }
    }

    const res = await api.post<IBackendRes<IBackendPost>>("/posts/", body, {
      headers: { "Content-Type": undefined as unknown as string },
    });

    return normalizePostWithToken(res.data.data || res.data);
  },

  /**
   * React vào bài viết (Like, Love, Haha, ...)
   * POST /posts/{postId}/react/ hoặc DELETE /posts/{postId}/react/
   */
  reactToPost: async (
    postId: string,
    reaction: string | null,
  ): Promise<void> => {
    if (reaction === null) {
      await api.delete(`/posts/${postId}/react/`);
    } else {
      await api.post(`/posts/${postId}/react/`, { reaction });
    }
  },

  /**
   * Lấy danh sách reactions của bài viết
   * GET /posts/{postId}/reactions/
   */
  getPostReactions: async (postId: string): Promise<any[]> => {
    const res = await api.get<IBackendRes<any[]>>(
      `/posts/${postId}/reactions/`,
    );
    const result = res.data.data || res.data;
    return Array.isArray(result) ? result : [];
  },

  /**
   * Xóa bài viết
   * DELETE /posts/{postId}
   */
  deletePost: async (postId: string): Promise<void> => {
    await api.delete<IBackendRes<[]>>(`/posts/${postId}`);
  },

  /**
   * Cập nhật nội dung bài viết
   * PUT /posts/{postId}
   */
  updatePost: async (postId: string, content: string): Promise<FeedPost> => {
    try {
      console.log(
        "[feedApi.updatePost] Updating post:",
        postId,
        "with content:",
        content,
      );

      const res = await api.put<IBackendRes<IBackendPost>>(`/posts/${postId}`, {
        content_text: content,
      });

      console.log("[feedApi.updatePost] Response:", res.data);

      return normalizePostWithToken(res.data.data || res.data);
    } catch (error) {
      console.error("[feedApi.updatePost] Error:", error);
      throw error;
    }
  },

  /**
   * Cập nhật media của bài viết
   * PUT /posts/{postId}/media
   */
  updatePostMedia: async (postId: string, files: File[]): Promise<void> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    await api.put(`/posts/${postId}/media`, form, {
      headers: { "Content-Type": undefined as unknown as string },
    });
  },

  /**
   * Chia sẻ bài viết
   * POST /posts/{postId}/share
   */
  sharePost: async (postId: string, content?: string): Promise<FeedPost> => {
    const res = await api.post<IBackendRes<IBackendPost>>(
      `/posts/${postId}/share`,
      {
        content_text: content || "",
      },
    );

    return normalizePostWithToken(res.data.data || res.data);
  },

  /**
   * Xóa bài chia sẻ
   * DELETE /posts/{postId}/shares/{shareId}
   */
  deleteShare: async (postId: string, shareId: string): Promise<void> => {
    await api.delete<IBackendRes<[]>>(`/posts/${postId}/shares/${shareId}`);
  },

  /**
   * Thêm comment vào bài viết
   * POST /posts/{postId}/comments/
   */
  addComment: async (
    postId: string,
    content: string,
    files?: File[],
  ): Promise<Comment> => {
    const form = new FormData();
    form.append("content_text", content);
    if (files && files.length > 0) {
      files.forEach((f) => form.append("files", f));
    }

    const res = await api.post<IBackendRes<IBackendComment>>(
      `/posts/${postId}/comments/`,
      form,
      {
        headers: { "Content-Type": undefined as unknown as string },
      },
    );

    const comment: IBackendComment =
      (res.data as any).data || (res.data as IBackendComment);

    // Normalize for legacy components
    return {
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    } as unknown as Comment;
  },

  /**
   * Lấy danh sách comment của bài viết
   * GET /posts/{postId}/comments/
   */
  getComments: async (postId: string): Promise<Comment[]> => {
    const res = await api.get<IBackendRes<IBackendComment[]>>(
      `/posts/${postId}/comments/`,
    );

    const result = (res.data as any).data || res.data;
    const comments: IBackendComment[] = Array.isArray(result) ? result : [];

    return comments.map((comment: IBackendComment) => ({
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    })) as unknown as Comment[];
  },

  /**
   * Cập nhật comment
   * PUT /posts/{postId}/comments/{commentId}
   */
  updateComment: async (
    postId: string,
    commentId: string,
    content: string,
  ): Promise<Comment> => {
    const res = await api.put<IBackendRes<IBackendComment>>(
      `/posts/${postId}/comments/${commentId}`,
      {
        content_text: content,
      },
    );

    const comment: IBackendComment =
      (res.data as any).data || (res.data as IBackendComment);

    return {
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    } as unknown as Comment;
  },

  /**
   * Cập nhật media của comment
   * PUT /posts/{postId}/comments/{commentId}/media
   */
  updateCommentMedia: async (
    postId: string,
    commentId: string,
    files: File[],
  ): Promise<void> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    await api.put(`/posts/${postId}/comments/${commentId}/media`, form, {
      headers: { "Content-Type": undefined as unknown as string },
    });
  },

  /**
   * Xóa comment
   * DELETE /posts/{postId}/comments/{commentId}/
   */
  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await api.delete<IBackendRes<[]>>(
      `/posts/${postId}/comments/${commentId}/`,
    );
  },

  /**
   * Lấy danh sách reactions của comment
   * GET /posts/{postId}/comments/{commentId}/reactions/
   */
  getCommentReactions: async (
    postId: string,
    commentId: string,
  ): Promise<any[]> => {
    const res = await api.get<IBackendRes<any[]>>(
      `/posts/${postId}/comments/${commentId}/reactions/`,
    );

    const result = (res.data as any).data || res.data;
    return Array.isArray(result) ? result : [];
  },

  /**
   * React vào comment
   * POST /posts/{postId}/comments/{commentId}/react/ hoặc DELETE
   */
  reactToComment: async (
    postId: string,
    commentId: string,
    reaction: string | null,
  ): Promise<void> => {
    if (reaction === null) {
      await api.delete(`/posts/${postId}/comments/${commentId}/react/`);
    } else {
      await api.post(`/posts/${postId}/comments/${commentId}/react/`, {
        reaction,
      });
    }
  },

  /**
   * Trả lời comment (tạo reply)
   * POST /posts/{postId}/comments/{commentId}/replies/
   */
  replyToComment: async (
    postId: string,
    commentId: string,
    content: string,
    files?: File[],
  ): Promise<Comment> => {
    const form = new FormData();
    form.append("content_text", content);
    if (files && files.length > 0) {
      files.forEach((f) => form.append("files", f));
    }

    const res = await api.post<IBackendRes<IBackendComment>>(
      `/posts/${postId}/comments/${commentId}/replies/`,
      form,
      {
        headers: { "Content-Type": undefined as unknown as string },
      },
    );

    const comment: IBackendComment =
      (res.data as any).data || (res.data as IBackendComment);

    return {
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    } as unknown as Comment;
  },

  /**
   * Lấy danh sách replies của comment
   * GET /posts/{postId}/comments/{commentId}/replies/
   */
  getCommentReplies: async (
    postId: string,
    commentId: string,
  ): Promise<Comment[]> => {
    const res = await api.get<IBackendRes<IBackendComment[]>>(
      `/posts/${postId}/comments/${commentId}/replies/`,
    );

    const result = (res.data as any).data || res.data;
    const replies: IBackendComment[] = Array.isArray(result) ? result : [];

    return replies.map((comment: IBackendComment) => ({
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    })) as unknown as Comment[];
  },
};
