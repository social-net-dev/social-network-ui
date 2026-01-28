import api from "@/lib/axios";
import type { Comment } from "@/types";

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

  getPosts: async (page: number = 1, limit: number = 10): Promise<any[]> => {
    const res = await api.get("/feed", { params: { page, limit } });
    return Array.isArray(res.data) ? res.data : res.data?.items || [];
  },

  createPost: async (data: {
    content: string;
    images: string[];
  }): Promise<any> => {
    const res = await api.post("/posts", {
      content: data.content,
      images: data.images || [],
    });
    return res.data;
  },

  likePost: async (postId: string, liked: boolean): Promise<void> => {
    await api.post(`/posts/${postId}/like`, { liked });
  },

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
    const res = await api.post(`/posts/${postId}/comments/`, form, {
      headers: { "Content-Type": undefined as unknown as string },
    });
    const comment = res.data;
    return {
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    };
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const res = await api.get(`/posts/${postId}/comments/`);
    return res.data.map((comment: any) => ({
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    }));
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  },

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
    const res = await api.post(
      `/posts/${postId}/comments/${commentId}/replies/`,
      form,
      {
        headers: { "Content-Type": undefined as unknown as string },
      },
    );
    const comment = res.data;
    return {
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    };
  },

  getCommentReplies: async (
    postId: string,
    commentId: string,
  ): Promise<Comment[]> => {
    const res = await api.get(
      `/posts/${postId}/comments/${commentId}/replies/`,
    );
    return res.data.map((comment: any) => ({
      ...comment,
      content: comment.content_text,
      postId: comment.post_id,
      authorId: comment.author_id,
      createdAt: comment.created_at,
      likes: comment.reaction_count,
      likedByCurrentUser: !!comment.user_reaction,
    }));
  },
};
