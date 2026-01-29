import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, MapPin, Calendar, ChevronRight, Building2 } from 'lucide-react'

interface Experience {
  id: string
  title: string
  company: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
  achievements?: string[]
  technologies?: string[]
}

interface ExperienceTimelineProps {
  experiences?: Experience[]
}

export function ExperienceTimeline({ experiences = defaultExperiences }: ExperienceTimelineProps) {
  return (
    <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary">
            <Briefcase className="w-5 h-5" />
          </div>
          Kinh nghiệm làm việc
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {experiences.map((exp, index) => (
            <div key={exp.id} className="relative pl-8 pb-8 last:pb-0">
              {index !== experiences.length - 1 && (
                <div className="absolute left-3 top-10 bottom-0 w-0.5 bg-gradient-to-b from-etechs-secondary/50 to-transparent" />
              )}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gradient-to-br from-etechs-primary to-teal-400 border-4 border-white dark:border-card shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {exp.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Building2 className="w-4 h-4" />
                      <span className="font-medium">{exp.company}</span>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${exp.current ? 'bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'} font-medium border-none`}
                  >
                    {exp.current ? 'Đang làm việc' : 'Đã kết thúc'}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {exp.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{exp.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {exp.startDate} {exp.endDate ? `- ${exp.endDate}` : '- Nay'}
                    </span>
                  </div>
                </div>

                {exp.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {exp.description}
                  </p>
                )}

                {exp.achievements && exp.achievements.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Thành tích nổi bật
                    </p>
                    <ul className="space-y-2">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <ChevronRight className="w-4 h-4 text-etechs-secondary dark:text-etechs-primary flex-shrink-0 mt-0.5" />
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((tech, i) => (
                      <Badge 
                        key={i}
                        variant="outline"
                        className="text-xs px-2.5 py-1 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-etechs-primary/10 hover:border-etechs-primary/30 transition-colors"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const defaultExperiences: Experience[] = [
  {
    id: '1',
    title: 'Senior AI Engineer',
    company: 'ETECHS',
    location: 'Hồ Chí Minh, Việt Nam',
    startDate: '2023/06',
    current: true,
    description: 'Chịu trách nhiệm phát triển và triển khai các hệ thống AI cho sản phẩm công nghệ giáo dục của ETECHS',
    achievements: [
      'Xây dựng hệ thống AI Tutor cá nhân hóa cho hàng ngàn học viên',
      'Tối ưu hóa mô hình NLP, giảm độ trễ xử lý từ 500ms xuống 50ms',
      'Thiết kế kiến trúc microservices có khả năng mở rộng lên 1M người dùng'
    ],
    technologies: ['Python', 'TensorFlow', 'PyTorch', 'FastAPI', 'AWS', 'Kubernetes']
  },
  {
    id: '2',
    title: 'Machine Learning Engineer',
    company: 'Tech Solutions Inc.',
    location: 'Singapore',
    startDate: '2021/01',
    endDate: '2023/05',
    description: 'Phát triển các mô hình machine learning cho phân tích dữ liệu khách hàng và dự báo xu hướng thị trường',
    achievements: [
      'Tăng độ chính xác của hệ thống recommendation lên 35%',
      'Xây dựng pipeline ETL tự động, giảm thời gian xử lý dữ liệu 60%',
      'Đạt giải "Best Innovation Award" 2022'
    ],
    technologies: ['Scikit-learn', 'Spark', 'Airflow', 'Docker', 'GCP']
  },
  {
    id: '3',
    title: 'Data Scientist',
    company: 'DataV Analytics',
    startDate: '2019/08',
    endDate: '2020/12',
    description: 'Phân tích dữ liệu và xây dựng báo cáo insights cho các khách hàng doanh nghiệp',
    achievements: [
      'Cung cấp insights cho 20+ dự án phân tích dữ liệu',
      'Xây dựng dashboard thời gian thực theo dõi KPI'
    ],
    technologies: ['Python', 'R', 'SQL', 'Tableau', 'Power BI']
  }
]
