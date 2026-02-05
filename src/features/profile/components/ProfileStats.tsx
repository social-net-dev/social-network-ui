import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Users, UserCheck } from 'lucide-react'

interface ProfileStatsProps {
  stats: {
    posts: number
    followers: number
    following: number
  }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const [animatedValues, setAnimatedValues] = useState({ posts: 0, followers: 0, following: 0 })

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const safeStats = {
        posts: stats?.posts || 0,
        followers: stats?.followers || 0,
        following: stats?.following || 0
    }
    const increment = {
      posts: safeStats.posts / steps,
      followers: safeStats.followers / steps,
      following: safeStats.following / steps
    }

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      setAnimatedValues(prev => ({
        posts: Math.min(Math.floor(prev.posts + increment.posts), safeStats.posts),
        followers: Math.min(Math.floor(prev.followers + increment.followers), safeStats.followers),
        following: Math.min(Math.floor(prev.following + increment.following), safeStats.following)
      }))

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [stats])

  const statItems = [
    { label: 'Bài viết', value: animatedValues.posts, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Người theo dõi', value: animatedValues.followers, icon: Users, color: 'text-etechs-primary', bg: 'bg-etechs-primary/10' },
    { label: 'Đang theo dõi', value: animatedValues.following, icon: UserCheck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} className="border-none shadow-sm bg-card hover:shadow-md transition-all-300 rounded-xl overflow-hidden group">
          <CardContent className="p-4 flex flex-col items-center sm:flex-row sm:gap-4">
            <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="text-center sm:text-left mt-2 sm:mt-0">
              <p className="text-xl font-bold text-foreground">{item.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
