/**
 * Feed API Handlers
 * Handles: feed, posts, reactions, comments
 */
import { http, HttpResponse, delay } from "msw";
import { mockPosts, createMockPost, currentMockUser } from "../fixtures";

export const feedHandlers = [
  // ============================================
  // GET /feed/
  // ============================================
  http.get("*/feed/", async ({ request }) => {
    await delay(800);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    
    // Simple pagination simulation
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = mockPosts.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      success: true,
      data: {
        posts: paginatedPosts.length > 0 ? paginatedPosts : mockPosts,
        total_pages: Math.ceil(mockPosts.length / limit) || 5,
        total: mockPosts.length || 50,
      },
    });
  }),

  // ============================================
  // POST /posts/
  // ============================================
  http.post("*/posts/", async () => {
    await delay(1000);
    const newPost = createMockPost(currentMockUser.id, {
      content_text: "Bài viết vừa được tạo thành công! 🎉",
    });
    
    return HttpResponse.json({
      success: true,
      data: newPost,
    });
  }),

  // ============================================
  // PUT /posts/:postId
  // ============================================
  http.put("*/posts/:postId", async ({ params }) => {
    await delay(500);
    const { postId } = params;
    
    return HttpResponse.json({
      success: true,
      data: {
        id: postId,
        content_text: "Bài viết đã được cập nhật",
        updated_at: new Date().toISOString(),
      },
    });
  }),

  // ============================================
  // DELETE /posts/:postId
  // ============================================
  http.delete("*/posts/:postId", async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      data: null,
    });
  }),

  // ============================================
  // POST /posts/:postId/react/
  // ============================================
  http.post("*/posts/:postId/react/", async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: "Reaction added" },
    });
  }),

  // ============================================
  // DELETE /posts/:postId/react/
  // ============================================
  http.delete("*/posts/:postId/react/", async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: { message: "Reaction removed" },
    });
  }),

  // ============================================
  // GET /posts/:postId/reactions/
  // ============================================
  http.get("*/posts/:postId/reactions/", async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: [
        { user_id: "user-001", reaction: "like" },
        { user_id: "user-002", reaction: "love" },
      ],
    });
  }),

  // ============================================
  // POST /posts/:postId/share
  // ============================================
  http.post("*/posts/:postId/share", async ({ params }) => {
    await delay(800);
    const { postId } = params;
    const sharedPost = mockPosts.find((p) => p.id === postId);
    
    const newPost = createMockPost(currentMockUser.id, {
      content_text: "Chia sẻ bài viết này!",
      shared_post: sharedPost || undefined,
    });
    
    return HttpResponse.json({
      success: true,
      data: newPost,
    });
  }),

  // ============================================
  // GET /posts/:postId/comments/
  // ============================================
  http.get("*/posts/:postId/comments/", async () => {
    await delay(500);
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: "comment-001",
          author: currentMockUser,
          content_text: "Comment đầu tiên nè! 👋",
          created_at: new Date().toISOString(),
          reaction_count: 2,
          user_reaction: null,
        },
        {
          id: "comment-002",
          author: currentMockUser,
          content_text: "Hay quá!",
          created_at: new Date().toISOString(),
          reaction_count: 0,
          user_reaction: null,
        },
      ],
    });
  }),

  // ============================================
  // POST /posts/:postId/comments/
  // ============================================
  http.post("*/posts/:postId/comments/", async () => {
    await delay(600);
    return HttpResponse.json({
      success: true,
      data: {
        id: `comment-${Date.now()}`,
        author: currentMockUser,
        content_text: "Comment vừa được thêm",
        created_at: new Date().toISOString(),
        reaction_count: 0,
        user_reaction: null,
      },
    });
  }),
];
