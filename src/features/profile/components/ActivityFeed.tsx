import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Clock, 
  FileText, 
  Heart, 
  MessageSquare, 
  Share2,
  Trophy,
  UserPlus,
  Calendar,
  Activity as ActivityIcon
} from 'lucide-react'

interface Activity {
  id: string
  type: 'post' | 'like' | 'comment' | 'share' | 'achievement' | 'follow' | 'course_complete'
  title: string
  description?: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}

interface ActivityFeedProps {
  activities?: Activity[]
  limit?: number
}

export function ActivityFeed({ activities = defaultActivities, limit = 5 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, limit)

  const typeConfig: Record<string, { icon: any, color: string, bg: string }> = {
    post: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    like: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    comment: { icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    share: { icon: Share2, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    achievement: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    follow: { icon: UserPlus, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    course_complete: { icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' }
  }

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-muted-foreground" />
          Hoạt động
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="relative space-y-5">
          {displayActivities.map((activity, index) => {
            const config = typeConfig[activity.type]
            const Icon = activity.icon || config?.icon || ActivityIcon
            const colors = config || { color: 'text-gray-500', bg: 'bg-gray-100' }

            return (
              <div key={activity.id} className="flex gap-3 relative">
                {/* Timeline connector */}
                {index < displayActivities.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-[-20px] w-px bg-border" />
                )}
                
                <div className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colors.bg}`}>
                  <Icon className={`w-4 h-4 ${colors.color}`} />
                </div>
                
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium leading-none text-foreground truncate">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center mt-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground mr-1" />
                    <span className="text-[10px] text-muted-foreground">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const defaultActivities: Activity[] = [
  {
    id: '1',
    type: 'achievement',
    title: 'Đạt huy hiệu "Nhà sáng tạo"',
    description: 'Đăng 100 bài viết chất lượng',
    timestamp: '2 giờ trước',
    icon: Trophy,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  {
    id: '2',
    type: 'post',
    title: 'Đăng bài viết mới',
    description: 'Chia sẻ về kinh nghiệm học AI',
    timestamp: '5 giờ trước',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    id: '3',
    type: 'like',
    title: 'Thích bài viết',
    description: 'Bạn đã thích bài viết của Nguyễn Văn A',
    timestamp: '1 ngày trước',
    icon: Heart,
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  }
]
