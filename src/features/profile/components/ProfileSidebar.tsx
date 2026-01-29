import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Mail,
  Phone,
  Globe,
  MessageCircle,
  Share2
} from 'lucide-react'

interface ProfileSidebarProps {
  contactInfo?: {
    email?: string
    phone?: string
    website?: string
  }
}

export function ProfileSidebar({
  contactInfo
}: ProfileSidebarProps) {
  const info = contactInfo || {}

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-base font-semibold">Giới thiệu</CardTitle>
      </CardHeader>

      <CardContent className="px-5 pb-5 space-y-5">
        {/* Contact Info Section */}
        <div className="space-y-3">
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

        {(info.email || info.phone || info.website) && <Separator />}

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
