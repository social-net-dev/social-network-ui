import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { School, Heart, Edit2, Save, X, Plus } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import type { Author, PersonalInfo } from '@/features/home/types/feed.types'

export function PersonalInfoSidebar() {
  const { profile: rawProfile, updateProfile, isUpdating } = useProfile()
  const profile = rawProfile as Author
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState<PersonalInfo>({
    school: '',
    class: '',
    favoriteSubjects: [],
    hobbies: []
  })

  // Sync with profile data
  useEffect(() => {
    if (profile?.personalInfo) {
      setFormData({
        school: profile.personalInfo.school || '',
        class: profile.personalInfo.class || '',
        favoriteSubjects: profile.personalInfo.favoriteSubjects || [],
        hobbies: profile.personalInfo.hobbies || []
      })
    }
  }, [profile])

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
      // Construct the JSON bio payload
      const bioPayload = JSON.stringify({
        bioText: profile?.bio || '', // Preserve original bio text
        ...formData,
        favoriteSubjects: formData.favoriteSubjects?.filter(s => s.trim()),
        hobbies: formData.hobbies?.filter(h => h.trim()),
      })

      await updateProfile({
        displayName: profile?.displayName || '',
        bio: bioPayload,
      })

      setIsEditing(false)
      alert('Cập nhật thông tin thành công!')
    } catch (error) {
      console.error(error)
      alert('Cập nhật thất bại!')
    }
  }

  const handleCancel = () => {
    if (profile?.personalInfo) {
      setFormData({
        school: profile.personalInfo.school || '',
        class: profile.personalInfo.class || '',
        favoriteSubjects: profile.personalInfo.favoriteSubjects || [],
        hobbies: profile.personalInfo.hobbies || []
      })
    }
    setIsEditing(false)
  }

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card">
      <CardHeader className="pb-3 pt-5 px-5 flex items-center justify-between">
        <CardTitle className="text-base font-semibold">Thông tin cá nhân</CardTitle>
        {!isEditing ? (
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isUpdating} className="h-8 w-8 p-0"><X className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={handleSave} disabled={isUpdating} className="h-8 w-8 p-0 bg-etechs-primary text-etechs-secondary">
              {isUpdating ? "..." : <Save className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="px-5 py-5 space-y-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trường</Label>
              <Input value={formData.school || ''} onChange={e => setFormData({...formData, school: e.target.value})} placeholder="Tên trường học" />
            </div>
            <div className="space-y-2">
              <Label>Lớp</Label>
              <Input value={formData.class || ''} onChange={e => setFormData({...formData, class: e.target.value})} placeholder="Tên lớp" />
            </div>
            
            <div className="space-y-2">
              <Label>Môn học yêu thích</Label>
              <div className="space-y-2">
                {formData.favoriteSubjects?.map((subject, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={subject} onChange={e => handleSubjectChange(index, e.target.value)} className="h-8" />
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveSubject(index)} className="h-8 w-8"><X className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddSubject} className="w-full h-8 border-dashed">
                  <Plus className="w-3 h-3 mr-1" /> Thêm môn học
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sở thích</Label>
              <div className="space-y-2">
                {formData.hobbies?.map((hobby, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={hobby} onChange={e => handleHobbyChange(index, e.target.value)} className="h-8" />
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveHobby(index)} className="h-8 w-8"><X className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddHobby} className="w-full h-8 border-dashed">
                  <Plus className="w-3 h-3 mr-1" /> Thêm sở thích
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {formData.school && (
              <div className="flex items-start gap-3">
                <School className="w-4 h-4 text-etechs-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Trường học</p>
                  <p className="text-sm font-medium">{formData.school}</p>
                </div>
              </div>
            )}
            {formData.class && (
              <div className="flex items-start gap-3">
                <School className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Lớp</p>
                  <p className="text-sm font-medium">{formData.class}</p>
                </div>
              </div>
            )}
            
            {formData.favoriteSubjects && formData.favoriteSubjects.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <p className="text-xs text-muted-foreground">Môn học yêu thích</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.favoriteSubjects.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                </div>
              </div>
            )}

            {formData.hobbies && formData.hobbies.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Sở thích</p>
                <div className="flex flex-wrap gap-2">
                  {formData.hobbies.map((h, i) => <Badge key={i} className="bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400 border-0">{h}</Badge>)}
                </div>
              </div>
            )}

            {!formData.school && !formData.class && !formData.favoriteSubjects?.length && !formData.hobbies?.length && (
              <p className="text-sm text-center text-muted-foreground py-4">Chưa có thông tin cá nhân</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
