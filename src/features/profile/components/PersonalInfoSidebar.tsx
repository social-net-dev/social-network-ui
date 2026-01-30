import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { School, Heart, Edit2, Save, X } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'

interface PersonalInfo {
  school?: string
  class?: string
  favoriteSubjects?: string[]
  hobbies?: string[]
}

export function PersonalInfoSidebar() {
  const { profile, updateProfile, isUpdating } = useProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<PersonalInfo>(() => {
    const bio = profile?.bio || ''
    const info: PersonalInfo = {}

    try {
      const parsed = JSON.parse(bio)
      if (parsed.school) info.school = parsed.school
      if (parsed.class) info.class = parsed.class
      if (parsed.favoriteSubjects) info.favoriteSubjects = parsed.favoriteSubjects
      if (parsed.hobbies) info.hobbies = parsed.hobbies
    } catch {
      // If bio is not JSON, treat it as plain text
    }

    return info
  })

  const handleAddSubject = () => {
    setFormData(prev => ({
      ...prev,
      favoriteSubjects: [...(prev.favoriteSubjects || []), '']
    }))
  }

  const handleRemoveSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects?.filter((_, i) => i !== index)
    }))
  }

  const handleSubjectChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects?.map((s, i) => i === index ? value : s)
    }))
  }

  const handleAddHobby = () => {
    setFormData(prev => ({
      ...prev,
      hobbies: [...(prev.hobbies || []), '']
    }))
  }

  const handleRemoveHobby = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies?.filter((_, i) => i !== index)
    }))
  }

  const handleHobbyChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      hobbies: prev.hobbies?.map((h, i) => i === index ? value : h)
    }))
  }

  const handleSave = async () => {
    try {
      const currentBio = profile?.bio || ''
      const existingInfo: Record<string, any> = {}

      try {
        const parsed = JSON.parse(currentBio)
        Object.assign(existingInfo, parsed)
      } catch {}

      const updatedInfo = {
        ...existingInfo,
        school: formData.school,
        class: formData.class,
        favoriteSubjects: formData.favoriteSubjects?.filter(s => s.trim()),
        hobbies: formData.hobbies?.filter(h => h.trim()),
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
      if (parsed.favoriteSubjects) info.favoriteSubjects = parsed.favoriteSubjects
      if (parsed.hobbies) info.hobbies = parsed.hobbies
    } catch {}

    setFormData(info)
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5 flex items-center justify-between">
        <CardTitle className="text-base font-semibold">Thông tin cá nhân</CardTitle>
        {!isEditing ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isUpdating}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
              className="h-8 px-2 bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90"
            >
              {isUpdating ? <span className="animate-spin text-xs">⏳</span> : <Save className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}
      </CardHeader>

      <Separator className="mb-5" />

      <CardContent className="px-5 pb-5 space-y-5">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school">Trường</Label>
              <Input
                id="school"
                value={formData.school || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                placeholder="Nhập tên trường..."
                className="rounded-xl border-gray-200 dark:border-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Lớp</Label>
              <Input
                id="class"
                value={formData.class || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                placeholder="Nhập tên lớp..."
                className="rounded-xl border-gray-200 dark:border-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label>Môn học yêu thích</Label>
              <div className="flex flex-wrap gap-2">
                {formData.favoriteSubjects?.map((subject, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Input
                      value={subject}
                      onChange={(e) => handleSubjectChange(index, e.target.value)}
                      placeholder="Môn học..."
                      className="h-8 w-32 rounded-lg border-gray-200 dark:border-gray-800"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveSubject(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSubject}
                  className="h-8 px-3 rounded-lg border-dashed text-muted-foreground hover:border-etechs-primary hover:text-etechs-primary"
                >
                  + Thêm
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sở thích</Label>
              <div className="flex flex-wrap gap-2">
                {formData.hobbies?.map((hobby, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Input
                      value={hobby}
                      onChange={(e) => handleHobbyChange(index, e.target.value)}
                      placeholder="Sở thích..."
                      className="h-8 w-32 rounded-lg border-gray-200 dark:border-gray-800"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveHobby(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddHobby}
                  className="h-8 px-3 rounded-lg border-dashed text-muted-foreground hover:border-etechs-primary hover:text-etechs-primary"
                >
                  + Thêm
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.school && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-etechs-primary/10 text-etechs-primary">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Trường học</p>
                  <p className="text-sm font-medium text-foreground">{formData.school}</p>
                </div>
              </div>
            )}

            {formData.class && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lớp</p>
                  <p className="text-sm font-medium text-foreground">{formData.class}</p>
                </div>
              </div>
            )}

            {formData.favoriteSubjects && formData.favoriteSubjects.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Môn học yêu thích</p>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  {formData.favoriteSubjects.filter(s => s.trim()).map((subject, index) => (
                    <Badge key={index} variant="secondary" className="rounded-lg px-3 py-1">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.hobbies && formData.hobbies.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground pl-1">Sở thích</p>
                <div className="flex flex-wrap gap-2 pl-1">
                  {formData.hobbies.filter(h => h.trim()).map((hobby, index) => (
                    <Badge key={index} className="rounded-lg px-3 py-1 bg-etechs-primary/10 text-etechs-primary dark:text-etechs-primary">
                      {hobby}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!formData.school && !formData.class && !formData.favoriteSubjects?.length && !formData.hobbies?.length && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Chưa có thông tin cá nhân</p>
                <p className="text-xs mt-1">Nhấn vào icon chỉnh sửa để thêm thông tin</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
