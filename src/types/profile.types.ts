export interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    username: string;
    display_name: string;
    birth_date: string | null;
    bio: string;
    avatar_path: string;
  };
  request_id: string;
}

export interface ProfileSearchParams {
  username: string;
  tenantSlug: string;
}
