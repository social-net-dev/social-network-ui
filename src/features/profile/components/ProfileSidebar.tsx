import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Link as LinkIcon,
  Facebook,
  Linkedin,
  Twitter,
  Github,
  Share2,
  Bookmark,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react'

interface ContactInfo {
  email?: string
  phone?: string
  location?: string
  website?: string
}

interface SocialLink {
  platform: 'facebook' | 'linkedin' | 'twitter' | 'github' | 'website'
  url: string
  label: string
}

interface ProfileSidebarProps {
  contactInfo?: ContactInfo
  socialLinks?: SocialLink[]
}

export function ProfileSidebar({ 
  contactInfo,
  socialLinks
}: ProfileSidebarProps) {
  const info = contactInfo || defaultContactInfo
  const links = socialLinks || defaultSocialLinks
  
  const socialIconMap = {
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    github: Github,
    website: Globe
  }

  const quickActions = [
    { icon: MessageCircle, label: 'Nhắn tin', variant: 'default' as const },
    { icon: Bookmark, label: 'Lưu trang', variant: 'outline' as const },
    { icon: Share2, label: 'Chia sẻ', variant: 'outline' as const },
    { icon: MoreHorizontal, label: 'Khác', variant: 'ghost' as const }
  ]

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center">
            <div className="p-2 rounded-xl bg-etechs-primary/10 text-etechs-secondary dark:text-etechs-primary mr-3">
              <Mail className="w-5 h-5" />
            </div>
            Thông tin liên hệ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {info.email && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-etechs-secondary dark:group-hover:text-etechs-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{info.email}</p>
              </div>
            </div>
          )}

          {info.phone && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
                <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-etechs-secondary dark:group-hover:text-etechs-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Điện thoại</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{info.phone}</p>
              </div>
            </div>
          )}

          {info.location && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
                <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-etechs-secondary dark:group-hover:text-etechs-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Địa chỉ</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{info.location}</p>
              </div>
            </div>
          )}

          {info.website && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 group-hover:bg-etechs-primary/10 transition-colors">
                <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-etechs-secondary dark:group-hover:text-etechs-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                <a href={info.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-etechs-secondary dark:text-etechs-primary hover:underline truncate">
                  {info.website}
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 mr-3">
              <LinkIcon className="w-5 h-5" />
            </div>
            Mạng xã hội
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {links.map((social) => {
              const Icon = socialIconMap[social.platform]
              const colorMap = {
                facebook: 'bg-blue-500 hover:bg-blue-600',
                linkedin: 'bg-blue-700 hover:bg-blue-800',
                twitter: 'bg-sky-500 hover:bg-sky-600',
                github: 'bg-gray-800 hover:bg-gray-900',
                website: 'bg-etechs-secondary hover:bg-etechs-secondary/80'
              }
              
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl ${colorMap[social.platform]} text-white transition-all duration-300 hover:scale-110 hover:shadow-lg group`}
                  title={social.label}
                >
                  <Icon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-none shadow-lg bg-white dark:bg-card rounded-3xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 mr-3">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            Hành động nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                className={`justify-start gap-3 ${action.variant === 'default' ? 'bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90' : ''} hover:scale-[1.02] transition-all duration-300`}
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const defaultContactInfo: ContactInfo = {
  email: 'contact@etechs.vn',
  phone: '+84 123 456 789',
  location: 'Hồ Chí Minh, Việt Nam',
  website: 'https://etechs.vn'
}

const defaultSocialLinks: SocialLink[] = [
  { platform: 'facebook', url: 'https://facebook.com/etechs', label: 'Facebook' },
  { platform: 'linkedin', url: 'https://linkedin.com/company/etechs', label: 'LinkedIn' },
  { platform: 'twitter', url: 'https://twitter.com/etechs', label: 'Twitter' },
  { platform: 'github', url: 'https://github.com/etechs', label: 'GitHub' }
]
