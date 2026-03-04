import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/features/posts/types/feed.types'
import { ACADEMIC_FIELDS } from '@/features/posts/constants/fields'

export interface Interest {
  label: string
  color?: string
  icon?: any 
}

// Edit Dialog for Basic Info
export function EditBasicInfoDialog({ 
  initialData, 
  onSave, 
  trigger 
}: { 
  initialData: { displayName: string, username: string, birthDate: string, bio: string, location?: string }, 
  onSave: (data: any) => void,
  trigger: React.ReactNode
}) {
  const [formData, setFormData] = useState(initialData)
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    onSave(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Thông tin cá nhân</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Tên hiển thị</Label>
            <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
             <Label htmlFor="birthDate">Ngày sinh</Label>
             <Input id="birthDate" type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Vị trí (Thành phố)</Label>
            <Input id="location" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className="rounded-xl" placeholder="Ví dụ: TP. Hồ Chí Minh" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="bio">Giới thiệu ngắn</Label>
            <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="rounded-xl min-h-[100px]" placeholder="Viết vài dòng giới thiệu về bản thân..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-etechs-primary text-etechs-secondary font-bold rounded-xl px-8 h-11">Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Dialog for Academic Background
export function EditAcademicBackgroundDialog({
  data,
  onSave,
  trigger
}: {
  data: {
    education_level?: string;
    school?: string;
    major?: string;
    class?: string;
    academic_year?: string;
    school_year?: string;
  },
  onSave: (data: any) => void,
  trigger: React.ReactNode
}) {
  const [formData, setFormData] = useState({
    education_level: data.education_level || '',
    school: data.school || '',
    major: data.major || '',
    class: data.class || '',
    academic_year: data.academic_year || '',
    school_year: data.school_year || '',
  })
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    onSave(formData)
    setOpen(false)
  }

  const isUniversityLevel = formData.education_level === 'university'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa học vấn</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Education Level Selection */}
          <div className="grid gap-2">
            <Label htmlFor="education_level">Cấp học</Label>
            <Select
              value={formData.education_level}
              onValueChange={(value) => setFormData({...formData, education_level: value})}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Chọn cấp học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elementary">TH (Tiểu học)</SelectItem>
                <SelectItem value="middle">THCS (Trung học cơ sở)</SelectItem>
                <SelectItem value="high">THPT (Trung học phổ thông)</SelectItem>
                <SelectItem value="university">ĐH/CĐ (Đại học/Cao đẳng)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* School Name - Common for all levels */}
          {formData.education_level && (
            <div className="grid gap-2">
              <Label htmlFor="school">Tên trường</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData({...formData, school: e.target.value})}
                className="rounded-xl"
                placeholder="Nhập tên trường học"
              />
            </div>
          )}

          {/* University Level Fields */}
          {isUniversityLevel && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="major">Ngành</Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData({...formData, major: e.target.value})}
                  className="rounded-xl"
                  placeholder="Ví dụ: Công nghệ thông tin, Kỹ thuật điện"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class">Lớp</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => setFormData({...formData, class: e.target.value})}
                  className="rounded-xl"
                  placeholder="Ví dụ: CNTT01, KTD02"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="academic_year">Niên khóa</Label>
                <Input
                  id="academic_year"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                  className="rounded-xl"
                  placeholder="Ví dụ: 2020-2024, 2021-2025"
                />
              </div>
            </>
          )}

          {/* School Level Fields (TH, THCS, THPT) */}
          {!isUniversityLevel && formData.education_level && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="class">Lớp</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => setFormData({...formData, class: e.target.value})}
                  className="rounded-xl"
                  placeholder="Ví dụ: 5A, 8B, 12C"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="school_year">Năm học</Label>
                <Input
                  id="school_year"
                  value={formData.school_year}
                  onChange={(e) => setFormData({...formData, school_year: e.target.value})}
                  className="rounded-xl"
                  placeholder="Ví dụ: 2023-2024, 2024-2025"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-etechs-primary text-etechs-secondary font-bold rounded-xl px-8 h-11">
            Lưu thông tin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Dialog for Interests (Tags) — supports both predefined list and free text
export function EditInterestsDialog({ 
  title,
  interests, 
  onSave, 
  trigger,
  predefinedList,
}: { 
  title: string,
  interests: { label: string, color?: string }[], 
  onSave: (interests: { label: string, color?: string }[]) => void,
  trigger: React.ReactNode,
  predefinedList?: boolean,
}) {
  const [items, setItems] = useState(interests)
  const [newItem, setNewItem] = useState('')
  const [open, setOpen] = useState(false)

  const handleAddItem = () => {
    if (newItem.trim() && !items.find(i => i.label === newItem.trim())) {
      setItems([...items, { label: newItem.trim() }])
      setNewItem('')
    }
  }

  const handleTogglePredefined = (field: typeof ACADEMIC_FIELDS[number]) => {
    const exists = items.find(i => i.label === field.label)
    if (exists) {
      setItems(items.filter(i => i.label !== field.label))
    } else {
      setItems([...items, { label: field.label, color: field.color }])
    }
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const handleSave = () => {
    onSave(items)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setItems(interests); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {predefinedList ? (
            /* Predefined selectable list for academic interests */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Chọn các lĩnh vực quan tâm:</p>
              <div className="grid grid-cols-1 gap-2">
                {ACADEMIC_FIELDS.map((field) => {
                  const isSelected = items.some(i => i.label === field.label)
                  return (
                    <button
                      key={field.value}
                      type="button"
                      onClick={() => handleTogglePredefined(field)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/40'
                      }`}
                    >
                      <span className="text-lg">{field.icon}</span>
                      <span className="flex-1 text-sm font-semibold">{field.label}</span>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Free text input for personal hobbies */
            <>
              <div className="flex gap-2">
                <Input 
                  placeholder="Nhập nội dung mới..." 
                  value={newItem} 
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  className="rounded-xl"
                />
                <Button onClick={handleAddItem} size="icon" className="bg-etechs-primary text-etechs-secondary rounded-xl"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[100px] border border-border/50 rounded-2xl p-4 bg-muted/20">
                {items.map((item, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1 pl-3 py-1.5 rounded-xl border-none bg-background shadow-sm">
                    {item.label}
                    <button onClick={() => handleRemoveItem(index)} className="hover:bg-destructive hover:text-white rounded-full p-0.5 ml-1 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {items.length === 0 && <span className="text-muted-foreground text-xs p-2">Chưa có thông tin.</span>}
              </div>
            </>
          )}

          {/* Show selected items summary for predefined list */}
          {predefinedList && items.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <p className="w-full text-xs text-muted-foreground mb-1">Đã chọn ({items.length}):</p>
              {items.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1 pl-3 py-1.5 rounded-xl border-none bg-background shadow-sm">
                  {item.label}
                  <button onClick={() => handleRemoveItem(index)} className="hover:bg-destructive hover:text-white rounded-full p-0.5 ml-1 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-etechs-primary text-etechs-secondary font-bold rounded-xl h-11 px-8">Hoàn tất</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Dialog for Projects
export function EditProjectDialog({ 
  project, 
  onSave, 
  trigger,
  mode = 'edit'
}: { 
  project?: Project, 
  onSave: (project: Project) => void,
  trigger: React.ReactNode,
  mode?: 'add' | 'edit'
}) {
  const [formData, setFormData] = useState<Project>(project || {
    id: '',
    title: '',
    category: '',
    description: '',
    image_url: '',
    source_link: ''
  })
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    const dataToSave = mode === 'add' && !formData.id 
      ? { ...formData, id: crypto.randomUUID() } 
      : formData;
    
    onSave(dataToSave)
    setOpen(false)
    if (mode === 'add') {
      setFormData({
        id: '',
        title: '',
        category: '',
        description: '',
        image_url: '',
        source_link: ''
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Thêm dự án mới' : 'Chỉnh sửa dự án'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Tên dự án</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Phân loại</Label>
            <Input id="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Ví dụ: Nghiên cứu, Web App, Mobile" className="rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả dự án</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="rounded-xl min-h-[100px]" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imageUrl">URL hình ảnh minh họa</Label>
            <Input id="imageUrl" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="rounded-xl" placeholder="https://..." />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="sourceLink">Link mã nguồn/demo</Label>
            <Input id="sourceLink" value={formData.source_link} onChange={(e) => setFormData({...formData, source_link: e.target.value})} className="rounded-xl" placeholder="GitHub link..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-etechs-primary text-etechs-secondary font-bold rounded-xl h-11 px-8">Lưu dự án</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
