import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@/features/home/types/feed.types'

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
  data: { school: string, degree: string, major: string, graduationYear: string }, 
  onSave: (data: any) => void,
  trigger: React.ReactNode
}) {
  const [formData, setFormData] = useState(data)
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    onSave(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa học vấn</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="school">Trường học</Label>
            <Input id="school" value={formData.school} onChange={(e) => setFormData({...formData, school: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="degree">Bằng cấp/Vị trí</Label>
            <Input id="degree" value={formData.degree} onChange={(e) => setFormData({...formData, degree: e.target.value})} placeholder="Ví dụ: Cử nhân, Sinh viên, Giảng viên" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="major">Chuyên ngành</Label>
            <Input id="major" value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year">Năm tốt nghiệp (dự kiến)</Label>
            <Input id="year" value={formData.graduationYear} onChange={(e) => setFormData({...formData, graduationYear: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-etechs-primary text-etechs-secondary">Lưu thông tin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Dialog for Interests (Tags)
export function EditInterestsDialog({ 
  title,
  interests, 
  onSave, 
  trigger 
}: { 
  title: string,
  interests: { label: string, color?: string }[], 
  onSave: (interests: { label: string, color?: string }[]) => void,
  trigger: React.ReactNode
}) {
  const [items, setItems] = useState(interests)
  const [newItem, setNewItem] = useState('')
  const [open, setOpen] = useState(false)

  const handleAddItem = () => {
    if (newItem.trim()) {
      setItems([...items, { label: newItem }])
      setNewItem('')
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
    imageUrl: '',
    sourceLink: ''
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
        imageUrl: '',
        sourceLink: ''
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
            <Input id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="rounded-xl" placeholder="https://..." />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="sourceLink">Link mã nguồn/demo</Label>
            <Input id="sourceLink" value={formData.sourceLink} onChange={(e) => setFormData({...formData, sourceLink: e.target.value})} className="rounded-xl" placeholder="GitHub link..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-etechs-primary text-etechs-secondary font-bold rounded-xl h-11 px-8">Lưu dự án</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
