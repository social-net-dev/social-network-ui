import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  FileText, 
  Heart, 
  MessageSquare, 
  Share2,
  Trophy,
  UserPlus,
  Calendar,
  TrendingUp
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

  const typeConfig = {
    post: {
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    like: {
      icon: Heart,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    },
    comment: {
      icon: MessageSquare,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    share: {
      icon: Share2,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    achievement: {
      icon: Trophy,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    },
    follow: {
      icon: UserPlus,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10'
    },
    course_complete: {
      icon: Calendar,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    }
  }

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            Hoạt động gần đây
          </div>
          <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <Clock className="w-3 h-3 mr-1" />
            {displayActivities.length} hoạt động
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity, index) => {
            const config = typeConfig[activity.type]
            const Icon = activity.icon || config.icon

            return (
              <div key={activity.id} className="flex items-start gap-4 group">
                <div className={`relative mt-1`}>
                  <div className={`p-2.5 rounded-xl ${activity.bg} ${activity.color} transition-all duration-300 group-hover:scale-110`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {index < displayActivities.length - 1 && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-gray-200 dark:from-white/5 to-transparent" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-etechs-secondary dark:group-hover:text-etechs-primary transition-colors">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.timestamp}
                  </p>
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
    description: 'Hoàn thành thành tích đăng 100 bài viết chất lượng',
    timestamp: '2 giờ trước',
    icon: Trophy,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  {
    id: '2',
    type: 'post',
    title: 'Đăng bài viết mới',
    description: 'Chia sẻ về kinh nghiệm học AI với Python',
    timestamp: '5 giờ trước',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  {
    id: '3',
    type: 'course_complete',
    title: 'Hoàn thành khóa học',
    description: 'Hoàn thành khóa "Advanced Machine Learning" với điểm xuất sắc',
    timestamp: '1 ngày trước',
    icon: Calendar,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  {
    id: '4',
    type: 'like',
    title: 'Nhận 50 lượt thích',
    description: 'Bài viết "10 kỹ năng cần có cho Data Scientist" nhận được sự quan tâm lớn',
    timestamp: '2 ngày trước',
    icon: Heart,
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  {
    id: '5',
    type: 'follow',
    title: 'Đạt 1.000 người theo dõi',
    description: 'Cảm ơn mọi người đã tin tưởng và theo dõi',
    timestamp: '3 ngày trước',
    icon: UserPlus,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10'
  }
]
