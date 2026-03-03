import "@typespec/http";
import "@typespec/openapi";
import "@typespec/versioning";

using Http;
using TypeSpec.OpenAPI;
using Versioning;


@doc("API contract cho social-network-ui (main API + message service).")
@service(#{ title: "Etechs Social Network" })
@server("https://example.com/api", "Main API base (UI config maps to /api)")
@versioned(SocialVersions)
namespace SocialNetwork {

@doc("Version list (chỉ v1).")
enum SocialVersions {
  v1: "1.0",
}

@doc("Envelope response chuẩn như middleware/UI: success + data + request_id.")
model ApiResponse<T> {
  success: true;
  data: T;
  request_id?: string;
}

@doc("Error envelope chuẩn như middleware/UI: success=false + error + request_id.")
model ApiErrorResponse {
  success: false;
  error: ApiError;
  request_id?: string;
}

@doc("Error payload chuẩn cho UI.")
model ApiError {
  code: string;
  message?: string;
  details?: unknown;
}

model OkEnvelopeResponse<T> {
  ...OkResponse;
  ...Body<ApiResponse<T>>;
}

model CreatedEnvelopeResponse<T> {
  ...CreatedResponse;
  ...Body<ApiResponse<T>>;
}

model NoContentEnvelopeResponse {
  ...NoContentResponse;
}

model BadRequestEnvelopeResponse {
  ...BadRequestResponse;
  ...Body<ApiErrorResponse>;
}

model UnauthorizedEnvelopeResponse {
  ...UnauthorizedResponse;
  ...Body<ApiErrorResponse>;
}

model NotFoundEnvelopeResponse {
  ...NotFoundResponse;
  ...Body<ApiErrorResponse>;
}

model InternalServerErrorEnvelopeResponse {
  @statusCode statusCode: 500;
  @body body: ApiErrorResponse;
}

@doc("Headers auth bắt buộc như UI.")
model AuthHeaders {
  @header("Authorization")
  authorization: string;

  @header("X-Tenant-Slug")
  tenant_slug: string;
}

@doc("Pagination query params.")
model PaginationQuery {
  @query
  @doc("Page number (1-indexed).")
  page?: int32;

  @query("page_size")
  @doc("Number of items per page.")
  page_size?: int32;
}

@doc("Pagination metadata for paginated responses.")
model PaginationMeta {
  @doc("Current page number.")
  page: int32;

  @doc("Number of items per page.")
  page_size: int32;

  @doc("Total number of items.")
  total: int32;

  @doc("Total number of pages.")
  total_pages: int32;
}

@doc("Generic paginated response wrapper.")
model PaginatedResponse<T> {
  @doc("Array of items for current page.")
  items: T[];

  @doc("Pagination metadata.")
  pagination: PaginationMeta;
}

@doc("Visibility setting.")
enum Visibility {
  PUBLIC: "PUBLIC",
  FRIENDS: "FRIENDS",
  PRIVATE: "PRIVATE",
}

@doc("Post type.")
enum PostType {
  SOCIAL: "SOCIAL",
  JOB: "JOB",
  QUESTION: "QUESTION",
}

@doc("Reaction type.")
enum ReactionType {
  LIKE: "LIKE",
  LOVE: "LOVE",
  HAHA: "HAHA",
  WOW: "WOW",
  SAD: "SAD",
  ANGRY: "ANGRY",
}

@doc("Gender.")
enum Gender {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
}

@doc("Role.")
enum Role {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
}

@doc("Notification type.")
enum NotificationType {
  FRIEND_REQUEST: "FRIEND_REQUEST",
  FRIEND_ACCEPT: "FRIEND_ACCEPT",
  POST_LIKE: "POST_LIKE",
  POST_COMMENT: "POST_COMMENT",
  COMMENT_REPLY: "COMMENT_REPLY",
  MENTION: "MENTION",
  SYSTEM: "SYSTEM",
}

@doc("Author information for posts and comments.")
model Author {
  @doc("User ID.")
  id: string;

  @doc("Display name.")
  display_name: string;

  @doc("Username.")
  username: string;

  @doc("Avatar URL or null if not set.")
  avatar: string | null;

  @doc("User role.")
  role?: string;

  @doc("Account status.")
  account_status?: string;
}

enum PrivacyField {
  display_name: "display_name",
  birth_date: "birth_date",
  bio: "bio",
  avatar: "avatar",
  background: "background",
  personal_info: "personal_info",
}

model PrivacyOverride {
  field: PrivacyField;
  visibility: Visibility;
}

model UserPrivacy {
  default_visibility: Visibility;
  overrides?: PrivacyOverride[];
}

@doc("User project information.")
model Project {
  @doc("Project ID.")
  id: string;

  @doc("Project title.")
  @minLength(1)
  @maxLength(200)
  title: string;

  @doc("Project category.")
  category: string;

  @doc("Project description.")
  @maxLength(2000)
  description: string;

  @doc("Project image URL.")
  image_url: string;

  @doc("Optional source code link.")
  @format("uri")
  source_link?: string;
}

@doc("Personal information for user profile.")
model PersonalInfo {
  @doc("Education level.")
  education_level?: string;

  @doc("School name.")
  school?: string;

  @doc("Class name.")
  class?: string;

  @doc("Academic degree.")
  degree?: string;

  @doc("Major/field of study.")
  major?: string;

  @doc("Graduation year.")
  graduation_year?: string;

  @doc("Current academic year.")
  academic_year?: string;

  @doc("Current school year.")
  school_year?: string;

  @doc("List of favorite subjects.")
  favorite_subjects?: string[];

  @doc("List of hobbies.")
  hobbies?: string[];

  @doc("Location/address.")
  location?: string;

  @doc("User projects.")
  projects?: Project[];
}

@doc("Full user model with all fields (internal use).")
model User {
  @doc("User ID.")
  id: string;

  @doc("User email address.")
  @format("email")
  email: string;

  @doc("User phone number.")
  phone?: string | null;

  @doc("Unique username.")
  username: string;

  @doc("Display name.")
  display_name: string;

  @doc("User bio/description.")
  bio?: string;

  @doc("Personal information.")
  personal_info?: PersonalInfo;

  @doc("Birth date (ISO 8601 date).")
  @format("date")
  birth_date?: string | null;

  @doc("Avatar URL.")
  avatar?: string | null;

  @doc("Background image URL.")
  background?: string | null;

  @doc("Account status.")
  account_status: string;

  @doc("User role.")
  role: string;

  @doc("Storage quota in MB.")
  @minValue(0)
  storage_quota_mb?: int32;

  @doc("Account creation timestamp.")
  created_at: string;

  @doc("Last update timestamp.")
  updated_at?: string;

  @doc("Privacy settings.")
  privacy?: UserPrivacy;

  @doc("Number of followers.")
  @minValue(0)
  followers?: int32;

  @doc("Number of following.")
  @minValue(0)
  following?: int32;

  @doc("Number of posts.")
  @minValue(0)
  posts_count?: int32;
}

@doc("Public user profile (respects privacy settings).")
model UserPublic {
  @doc("User ID.")
  id: string;

  @doc("Unique username.")
  username: string;

  @doc("Display name.")
  display_name: string;

  @doc("User bio/description.")
  bio?: string;

  @doc("Personal information.")
  personal_info?: PersonalInfo;

  @doc("Birth date (ISO 8601 date).")
  @format("date")
  birth_date?: string | null;

  @doc("Avatar URL.")
  avatar?: string | null;

  @doc("Background image URL.")
  background?: string | null;

  @doc("Account status.")
  account_status: string;

  @doc("User role.")
  role: string;

  @doc("Account creation timestamp.")
  created_at: string;

  @doc("Last update timestamp.")
  updated_at?: string;

  @doc("Number of followers.")
  @minValue(0)
  followers?: int32;

  @doc("Number of following.")
  @minValue(0)
  following?: int32;

  @doc("Number of posts.")
  @minValue(0)
  posts_count?: int32;

  @doc("Viewer context including ownership, friendship status and request ID.")
  viewer_context?: {
    is_owner: boolean;
    is_friend: boolean;
    friendship_status?: string;
    friend_request_id?: string | null;
  };

  @doc("Fields redacted due to privacy settings.")
  redacted_fields?: PrivacyField[];
}

@doc("Current user profile (includes private fields).")
model UserMe {
  @doc("User ID.")
  id: string;

  @doc("User email address.")
  @format("email")
  email: string;

  @doc("User phone number.")
  phone?: string | null;

  @doc("Unique username.")
  username: string;

  @doc("Display name.")
  display_name: string;

  @doc("User bio/description.")
  bio?: string;

  @doc("Personal information.")
  personal_info?: PersonalInfo;

  @doc("Birth date (ISO 8601 date).")
  @format("date")
  birth_date?: string | null;

  @doc("Avatar URL.")
  avatar?: string | null;

  @doc("Background image URL.")
  background?: string | null;

  @doc("Account status.")
  account_status: string;

  @doc("User role.")
  role: string;

  @doc("Storage quota in MB.")
  @minValue(0)
  storage_quota_mb?: int32;

  @doc("Account creation timestamp.")
  created_at: string;

  @doc("Last update timestamp.")
  updated_at?: string;

  @doc("Privacy settings.")
  privacy?: UserPrivacy;

  @doc("Number of followers.")
  @minValue(0)
  followers?: int32;

  @doc("Number of following.")
  @minValue(0)
  following?: int32;

  @doc("Number of posts.")
  @minValue(0)
  posts_count?: int32;
}

@doc("Login request payload.")
model LoginRequest {
  @doc("User email address.")
  @format("email")
  email: string;

  @doc("User password.")
  @minLength(8)
  password: string;
}

model LoginResponse {
  access: string;
  refresh: string;
  tenant_slug: string;
}

@doc("Registration request payload.")
model RegisterRequest {
  @doc("User email address.")
  @format("email")
  email: string;

  @doc("User password (minimum 8 characters).")
  @minLength(8)
  password: string;

  @doc("Display name for the user.")
  @minLength(1)
  @maxLength(100)
  display_name: string;

  @doc("User gender.")
  gender: Gender;

  @doc("User role in the system.")
  role: Role;

  @doc("Optional phone number.")
  @pattern("^\\+?[1-9]\\d{1,14}$")
  phone?: string;

  @doc("User consent to terms and conditions.")
  consent?: boolean;

  @doc("Media asset IDs for verification documents.")
  verification_media_asset_ids?: string[];
}

model RegisterResponse {
  id: string;
  email: string;
  username: string;
}

model VerifyOtpRequest {
  user_id: string;
  otp: string;
}

model VerifyOtpResponse {
  tenant_id: string;
  tenant_slug: string;
  status: string;
}

model ResendOtpRequest {
  user_id: string;
}

model RefreshTokenRequest {
  refresh: string;
}

model RefreshTokenResponse {
  access: string;
  refresh?: string;
}

model ForgotPasswordRequest {
  email: string;
}

model ResetPasswordRequest {
  user_id: string;
  otp: string;
  new_password: string;
}

model ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

model SingleFileMultipart {
  file: HttpPart<Http.File>;
}

model SetAvatarRequest {
  asset_id: string;
}

model SetBackgroundRequest {
  asset_id: string;
}

model UploadAvatarResponse {
  avatar_url: string;
}

model UploadBackgroundResponse {
  background_url: string;
}

@doc("Profile update request payload.")
model UpdateProfileRequest {
  @doc("Updated display name.")
  @minLength(1)
  @maxLength(100)
  display_name?: string;

  @doc("Updated username (alphanumeric and underscores only).")
  @minLength(3)
  @maxLength(30)
  @pattern("^[a-zA-Z0-9_]+$")
  username?: string;

  @doc("Updated bio/description.")
  @maxLength(500)
  bio?: string;

  @doc("Updated birth date (ISO 8601 format).")
  @format("date")
  birth_date?: string;

  @doc("Updated personal information (education, location, etc).")
  personal_info?: PersonalInfo;
}

model UpdatePrivacyRequest {
  default_visibility?: Visibility;
  overrides?: PrivacyOverride[];
}

model DeactivateRequest {
  password: string;
}

model ReactivationRequest {
  email: string;
}

@doc("Post statistics.")
model PostStats {
  @doc("Total number of reactions.")
  @minValue(0)
  reactions: int32;

  @doc("Total number of comments.")
  @minValue(0)
  comments: int32;

  @doc("Total number of shares.")
  @minValue(0)
  shares: int32;
}

@doc("Post summary for feed and lists.")
model PostSummary {
  @doc("Post ID.")
  id: string;

  @doc("Post author information.")
  author: Author;

  @doc("Post content text.")
  content: string;

  @doc("Array of media URLs (legacy).")
  media_urls: string[];

  @doc("Array of media assets with metadata.")
  media?: MediaAssetSummary[];

  @doc("Post statistics.")
  stats: PostStats;

  @doc("Current user's reaction to this post.")
  user_reaction: ReactionType | null;

  @doc("Post visibility setting.")
  visibility: Visibility;

  @doc("Type of post.")
  post_type: PostType;

  @doc("Field/category ID.")
  field_id?: string;

  @doc("Post creation timestamp.")
  created_at: string;

  @doc("Last update timestamp.")
  updated_at: string;
}

@doc("Full post model with all details including shared post.")
model Post {
  @doc("Post ID.")
  id: string;

  @doc("Post author information.")
  author: Author;

  @doc("Post content text.")
  content: string;

  @doc("Array of media URLs (legacy).")
  media_urls: string[];

  @doc("Array of media assets with metadata.")
  media?: MediaAssetSummary[];

  @doc("Post statistics.")
  stats: PostStats;

  @doc("Current user's reaction to this post.")
  user_reaction: ReactionType | null;

  @doc("Shared post if this is a share.")
  shared_post: PostSummary | null;

  @doc("Post visibility setting.")
  visibility: Visibility;

  @doc("Type of post.")
  post_type: PostType;

  @doc("Field/category ID.")
  field_id?: string;

  @doc("Post creation timestamp.")
  created_at: string;

  @doc("Last update timestamp.")
  updated_at: string;
}

@doc("Feed response with paginated posts.")
model FeedResponse extends PaginatedResponse<PostSummary> {}

model UpdatePostRequest {
  content_text?: string;
  visibility?: Visibility;
  media_uploads?: string[];
}

@doc("Create post request payload.")
model CreatePostRequest {
  @doc("Post content text.")
  @minLength(1)
  @maxLength(10000)
  content_text: string;

  @doc("Post visibility setting.")
  visibility?: Visibility;

  @doc("Type of post.")
  post_type?: PostType;

  @doc("Field/category ID for the post.")
  field_id?: string;

  @doc("Array of media asset IDs to attach.")
  media_asset_ids?: string[];
}

 

@doc("Comment statistics.")
model CommentStats {
  @doc("Total number of reactions.")
  @minValue(0)
  reactions: int32;

  @doc("Total number of replies.")
  @minValue(0)
  replies: int32;
}

@doc("Comment model.")
model Comment {
  @doc("Comment ID.")
  id: string;

  @doc("ID of the post this comment belongs to.")
  post_id: string;

  @doc("Comment author information.")
  author: Author;

  @doc("Parent comment ID for replies.")
  parent_comment_id: string | null;

  @doc("Comment content text.")
  content: string;

  @doc("Array of media URLs.")
  media_urls: string[];

  @doc("Comment statistics.")
  stats: CommentStats;

  @doc("Current user's reaction to this comment.")
  user_reaction: ReactionType | null;

  @doc("Comment creation timestamp.")
  created_at: string;

  @doc("Last update timestamp.")
  updated_at: string;
}

@doc("Comment response with paginated comments.")
model CommentResponse extends PaginatedResponse<Comment> {}

model UpdateCommentRequest {
  content_text: string;
}

 

@doc("Create comment request payload.")
model CreateCommentRequest {
  @doc("ID of the post to comment on.")
  post_id: string;

  @doc("Comment content text.")
  @minLength(1)
  @maxLength(5000)
  content_text: string;

  @doc("Array of media asset IDs to attach.")
  media_asset_ids?: string[];
}

 

model ReplyRequest {
  post_id: string;
  content_text: string;
  media_asset_ids?: string[];
}

@doc("Media asset summary information.")
model MediaAssetSummary {
  @doc("Asset ID.")
  id: string;

  @doc("Media type.")
  type: "image" | "video" | "file";

  @doc("Access level.")
  access: "public" | "private";

  @doc("CDN URL for the asset.")
  @format("uri")
  cdn_url?: string;

  @doc("Original upload URL.")
  @format("uri")
  original_url?: string;

  @doc("Thumbnail URL for images/videos.")
  @format("uri")
  thumbnail_url?: string;

  @doc("Image/video width in pixels.")
  @minValue(0)
  width?: int32;

  @doc("Image/video height in pixels.")
  @minValue(0)
  height?: int32;

  @doc("MIME content type.")
  content_type?: string;

  @doc("File size in bytes.")
  @minValue(0)
  size_bytes?: int64;
}

@doc("Full media asset model with status.")
model MediaAsset extends MediaAssetSummary {
  @doc("Processing status.")
  status: "pending" | "ready" | "failed";

  @doc("Asset creation timestamp.")
  created_at: string;
}

model NameValueHeader {
  name: string;
  value: string;
}

model PresignedUploadInitRequest {
  filename: string;
  content_type: string;
  size_bytes: int64;
  checksum_sha256?: string;
  purpose?: "post" | "comment" | "avatar" | "background" | "kyc";
  access?: "public" | "private";
}

model PresignedUploadInitResponse {
  upload_id: string;
  asset_id: string;
  method: "PUT" | "POST";
  upload_url: string;
  headers: NameValueHeader[];
  expires_at: string;
}

model PresignedUploadCompleteRequest {
  etag?: string;
  size_bytes?: int64;
}

model ReactRequest {
  reaction: ReactionType;
}

model PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}

model CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction: ReactionType;
  created_at: string;
}

model SharePostRequest {
  message?: string;
}

model ShareResponse {
  id: string;
  post_id: string;
  user_id: string;
  message?: string;
  created_at: string;
}

model Friend {
  id: string;
  user: Author;
  created_at: string;
}

model FriendRequest {
  id: string;
  requester: Author;
  addressee: Author;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  created_at: string;
}

model CreateFriendRequestRequest {
  addressee_id?: string;
  addressee_username?: string;
}

model FriendshipStatus {
  is_friend: boolean;
  is_requested?: boolean;
  is_received?: boolean;
}

model Notification {
  id: string;
  type: NotificationType;
  actor: Author;
  target_id?: string;
  target_type?: "post" | "comment" | "friend_request";
  message: string;
  is_read: boolean;
  created_at: string;
}

@doc("Unread notification count response.")
model UnreadCountResponse {
  @doc("Number of unread notifications.")
  @minValue(0)
  unread_count: int32;
}

@doc("Notification list response with pagination and unread count.")
model NotificationListResponse extends PaginatedResponse<Notification> {
  @doc("Number of unread notifications.")
  @minValue(0)
  unread_count: int32;
}

model SearchUsersResponse {
  users: UserPublic[];
  total: int32;
}

model ApiSuggestion {
  id: string;
  name: string;
  username?: string | null;
  avatar_path?: string | null;
  background_path?: string | null;
  role?: string;
  tags?: string[];
  connected_via?: string;
  target_name?: string;
  friend_status?: string;
  friend_request_id?: string | null;
  school?: string;
  class_name?: string;
  field?: string;
}

model RecommendationResponse {
  suggestions: ApiSuggestion[];
  total?: int32;
}

@doc("Nhóm API xác thực và quản lý phiên đăng nhập.")
@route("/auth")
@tag("Auth")
namespace Auth {
  @post
  @route("/login")
  @summary("Đăng nhập")
  @doc("Nhận email/mật khẩu và trả về access/refresh token + tenant_slug.")
  op login(@body body: LoginRequest): OkEnvelopeResponse<LoginResponse> | BadRequestEnvelopeResponse;

  @post
  @route("/register")
  @summary("Đăng ký tài khoản")
  @doc("Đăng ký bằng JSON. Nếu cần chứng thực người dùng, gửi verification_media_asset_ids (upload qua /media/uploads/public).")
  op register(
    @header contentType: "application/json",
    @body body: RegisterRequest
  ): OkEnvelopeResponse<RegisterResponse> | BadRequestEnvelopeResponse;

  @post
  @route("/verify-otp")
  @summary("Xác thực OTP")
  op verifyOtp(@body body: VerifyOtpRequest): OkEnvelopeResponse<VerifyOtpResponse> | BadRequestEnvelopeResponse;

  @post
  @route("/resend-otp")
  @summary("Gửi lại OTP")
  op resendOtp(@body body: ResendOtpRequest): OkEnvelopeResponse<{ message: string }> | BadRequestEnvelopeResponse;

  @post
  @route("/refresh")
  @summary("Làm mới access token")
  @doc("Đổi refresh token lấy access token mới.")
  op refresh(@body body: RefreshTokenRequest): OkEnvelopeResponse<RefreshTokenResponse> | BadRequestEnvelopeResponse;

  @post
  @route("/forgot-password")
  @summary("Quên mật khẩu")
  op forgotPassword(@body body: ForgotPasswordRequest): OkEnvelopeResponse<{ message: string; user_id?: string }> | BadRequestEnvelopeResponse;

  @post
  @route("/reset-password")
  @summary("Đặt lại mật khẩu")
  op resetPassword(@body body: ResetPasswordRequest): OkEnvelopeResponse<{ message: string }> | BadRequestEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/change-password")
  @summary("Đổi mật khẩu")
  @doc("Yêu cầu Bearer token + X-Tenant-Slug.")
  op changePassword(
    ...AuthHeaders,
    @body body: ChangePasswordRequest
  ): OkEnvelopeResponse<{ message: string }> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/logout")
  @summary("Đăng xuất")
  op logout(...AuthHeaders): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse;
}

@doc("Nhóm API quản lý hồ sơ người dùng hiện tại.")
@route("/users")
@tag("Users")
namespace Users {
  @useAuth(BearerAuth)
  @get
  @route("/me")
  @summary("Lấy profile của tôi")
  op getMe(...AuthHeaders): OkEnvelopeResponse<UserMe> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @patch(#{implicitOptionality: true})
  @route("/me/profile")
  @summary("Cập nhật profile")
  op updateProfile(...AuthHeaders, @body body: UpdateProfileRequest): OkEnvelopeResponse<UserMe> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/me/avatar")
  @summary("Cập nhật avatar từ media asset")
  op uploadAvatar(
    ...AuthHeaders,
    @body body: SetAvatarRequest
  ): OkEnvelopeResponse<UploadAvatarResponse> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/me/background")
  @summary("Cập nhật ảnh nền từ media asset")
  op uploadBackground(
    ...AuthHeaders,
    @body body: SetBackgroundRequest
  ): OkEnvelopeResponse<UploadBackgroundResponse> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @patch(#{implicitOptionality: true})
  @route("/me/privacy")
  @summary("Cập nhật quyền riêng tư")
  op updatePrivacy(...AuthHeaders, @body body: UpdatePrivacyRequest): OkEnvelopeResponse<UserPrivacy> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/me/privacy")
  @summary("Lấy cấu hình quyền riêng tư")
  op getPrivacy(...AuthHeaders): OkEnvelopeResponse<UserPrivacy> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/me/deactivate")
  @summary("Vô hiệu hoá tài khoản")
  op deactivate(
    ...AuthHeaders,
    @body body: DeactivateRequest
  ): OkEnvelopeResponse<{ message?: string }> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @post
  @route("/me/reactivate")
  @summary("Kích hoạt lại tài khoản")
  op reactivate(@body body: ReactivationRequest): OkEnvelopeResponse<{ message: string }> | BadRequestEnvelopeResponse;

  @post
  @route("/me/reactivation-requests")
  @summary("Tạo yêu cầu kích hoạt lại")
  op createReactivationRequest(@body body: ReactivationRequest): OkEnvelopeResponse<{ message: string }> | BadRequestEnvelopeResponse;
}

@doc("Nhóm API feed/bảng tin.")
@tag("Feed")
namespace Feed {
  @useAuth(BearerAuth)
  @get
  @route("/feed")
  @summary("Lấy feed")
  @doc("Hỗ trợ phân trang và filter field_id/post_type.")
  op getFeed(
    ...AuthHeaders,
    @query page?: int32,
    @query("page_size") page_size?: int32,
    @query field_id?: string,
    @query post_type?: string
  ): OkEnvelopeResponse<FeedResponse> | UnauthorizedEnvelopeResponse;
}

@doc("Nhóm API bài viết (posts).")
@route("/posts")
@tag("Posts")
namespace Posts {
  @useAuth(BearerAuth)
  @get
  @route("/")
  @summary("Danh sách bài viết")
  op listPosts(...AuthHeaders, ...PaginationQuery): OkEnvelopeResponse<FeedResponse> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/{postId}")
  @summary("Chi tiết bài viết")
  op getPost(...AuthHeaders, @path postId: string): OkEnvelopeResponse<Post> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/")
  @summary("Tạo bài viết")
  @doc("Tạo post bằng JSON và gắn media qua media_asset_ids (upload qua /media/uploads).")
  op createPost(
    ...AuthHeaders,
    @header contentType: "application/json",
    @body body: CreatePostRequest
  ): CreatedEnvelopeResponse<Post> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @patch(#{implicitOptionality: true})
  @route("/{postId}")
  @summary("Cập nhật bài viết")
  op updatePost(...AuthHeaders, @path postId: string, @body body: UpdatePostRequest): OkEnvelopeResponse<Post> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @delete
  @route("/{postId}")
  @summary("Xoá bài viết")
  op deletePost(...AuthHeaders, @path postId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/me")
  @summary("Danh sách bài viết của tôi")
  op getMyPosts(...AuthHeaders, ...PaginationQuery): OkEnvelopeResponse<FeedResponse> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/users/{userId}")
  @summary("Danh sách bài viết theo user")
  op getPostsByUser(...AuthHeaders, @path userId: string, ...PaginationQuery): OkEnvelopeResponse<FeedResponse> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/{postId}/comments")
  @summary("Danh sách comment của bài viết")
  op getPostComments(...AuthHeaders, @path postId: string, ...PaginationQuery): OkEnvelopeResponse<CommentResponse> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

@doc("Nhóm API bình luận (comments) và replies.")
@route("/comments")
@tag("Comments")
namespace Comments {
  @useAuth(BearerAuth)
  @post
  @route("/")
  @summary("Tạo comment")
  @doc("Tạo comment bằng JSON và gắn media qua media_asset_ids (upload qua /media/uploads).")
  op createComment(
    ...AuthHeaders,
    @header contentType: "application/json",
    @body body: CreateCommentRequest
  ): CreatedEnvelopeResponse<Comment> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @patch(#{implicitOptionality: true})
  @route("/{commentId}")
  @summary("Cập nhật comment")
  op updateComment(...AuthHeaders, @path commentId: string, @body body: UpdateCommentRequest): OkEnvelopeResponse<Comment> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @delete
  @route("/{commentId}")
  @summary("Xoá comment")
  op deleteComment(...AuthHeaders, @path commentId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/{commentId}/replies")
  @summary("Trả lời comment")
  @doc("Tạo reply bằng JSON và gắn media qua media_asset_ids (upload qua /media/uploads).")
  op replyToComment(
    ...AuthHeaders,
    @path commentId: string,
    @header contentType: "application/json",
    @body body: ReplyRequest
  ): CreatedEnvelopeResponse<Comment> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

@doc("Nhóm API reactions (like/love/...).")
@tag("Reactions")
namespace Reactions {
  @useAuth(BearerAuth)
  @post
  @route("/posts/{postId}/reactions")
  @summary("React bài viết")
  op reactToPost(...AuthHeaders, @path postId: string, @body body: ReactRequest): OkEnvelopeResponse<PostReaction> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @delete
  @route("/posts/{postId}/reactions")
  @summary("Gỡ reaction bài viết")
  op unreactPost(...AuthHeaders, @path postId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/comments/{commentId}/reactions")
  @summary("React comment")
  op reactToComment(...AuthHeaders, @path commentId: string, @body body: ReactRequest): OkEnvelopeResponse<CommentReaction> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @delete
  @route("/comments/{commentId}/reactions")
  @summary("Gỡ reaction comment")
  op unreactComment(...AuthHeaders, @path commentId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

@doc("Nhóm API share/unshare bài viết.")
@tag("Shares")
namespace Shares {
  @useAuth(BearerAuth)
  @post
  @route("/posts/{postId}/share")
  @summary("Share bài viết")
  op sharePost(...AuthHeaders, @path postId: string, @body body?: SharePostRequest): OkEnvelopeResponse<ShareResponse> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @delete
  @route("/posts/{postId}/share")
  @summary("Gỡ share bài viết")
  op unsharePost(...AuthHeaders, @path postId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

@doc("Nhóm API bạn bè và lời mời kết bạn.")
@route("/friends")
@tag("Friends")
namespace Friends {
  @useAuth(BearerAuth)
  @get
  @route("/")
  @summary("Danh sách bạn bè")
  op listFriends(...AuthHeaders, ...PaginationQuery): OkEnvelopeResponse<PaginatedResponse<Friend>> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/requests")
  @summary("Gửi lời mời kết bạn")
  op sendRequest(...AuthHeaders, @body body: CreateFriendRequestRequest): OkEnvelopeResponse<FriendRequest> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/requests/{requestId}/accept")
  @summary("Chấp nhận lời mời")
  op acceptRequest(...AuthHeaders, @path requestId: string): OkEnvelopeResponse<FriendRequest> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/requests/{requestId}/reject")
  @summary("Từ chối lời mời")
  op rejectRequest(...AuthHeaders, @path requestId: string): OkEnvelopeResponse<FriendRequest> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/requests/{requestId}/cancel")
  @summary("Huỷ lời mời")
  op cancelRequest(...AuthHeaders, @path requestId: string): OkEnvelopeResponse<FriendRequest> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/requests/incoming")
  @summary("Danh sách lời mời đến")
  op listIncomingRequests(...AuthHeaders, ...PaginationQuery): OkEnvelopeResponse<FriendRequest[]> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/requests/outgoing")
  @summary("Danh sách lời mời đã gửi")
  op listOutgoingRequests(...AuthHeaders, ...PaginationQuery): OkEnvelopeResponse<FriendRequest[]> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/check/{userId}")
  @summary("Kiểm tra trạng thái bạn bè")
  op checkFriendship(...AuthHeaders, @path userId: string): OkEnvelopeResponse<FriendshipStatus> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @delete
  @route("/{friendId}")
  @summary("Xoá bạn")
  op removeFriend(...AuthHeaders, @path friendId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

@doc("Nhóm API thông báo (notifications).")
@route("/notifications")
@tag("Notifications")
namespace Notifications {
  @useAuth(BearerAuth)
  @get
  @route("/")
  @summary("Danh sách thông báo")
  op listNotifications(...AuthHeaders, ...PaginationQuery): OkEnvelopeResponse<NotificationListResponse> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/{notificationId}/read")
  @summary("Đánh dấu đã đọc")
  op markAsRead(...AuthHeaders, @path notificationId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/read-all")
  @summary("Đánh dấu tất cả đã đọc")
  op markAllAsRead(...AuthHeaders): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/unread-count")
  @summary("Đếm thông báo chưa đọc")
  op unreadCount(...AuthHeaders): OkEnvelopeResponse<UnreadCountResponse> | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @delete
  @route("/{notificationId}")
  @summary("Xoá thông báo")
  op deleteNotification(...AuthHeaders, @path notificationId: string): OkEnvelopeResponse<{ message: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

@doc("Nhóm API profile theo username.")
@tag("Profiles")
namespace Profiles {
  @useAuth(BearerAuth)
  @get
  @route("/profiles/{username}")
  @summary("Lấy profile theo username")
  op getProfile(...AuthHeaders, @path username: string): OkEnvelopeResponse<UserPublic> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

@doc("Nhóm API tìm kiếm.")
@tag("Search")
namespace Search {
  @useAuth(BearerAuth)
  @get
  @route("/search/users")
  @summary("Tìm kiếm user")
  op searchUsers(
    ...AuthHeaders,
    @query q: string,
    @query limit?: int32,
    @query page?: int32
  ): OkEnvelopeResponse<SearchUsersResponse> | UnauthorizedEnvelopeResponse;
}

@doc("Nhóm API gợi ý kết nối.")
@tag("Recommendations")
namespace Recommendations {
  @useAuth(BearerAuth)
  @get
  @route("/recommendations/suggestions")
  @summary("Lấy danh sách gợi ý")
  op suggestions(...AuthHeaders, @query filter: string): OkEnvelopeResponse<RecommendationResponse> | UnauthorizedEnvelopeResponse;
}

@doc("Nhóm API media.")
@tag("Media")
@route("/media")
namespace Media {
  @post
  @route("/uploads/public")
  @summary("Khởi tạo presigned upload (public)")
  @doc("Dành cho flow chưa đăng nhập (vd: KYC khi đăng ký). Client upload trực tiếp lên object storage.")
  op initPublicUpload(@body body: PresignedUploadInitRequest): CreatedEnvelopeResponse<PresignedUploadInitResponse> | BadRequestEnvelopeResponse;

  @post
  @route("/uploads/public/{uploadId}/complete")
  @summary("Hoàn tất upload (public)")
  @doc("Xác nhận upload hoàn thành cho flow chưa đăng nhập (vd: KYC).")
  op completePublicUpload(
    @path uploadId: string,
    @body body: PresignedUploadCompleteRequest
  ): OkEnvelopeResponse<MediaAsset> | BadRequestEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/uploads")
  @summary("Khởi tạo presigned upload")
  @doc("Trả về upload_url + headers để client upload trực tiếp lên object storage. Sau đó gọi complete để xác nhận.")
  op initUpload(...AuthHeaders, @body body: PresignedUploadInitRequest): CreatedEnvelopeResponse<PresignedUploadInitResponse> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/uploads/{uploadId}/complete")
  @summary("Hoàn tất upload")
  @doc("Xác nhận upload hoàn thành và trả MediaAsset. Backend có thể xử lý thumbnail/variants async.")
  op completeUpload(
    ...AuthHeaders,
    @path uploadId: string,
    @body body: PresignedUploadCompleteRequest
  ): OkEnvelopeResponse<MediaAsset> | BadRequestEnvelopeResponse | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @get
  @route("/assets/{assetId}")
  @summary("Lấy metadata media asset")
  op getAsset(...AuthHeaders, @path assetId: string): OkEnvelopeResponse<MediaAsset> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;

  @useAuth(BearerAuth)
  @post
  @route("/assets/{assetId}/download-url")
  @summary("Lấy signed download URL")
  @doc("Trả URL tạm thời để dùng trong <img src> hoặc download qua CDN mà không cần token query.")
  op getSignedDownloadUrl(
    ...AuthHeaders,
    @path assetId: string,
    @body body: { expires_in_seconds?: int32 }
  ): OkEnvelopeResponse<{ url: string; expires_at: string }> | UnauthorizedEnvelopeResponse | NotFoundEnvelopeResponse;
}

}