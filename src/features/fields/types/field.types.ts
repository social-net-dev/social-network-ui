export interface Field {
  id: string;
  name: string;
  hashtag: string;
  description: string;
  bannerUrl?: string;
  avatarUrl?: string;
  stats: {
    postsCount: number;
    followersCount: number;
  };
  isFollowing: boolean;
}

export interface FieldResponse {
  field: Field;
}

export interface FieldPostsResponse {
  posts: any[];
  nextCursor?: string;
  total?: number;
  total_pages?: number;
}
