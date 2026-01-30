import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, Database, Cloud, Zap, TrendingUp, Award, Sparkles, type LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Code,
  Database,
  Cloud,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
}

interface Skill {
  name: string
  level: number
  category: 'technical' | 'soft' | 'certification'
  iconName?: string
}

interface SkillsSectionProps {
  skills?: Skill[]
}

export function SkillsSection({ skills = defaultSkills }: SkillsSectionProps) {
  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  const categoryConfig = {
    technical: {
      title: 'Kỹ năng chuyên môn',
      icon: Code,
      color: 'bg-etechs-secondary',
      textColor: 'text-etechs-secondary dark:text-etechs-primary',
      bgColor: 'bg-etechs-primary/10',
      progressBar: 'bg-gradient-to-r from-etechs-secondary to-teal-600'
    },
    soft: {
      title: 'Kỹ năng mềm',
      icon: Sparkles,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      progressBar: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    certification: {
      title: 'Chứng chỉ',
      icon: Award,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      progressBar: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    }
  }

  return (
    <div className="space-y-6">
      {(Object.keys(groupedSkills) as Array<keyof typeof categoryConfig>).map((category) => {
        const config = categoryConfig[category]
        const Icon = config.icon
        const categorySkills = groupedSkills[category]

        if (!categorySkills || categorySkills.length === 0) return null

        return (
          <Card key={category} className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${config.bgColor} ${config.textColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {config.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {categorySkills.map((skill, index) => {
                const SkillIcon = skill.iconName ? iconMap[skill.iconName] : null
                return (
                  <div key={index} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {SkillIcon && (
                          <SkillIcon className={`w-5 h-5 ${config.textColor} opacity-80 group-hover:opacity-100 transition-opacity`} />
                        )}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {skill.name}
                        </span>
                      </div>
                      <Badge variant="secondary" className={`${config.bgColor} ${config.textColor} font-bold border-none`}>
                        {skill.level}%
                      </Badge>
                    </div>
                    <div className="relative h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${config.progressBar} rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg`}
                        style={{
                          width: `${skill.level}%`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

const defaultSkills: Skill[] = [
  { name: 'React & Next.js', level: 95, category: 'technical', iconName: 'Code' },
  { name: 'TypeScript', level: 90, category: 'technical', iconName: 'Code' },
  { name: 'Python & AI/ML', level: 88, category: 'technical', iconName: 'Zap' },
  { name: 'Cloud Computing', level: 82, category: 'technical', iconName: 'Cloud' },
  { name: 'Database Design', level: 85, category: 'technical', iconName: 'Database' },
  { name: 'Leadership', level: 88, category: 'soft', iconName: 'TrendingUp' },
  { name: 'Problem Solving', level: 92, category: 'soft', iconName: 'Sparkles' },
  { name: 'Communication', level: 85, category: 'soft', iconName: 'Sparkles' },
  { name: 'AWS Certified', level: 100, category: 'certification', iconName: 'Award' },
  { name: 'Google Cloud', level: 90, category: 'certification', iconName: 'Award' }
]
