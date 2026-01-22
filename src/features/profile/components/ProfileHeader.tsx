import { Avatar } from '@/features/shared/components/Avatar'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Link as LinkIcon, Edit2 } from 'lucide-react'
import type { ProfileData } from '../types/profile.types'

interface ProfileHeaderProps {
  profile: ProfileData
  isCurrentUser?: boolean
  onEdit?: () => void
}

export function ProfileHeader({ profile, isCurrentUser = false, onEdit }: ProfileHeaderProps) {
  return (
    <div className="bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-[#1b7a78] to-[#26a69a]" />
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16">
          <Avatar user={profile} size="xl" className="border-4 border-white dark:border-[#0A2737]" />
          <div className="mt-4 sm:mt-0 sm:mb-2 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
          </div>
          {isCurrentUser && (
            <Button onClick={onEdit} variant="outline" className="mb-2">
              <Edit2 className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>
        {profile.bio && (
          <p className="mt-4 text-gray-700 dark:text-gray-300">{profile.bio}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Hồ Chí Minh, Việt Nam
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Tham gia tháng 1/2024
          </div>
          <div className="flex items-center">
            <LinkIcon className="w-4 h-4 mr-1" />
            <a href="#" className="hover:text-[#1b7a78]">
              etechs.vn
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
