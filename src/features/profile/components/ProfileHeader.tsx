import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Edit2, Share2, MoreHorizontal, Camera } from "lucide-react"
import type { ProfileData } from "../types/profile.types"

interface ProfileHeaderProps {
  profile: ProfileData
  isCurrentUser?: boolean
  onEdit?: () => void
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "ĐÃ XÁC THỰC", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  UNVERIFIED: { label: "CHƯA XÁC THỰC", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  LOCKED: { label: "BỊ KHÓA", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  DISABLED: { label: "VÔ HIỆU HÓA", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  DEACTIVATED: { label: "ĐÃ HỦY KÍCH HOẠT", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
  TERMINATED: { label: "ĐÃ XÓA", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

const ROLE_MAP: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "QUẢN TRỊ VIÊN", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  TEACHER: { label: "GIẢNG VIÊN", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  STUDENT: { label: "SINH VIÊN", className: "bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary" },
  INSTRUCTOR: { label: "GIẢNG VIÊN", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
}

export function ProfileHeader({ profile, isCurrentUser = false, onEdit }: ProfileHeaderProps) {
  const getInitials = () => {
    if (profile.displayName) {
      return profile.displayName.slice(0, 2).toUpperCase()
    }
    return "?"
  }

  const initials = getInitials()
  const statusConfig = profile.accountStatus ? STATUS_MAP[profile.accountStatus] : null
  const roleConfig = profile.role ? ROLE_MAP[profile.role] : null
  const joinDate = new Date(profile.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden group">
      {/* Compact Cover Image */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-etechs-secondary/80 to-etechs-primary/80">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        
        {isCurrentUser && (
          <Button 
            size="sm" 
            variant="secondary"
            className="absolute top-4 right-4 h-8 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <Camera className="w-4 h-4 mr-2" />
            Cập nhật ảnh bìa
          </Button>
        )}
      </div>

      <div className="px-6 pb-6">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-end -mt-12 sm:-mt-16 gap-4 sm:gap-6">
          {/* Avatar Section */}
          <div className="relative shrink-0 mx-auto sm:mx-0">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-card shadow-sm ring-1 ring-border/10">
              <AvatarImage src={profile.avatar} alt={profile.displayName} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            {isCurrentUser && (
              <div className="absolute bottom-0 right-0 p-1.5 bg-etechs-primary text-etechs-secondary rounded-full shadow-sm cursor-pointer border-2 border-card hover:scale-110 transition-transform">
                <Edit2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

              {/* Info Section */}
          <div className="flex-1 min-w-0 pt-2 sm:pb-1 w-full text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground truncate">
                    {profile.displayName}
                  </h1>
                  {profile.username && (
                    <span className="text-muted-foreground text-base font-medium">@{profile.username}</span>
                  )}

                  {statusConfig && (
                    <Badge variant="secondary" className={`${statusConfig.className} border-0 h-5 px-2 text-[10px] uppercase font-bold tracking-wider`}>
                      {statusConfig.label}
                    </Badge>
                  )}
                  {roleConfig && (
                    <Badge variant="secondary" className={`${roleConfig.className} border-0 h-5 px-2 text-[10px] uppercase font-bold tracking-wider`}>
                      {roleConfig.label}
                    </Badge>
                  )}
                </div>
                {profile.email && (
                  <p className="text-muted-foreground text-sm font-medium">{profile.email}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                {isCurrentUser ? (
                  <Button onClick={onEdit} className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 h-9 px-4 rounded-lg font-medium text-sm">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                ) : (
                  <Button className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 h-9 px-6 rounded-lg font-medium text-sm">
                    Theo dõi
                  </Button>
                )}
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border bg-background hover:bg-muted">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-muted">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio & Details - Indented on Desktop to align with Name */}
        <div className="mt-6 sm:ml-[152px]">
          {profile.bio && (
            <p className="text-foreground/80 leading-relaxed mb-4 text-sm max-w-2xl text-center sm:text-left">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Tham gia {joinDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
