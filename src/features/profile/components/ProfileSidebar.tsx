import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
  MessageCircle,
  Share2
} from 'lucide-react'
import type { ProfileData } from '../types/profile.types'

interface ProfileSidebarProps {
  contactInfo?: {
    email?: string
    phone?: string
    location?: string
    website?: string
  }
  socialLinks?: ProfileData['socialLinks']
}

export function ProfileSidebar({ 
  contactInfo,
  socialLinks
}: ProfileSidebarProps) {
  // Safe defaults
  const info = contactInfo || defaultContactInfo
  const links = socialLinks || defaultSocialLinks || []
  
  const socialIconMap: Record<string, any> = {
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    github: Github,
    website: Globe
  }

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base font-semibold">Giới thiệu</CardTitle>
      </CardHeader>
      
      <CardContent className="px-5 pb-5 space-y-5">
        {/* Contact Info Section */}
        <div className="space-y-3">
          {info.location && (
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 text-foreground/70 shrink-0" />
              <span className="text-foreground">{info.location}</span>
            </div>
          )}
          
          {info.email && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground group">
              <Mail className="w-4 h-4 text-foreground/70 shrink-0" />
              <span className="truncate text-foreground">{info.email}</span>
            </div>
          )}

          {info.phone && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="w-4 h-4 text-foreground/70 shrink-0" />
              <span className="text-foreground">{info.phone}</span>
            </div>
          )}

          {info.website && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Globe className="w-4 h-4 text-foreground/70 shrink-0" />
              <a 
                href={info.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-etechs-primary hover:underline truncate font-medium"
              >
                {info.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        <Separator />

        {/* Social Links Section */}
        {links.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5" /> Mạng xã hội
            </h4>
            <div className="flex flex-wrap gap-2">
              {links.map((social) => {
                const Icon = socialIconMap[social.platform] || Globe
                return (
                  <Button
                    key={social.platform}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-lg gap-2 text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <a href={social.url} target="_blank" rel="noopener noreferrer">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="capitalize">{social.label}</span>
                    </a>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions Section - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <Button className="w-full bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 rounded-lg h-9 text-sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Nhắn tin
          </Button>
          <Button variant="outline" className="w-full rounded-lg h-9 text-sm">
            <Share2 className="w-4 h-4 mr-2" />
            Chia sẻ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const defaultContactInfo = {
  email: 'contact@etechs.vn',
  phone: '+84 123 456 789',
  location: 'Hồ Chí Minh, Việt Nam',
  website: 'https://etechs.vn'
}

const defaultSocialLinks: ProfileData['socialLinks'] = [
  { platform: 'facebook', url: 'https://facebook.com/etechs', label: 'Facebook' },
  { platform: 'github', url: 'https://github.com/etechs', label: 'GitHub' }
]
