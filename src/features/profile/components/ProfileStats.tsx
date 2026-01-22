import { Users, FileText } from 'lucide-react'
import type { ProfileStats } from '../types/profile.types'

interface ProfileStatsProps {
  stats: ProfileStats
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const items = [
    { label: 'Bài viết', value: stats.posts, icon: FileText },
    { label: 'Người theo dõi', value: stats.followers, icon: Users },
    { label: 'Đang theo dõi', value: stats.following, icon: Users },
  ]

  return (
    <div className="bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thống kê</h2>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <item.icon className="w-6 h-6 mx-auto mb-2 text-[#1b7a78]" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{item.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
