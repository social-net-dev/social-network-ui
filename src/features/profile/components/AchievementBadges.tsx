import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Star, Award, Zap, Flame, Target, Gem, Users, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Medal,
  Star,
  Award,
  Zap,
  Flame,
  Target,
  Gem,
  Users,
}

interface Achievement {
  id: string
  title: string
  description: string
  iconName: string
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  earnedDate?: string
  progress?: number
  total?: number
}

interface AchievementBadgesProps {
  achievements?: Achievement[]
}

export function AchievementBadges({ achievements = defaultAchievements }: AchievementBadgesProps) {
  const levelConfig = {
    bronze: {
      bg: 'bg-amber-700',
      bgLight: 'bg-amber-100 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-300 dark:border-amber-700',
      gradient: 'from-amber-600 to-amber-800'
    },
    silver: {
      bg: 'bg-gray-500',
      bgLight: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      gradient: 'from-gray-400 to-gray-600'
    },
    gold: {
      bg: 'bg-yellow-500',
      bgLight: 'bg-yellow-100 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-400 dark:border-yellow-700',
      gradient: 'from-yellow-400 to-yellow-600'
    },
    platinum: {
      bg: 'bg-slate-300',
      bgLight: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-600',
      gradient: 'from-slate-300 to-slate-400'
    },
    diamond: {
      bg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
      bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-300 dark:border-cyan-700',
      gradient: 'from-cyan-400 via-blue-500 to-purple-600'
    }
  }

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
            <Trophy className="w-5 h-5" />
          </div>
          Thành tích & Huy hiệu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const config = levelConfig[achievement.level]
            const Icon = iconMap[achievement.iconName] || Award
            const isCompleted = !achievement.progress || achievement.progress >= (achievement.total || 0)

            return (
              <div
                key={achievement.id}
                className={`group relative p-4 rounded-2xl border-2 ${config.border} ${config.bgLight} hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl ${isCompleted ? config.bg : 'bg-gray-200 dark:bg-gray-700'} ${isCompleted ? 'text-white' : 'text-gray-400'} transition-all duration-300 group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs font-semibold px-2.5 py-1 ${config.bgLight} ${config.text} border-none capitalize`}
                    >
                      {achievement.level}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {achievement.description}
                  </p>

                  {achievement.progress !== undefined && achievement.total !== undefined && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Tiến độ</span>
                        <span className={`font-semibold ${config.text}`}>
                          {achievement.progress}/{achievement.total}
                        </span>
                      </div>
                      <div className="relative h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-500`}
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {achievement.earnedDate && (
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      Đạt được {achievement.earnedDate}
                    </p>
                  )}
                </div>

                {!isCompleted && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

const defaultAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Nhà sáng tạo',
    description: 'Đăng 100 bài viết chất lượng',
    iconName: 'Star',
    level: 'gold',
    earnedDate: '15/01/2026'
  },
  {
    id: '2',
    title: 'Người kết nối',
    description: 'Có 1.000 người theo dõi',
    iconName: 'Users',
    level: 'platinum',
    earnedDate: '10/01/2026'
  },
  {
    id: '3',
    title: 'Chuyên gia chia sẻ',
    description: 'Đạt 500 lượt chia sẻ bài viết',
    iconName: 'Zap',
    level: 'gold',
    progress: 350,
    total: 500
  },
  {
    id: '4',
    title: 'Thành tích nổi bật',
    description: 'Top 10 người dùng hoạt động nhất',
    iconName: 'Medal',
    level: 'diamond',
    earnedDate: '01/01/2026'
  },
  {
    id: '5',
    title: 'Người tích cực',
    description: 'Hoạt động 30 ngày liên tục',
    iconName: 'Flame',
    level: 'silver',
    progress: 22,
    total: 30
  },
  {
    id: '6',
    title: 'Đạt mục tiêu',
    description: 'Hoàn thành 50 thử thách học tập',
    iconName: 'Target',
    level: 'gold',
    progress: 48,
    total: 50
  },
  {
    id: '7',
    title: 'Học giả',
    description: 'Đạt chứng chỉ chuyên môn cao',
    iconName: 'Award',
    level: 'platinum',
    earnedDate: '20/12/2025'
  },
  {
    id: '8',
    title: 'Huyền thoại',
    description: 'Tất cả các thành tích vàng và cao hơn',
    iconName: 'Gem',
    level: 'diamond',
    progress: 5,
    total: 8
  }
]
