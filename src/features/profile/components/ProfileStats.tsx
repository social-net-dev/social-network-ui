import { Users, FileText } from "lucide-react"
import type { ProfileStats } from "../types/profile.types"
import { Card, CardContent } from "@/components/ui/card"

interface ProfileStatsProps {
  stats: ProfileStats
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const items = [
    { 
        label: 'Bài viết', 
        value: stats.posts, 
        icon: FileText,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    { 
        label: 'Người theo dõi', 
        value: stats.followers, 
        icon: Users,
        color: 'text-etechs-secondary dark:text-etechs-primary',
        bg: 'bg-etechs-primary/10'
    },
    { 
        label: 'Đang theo dõi', 
        value: stats.following, 
        icon: Users,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10'
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="border-none shadow-lg bg-white dark:bg-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {item.value.toLocaleString()}
                </h3>
              </div>
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color} transition-colors group-hover:bg-opacity-20`}>
                <item.icon className="w-6 h-6" />
              </div>
            </div>
            {/* Visual decoration */}
            <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${item.color.replace('text-', 'bg-')} opacity-60`} 
                    style={{ width: '60%' }} 
                />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
