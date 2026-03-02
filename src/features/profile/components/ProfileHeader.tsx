import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Edit2, MoreHorizontal, Camera, Loader2, UserPlus, UserCheck, MapPin, FileText, Users, Settings, MessageCircle } from "lucide-react"
import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useProfile } from "../hooks/useProfile"
import { useQueryClient } from "@tanstack/react-query"
import { useFriendsSendRequest } from "@/lib/api/generated/friends/friends"
import { toast } from "sonner"
import { getDefaultAvatar } from "@/lib/utils/api"
import type { UserPublic, UserMe, UserPublicViewerContext } from "@/lib/api/generated/model"

type ProfileUser = UserPublic | UserMe

interface ProfileHeaderProps {
  profile: ProfileUser
  isCurrentUser?: boolean
  onEdit?: () => void
}

interface ApiError {
  response?: {
    data?: {
      error?: string
      detail?: string
    }
  }
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Hoạt động", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  VERIFIED: { label: "Đã xác minh", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  UNVERIFIED: { label: "Chưa xác minh", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  LOCKED: { label: "Bị khóa", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  DISABLED: { label: "Vô hiệu hóa", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  DEACTIVATED: { label: "Đã hủy kích hoạt", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  TERMINATED: { label: "Đã xóa", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

const ROLE_MAP: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "Quản trị viên", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  TEACHER: { label: "Giảng viên", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  STUDENT: { label: "Sinh viên", className: "bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary" },
  INSTRUCTOR: { label: "Giảng viên", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function ProfileHeader({ profile, isCurrentUser = false, onEdit }: ProfileHeaderProps) {
  const { uploadAvatar, uploadBackground, isUpdating } = useProfile()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const sendRequestMutation = useFriendsSendRequest()
  const isFriendActionPending = sendRequestMutation.isPending

  // Type guard to check if profile has viewer_context (UserPublic)
  const hasViewerContext = (profile: ProfileUser): profile is UserPublic & { viewer_context: UserPublicViewerContext } => {
    return 'viewer_context' in profile && profile.viewer_context !== undefined
  }

  const handleSendFriendRequest = async () => {
    try {
      await sendRequestMutation.mutateAsync({ data: { addressee_username: profile.username || '' } })
      toast.success("Đã gửi lời mời kết bạn")
      queryClient.invalidateQueries({ queryKey: ['profiles', profile.username] })
      queryClient.invalidateQueries({ queryKey: ["friends"] })
    } catch (err: unknown) {
      const apiError = err as ApiError
      const msg = apiError?.response?.data?.error || apiError?.response?.data?.detail || "Lỗi khi gửi lời mời"
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg))
    }
  }

  const handleAvatarClick = () => { if (isCurrentUser) fileInputRef.current?.click() }
  const handleBackgroundClick = () => { if (isCurrentUser) backgroundInputRef.current?.click() }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { await uploadAvatar(file) } catch { toast.error("Đã có lỗi khi tải lên ảnh đại diện") }
  }

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { await uploadBackground(file) } catch { toast.error("Đã có lỗi khi tải lên ảnh bìa") }
  }

  const initials = profile.display_name ? profile.display_name.slice(0, 2).toUpperCase() : "?"
  const statusConfig = profile.account_status ? STATUS_MAP[profile.account_status] : null
  const roleConfig = profile.role ? ROLE_MAP[profile.role] : null
  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : null

  const fallbackAvatarUrl = getDefaultAvatar()
  const coverUrl = profile.background

  const postsCount = profile.posts_count ?? 0
  const followersCount = profile.followers ?? 0
  const followingCount = profile.following ?? 0

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      {/* Cover */}
      <div className="relative h-40 sm:h-56 bg-etechs-secondary group/cover overflow-hidden">
        <input type="file" ref={backgroundInputRef} className="hidden" accept="image/*" onChange={handleBackgroundChange} />
        {coverUrl ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover/cover:scale-[1.02]"
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-etechs-primary/20 to-etechs-secondary/30" />
        )}
        {isCurrentUser && (
          <Button
            size="sm"
            onClick={handleBackgroundClick}
            className="absolute top-3 right-3 h-8 text-xs bg-black/40 hover:bg-black/60 text-white border-0 backdrop-blur-sm gap-1.5 opacity-0 group-hover/cover:opacity-100 transition-opacity"
          >
            <Camera className="w-3.5 h-3.5" />
            Đổi ảnh bìa
          </Button>
        )}
      </div>

      <div className="px-4 sm:px-6 pb-5">
        {/* Avatar + Name row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-12 sm:-mt-16 mb-4">
          {/* Avatar */}
          <div className="relative shrink-0 self-center sm:self-auto">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <Avatar
              className={`w-24 h-24 sm:w-32 sm:h-32 border-4 border-card shadow-lg ring-2 ring-primary/20 transition-all ${isCurrentUser ? 'cursor-pointer hover:ring-primary/50' : ''}`}
              onClick={handleAvatarClick}
            >
              <AvatarImage src={profile.avatar || fallbackAvatarUrl} alt={profile.display_name} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : initials}
              </AvatarFallback>
            </Avatar>
            {isCurrentUser && !isUpdating && (
              <div
                className="absolute bottom-1 right-1 p-1.5 bg-etechs-primary text-etechs-secondary rounded-full shadow-md cursor-pointer border-2 border-card hover:scale-110 transition-transform"
                onClick={handleAvatarClick}
              >
                <Camera className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Name + badges + actions */}
          <div className="flex-1 min-w-0 pb-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-1.5">
                  <h1 className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                    {profile.display_name}
                  </h1>
                  {profile.username && (
                    <span className="text-muted-foreground text-sm font-medium">@{profile.username}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {roleConfig && (
                    <Badge variant="secondary" className={`${roleConfig.className} border-0 h-5 px-2.5 text-[11px] font-semibold`}>
                      {roleConfig.label}
                    </Badge>
                  )}
                  {statusConfig && (
                    <Badge variant="secondary" className={`${statusConfig.className} border-0 h-5 px-2.5 text-[11px] font-semibold`}>
                      {statusConfig.label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
                {isCurrentUser ? (
                  <>
                    <Button
                      onClick={onEdit}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg font-medium text-sm gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Chỉnh sửa hồ sơ
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg border-border hover:bg-muted"
                      onClick={() => navigate('/settings')}
                      title="Cài đặt"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : hasViewerContext(profile) && profile.viewer_context.is_friend ? (
                  <>
                    <Button variant="secondary" size="sm" className="h-9 px-4 rounded-lg font-medium text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1.5" disabled>
                      <UserCheck className="w-3.5 h-3.5" />
                      Bạn bè
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 rounded-lg font-medium text-sm gap-1.5"
                      onClick={() => navigate(`/messages/${profile.id}`)}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Nhắn tin
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="h-9 px-4 rounded-lg font-medium text-sm gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isFriendActionPending || !profile.username}
                    onClick={handleSendFriendRequest}
                  >
                    {isFriendActionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Kết bạn
                  </Button>
                )}
                {!isCurrentUser && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-foreground/80 leading-relaxed text-sm max-w-2xl mb-3 line-clamp-3">
            {profile.bio}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
          {profile.personal_info?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{profile.personal_info.location}</span>
            </div>
          )}
          {profile.personal_info?.school && (
            <div className="flex items-center gap-1">
              <span>🎓</span>
              <span>{profile.personal_info.school}</span>
            </div>
          )}
          {joinDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Tham gia {joinDate}</span>
            </div>
          )}
        </div>

        <Separator className="mb-4" />

        {/* Integrated Stats */}
        <div className="flex items-center gap-1 justify-center sm:justify-start">
          <button className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors group/stat text-center sm:text-left">
            <div className="flex items-center gap-1.5 justify-center">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-base font-bold text-foreground group-hover/stat:text-primary transition-colors">
                {formatCount(postsCount)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Bài viết</span>
          </button>

          <div className="w-px h-8 bg-border mx-1" />

          <button className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors group/stat text-center sm:text-left">
            <div className="flex items-center gap-1.5 justify-center">
              <Users className="w-4 h-4 text-etechs-primary" />
              <span className="text-base font-bold text-foreground group-hover/stat:text-primary transition-colors">
                {formatCount(followersCount)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Người theo dõi</span>
          </button>

          <div className="w-px h-8 bg-border mx-1" />

          <button className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors group/stat text-center sm:text-left">
            <div className="flex items-center gap-1.5 justify-center">
              <UserCheck className="w-4 h-4 text-purple-500" />
              <span className="text-base font-bold text-foreground group-hover/stat:text-primary transition-colors">
                {formatCount(followingCount)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Đang theo dõi</span>
          </button>
        </div>
      </div>
    </div>
  )
}
