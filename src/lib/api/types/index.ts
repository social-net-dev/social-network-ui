/**
 * API Types — auto-generated from contract/main.tsp via openapi-typescript.
 *
 * Workflow:
 *   1. pnpm gen:spec   → tsp-output/schema/openapi.json
 *   2. pnpm gen:types  → src/lib/api/types/schema.d.ts  (this file)
 *
 * Do NOT edit schema.d.ts manually.
 * Only add frontend-only types below the "Frontend-only types" section.
 */

import type { components } from './schema.d';

type S = components['schemas'];

// ─── Generated schema types (re-exported with ergonomic names) ────────────────

export type ApiError                      = S['ApiError'];
export type ApiErrorResponse              = S['ApiErrorResponse'];
export type ApiSuggestion                 = S['ApiSuggestion'];
export type Author                        = S['Author'];
export type ChangePasswordRequest         = S['ChangePasswordRequest'];
export type Comment                       = S['Comment'];
export type CommentReaction               = S['CommentReaction'];
export type CommentResponse               = S['CommentResponse'];
export type CommentStats                  = S['CommentStats'];
export type CreateCommentRequest          = S['CreateCommentRequest'];
export type CreateFriendRequestRequest    = S['CreateFriendRequestRequest'];
export type CreatePostRequest             = S['CreatePostRequest'];
export type CursorPaginationMeta          = S['CursorPaginationMeta'];
export type DeactivateRequest             = S['DeactivateRequest'];
export type ErrorCode                     = S['ErrorCode'];
export type FeedResponse                  = S['FeedResponse'];
export type ForgotPasswordRequest         = S['ForgotPasswordRequest'];
export type Friend                        = S['Friend'];
export type FriendRequest                 = S['FriendRequest'];
export type FriendshipStatus              = S['FriendshipStatus'];
export type Gender                        = S['Gender'];
export type LoginRequest                  = S['LoginRequest'];
export type LoginResponse                 = S['LoginResponse'];
export type MediaAsset                    = S['MediaAsset'];
export type MediaAssetSummary             = S['MediaAssetSummary'];
export type Notification                  = S['Notification'];
export type NotificationListResponse      = S['NotificationListResponse'];
export type NotificationType              = S['NotificationType'];
export type PaginationMeta                = S['PaginationMeta'];
export type PersonalInfo                  = S['PersonalInfo'];
export type Post                          = S['Post'];
export type PostReaction                  = S['PostReaction'];
export type PostStats                     = S['PostStats'];
export type PostSummary                   = S['PostSummary'];
export type PostType                      = S['PostType'];
export type PresignedUploadCompleteRequest = S['PresignedUploadCompleteRequest'];
export type PresignedUploadInitRequest    = S['PresignedUploadInitRequest'];
export type PresignedUploadInitResponse   = S['PresignedUploadInitResponse'];
export type PrivacyField                  = S['PrivacyField'];
export type PrivacyOverride               = S['PrivacyOverride'];
export type Project                       = S['Project'];
export type ReactRequest                  = S['ReactRequest'];
export type ReactionType                  = S['ReactionType'];
export type ReactivationRequest           = S['ReactivationRequest'];
export type RecommendationResponse        = S['RecommendationResponse'];
export type RefreshTokenRequest           = S['RefreshTokenRequest'];
export type RefreshTokenResponse          = S['RefreshTokenResponse'];
export type RegisterRequest               = S['RegisterRequest'];
export type RegisterResponse              = S['RegisterResponse'];
export type ReplyRequest                  = S['ReplyRequest'];
export type ResendOtpRequest              = S['ResendOtpRequest'];
export type ResetPasswordRequest          = S['ResetPasswordRequest'];
export type Role                          = S['Role'];
export type SearchUsersResponse           = S['SearchUsersResponse'];
export type SetAvatarRequest              = S['SetAvatarRequest'];
export type SetBackgroundRequest          = S['SetBackgroundRequest'];
export type SharePostRequest              = S['SharePostRequest'];
export type ShareResponse                 = S['ShareResponse'];
export type UnreadCountResponse           = S['UnreadCountResponse'];
export type UpdateCommentRequest          = S['UpdateCommentRequest'];
export type UpdatePostRequest             = S['UpdatePostRequest'];
export type UpdatePrivacyRequest          = S['UpdatePrivacyRequest'];
export type UpdateProfileRequest          = S['UpdateProfileRequest'];
export type UploadAvatarResponse          = S['UploadAvatarResponse'];
export type UploadBackgroundResponse      = S['UploadBackgroundResponse'];
export type User                          = S['User'];
export type UserBase                      = S['UserBase'];
export type UserMe                        = S['UserMe'];
export type UserPrivacy                   = S['UserPrivacy'];
export type UserPublic                    = S['UserPublic'];
export type ValidationErrorItem           = S['ValidationErrorItem'];
export type VerifyOtpRequest              = S['VerifyOtpRequest'];
export type VerifyOtpResponse             = S['VerifyOtpResponse'];
export type Visibility                    = S['Visibility'];

// ─── Frontend-only types (not representable in OpenAPI as generics) ───────────

/** Generic envelope — matches server's `{ success, data, request_id }` shape */
export interface ApiResponse<T> {
  success: true;
  data: T;
  request_id?: string;
}

/** Page-based pagination wrapper (e.g. friend list) */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Cursor-based pagination wrapper (e.g. comments, followers) */
export interface CursorPaginatedResponse<T> {
  items: T[];
  pagination: CursorPaginationMeta;
}

/** Viewer context inline type from UserPublic */
export type UserPublicViewerContext = NonNullable<S['UserPublic']['viewer_context']>;

/** Response for forgot-password OTP send (not in OpenAPI schema) */
export interface ForgotPasswordResponse {
  message: string;
  user_id?: string;
}
