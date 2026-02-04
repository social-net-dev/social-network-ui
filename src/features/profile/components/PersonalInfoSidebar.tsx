import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Edit2, Save, X } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import type { Author } from '@/features/home/types/feed.types'

interface PersonalInfo {
  school?: string
  class?: string
}

export function PersonalInfoSidebar() {
  const { profile: rawProfile, updateProfile, isUpdating } = useProfile()
  const profile = rawProfile as Author
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<PersonalInfo>(() => {
    const bio = profile?.bio || ''
    const info: PersonalInfo = {}

    try {
      const parsed = JSON.parse(bio)
      if (parsed.school) info.school = parsed.school
      if (parsed.class) info.class = parsed.class
    } catch {
      // ignore
    }

    return info
  })

  const handleSave = async () => {
    try {
      const currentBio = profile?.bio || ''
      const existingInfo: Record<string, any> = {}

      try {
        const parsed = JSON.parse(currentBio)
        Object.assign(existingInfo, parsed)
      } catch {
        // ignore
      }

      const updatedInfo = {
        ...existingInfo,
        school: formData.school,
        class: formData.class,
      }

      const newBio = JSON.stringify(updatedInfo)

      await updateProfile({
        displayName: profile?.displayName || '',
        bio: newBio,
      })

      setIsEditing(false)
      alert('Cập nhật thông tin thành công!')
    } catch (error) {
      console.error(error)
      alert('Cập nhật thất bại!')
    }
  }

  const handleCancel = () => {
    const bio = profile?.bio || ''
    const info: PersonalInfo = {}

    try {
      const parsed = JSON.parse(bio)
      if (parsed.school) info.school = parsed.school
      if (parsed.class) info.class = parsed.class
    } catch {
      // ignore
    }

    setFormData(info)
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5 flex items-center justify-between">
        <CardTitle className="text-base font-semibold">Thông tin cá nhân</CardTitle>
        {!isEditing ? (
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isUpdating}><X className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>{isUpdating ? "..." : <Save className="w-3.5 h-3.5" />}</Button>
          </div>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="px-5 py-5 space-y-5">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Trường</Label>
              <Input value={formData.school || ''} onChange={e => setFormData({...formData, school: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label>Lớp</Label>
              <Input value={formData.class || ''} onChange={e => setFormData({...formData, class: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full">Lưu</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.school && <div className="text-sm"><strong>Trường:</strong> {formData.school}</div>}
            {formData.class && <div className="text-sm"><strong>Lớp:</strong> {formData.class}</div>}
            {!formData.school && !formData.class && <p className="text-xs text-muted-foreground">Chưa có thông tin</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
