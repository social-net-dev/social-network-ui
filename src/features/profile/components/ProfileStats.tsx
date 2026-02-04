import { Users, FileText, ArrowUp, ArrowDown } from "lucide-react"
import type { ProfileStats } from "../types/profile.types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"

interface StatItem {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  trend?: { value: number, isUp: boolean }
  progress: number
}

interface ProfileStatsProps {
  stats: ProfileStats
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

  const items: StatItem[] = [
    {
      label: 'Bài viết',
      value: animatedValues.posts,
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      trend: { value: 12, isUp: true },
      progress: 65
    },
    {
      label: 'Người theo dõi',
      value: animatedValues.followers,
      icon: Users,
      color: 'text-etechs-secondary dark:text-etechs-primary',
      bg: 'bg-etechs-primary/10',
      trend: { value: 23, isUp: true },
      progress: 78
    },
    {
      label: 'Đang theo dõi',
      value: animatedValues.following,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      trend: { value: 5, isUp: false },
      progress: 45
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="border-none shadow-lg bg-white dark:bg-card overflow-hidden group hover:scale-[1.02] hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <item.icon className="w-6 h-6" />
              </div>
              {item.trend && (
                <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-1 ${item.trend.isUp ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                  {item.trend.isUp ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {item.trend.value}%
                </Badge>
              )}
            </div>
            
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
            <h3 className={`text-4xl font-bold ${item.color} transition-all duration-300`}>
              {item.value.toLocaleString()}
            </h3>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                <span>Mức độ hoạt động</span>
                <span className="font-semibold">{item.progress}%</span>
              </div>
              <div className="relative h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full ${item.color.replace('text-', 'bg-gradient-to-r from-')} to-${item.color.replace('text-', '')} opacity-80 rounded-full transition-all duration-1000 ease-out group-hover:opacity-100`}
                  style={{ 
                    width: `${item.progress}%`,
                    background: `linear-gradient(90deg, ${getColorClass(item.color)} 0%, ${getColorClass(item.color)} 100%)`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-shimmer" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getColorClass(colorClass: string): string {
  const colorMap: Record<string, string> = {
    'text-blue-500': '#3B82F6',
    'text-etechs-secondary': '#E2F046',
    'text-etechs-primary': '#0E4E5A',
    'text-purple-500': '#A855F7'
  }
  return colorMap[colorClass] || '#0E4E5A'
}
