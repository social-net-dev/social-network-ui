import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Interfaces for our mock data
export interface AcademicBackground {
  institution: string
  degree: string
  major: string
  graduationYear: string
  logoUrl?: string
}

export interface Project {
  id: string
  title: string
  category: string
  description: string
  imageUrl: string
  sourceLink?: string
}

export interface Interest {
  label: string
  color?: string
  icon?: any // For simplicity with Lucide icons
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile Info</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="displayName" className="text-right">Display Name</Label>
            <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData({...formData, displayName: e.target.value})} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">Username</Label>
            <Input id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="birthDate" className="text-right">Birth Date</Label>
             <Input id="birthDate" type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">Location</Label>
            <Input id="location" value={formData.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} className="col-span-3" placeholder="(Not saved to API)" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">Bio</Label>
            <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
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
  data: AcademicBackground, 
  onSave: (data: AcademicBackground) => void,
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
          <DialogTitle>Edit Education</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="institution">Institution</Label>
            <Input id="institution" value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="degree">Degree</Label>
            <Input id="degree" value={formData.degree} onChange={(e) => setFormData({...formData, degree: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="major">Major</Label>
            <Input id="major" value={formData.major} onChange={(e) => setFormData({...formData, major: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="year">Graduation Year</Label>
            <Input id="year" value={formData.graduationYear} onChange={(e) => setFormData({...formData, graduationYear: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Education</Button>
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
      // Assign a random color for variety if none provided
      const colors = [
        "bg-red-100 text-red-800 border-red-200",
        "bg-green-100 text-green-800 border-green-200",
        "bg-blue-100 text-blue-800 border-blue-200",
        "bg-yellow-100 text-yellow-800 border-yellow-200",
        "bg-purple-100 text-purple-800 border-purple-200",
      ]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      setItems([...items, { label: newItem, color: randomColor }])
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Add new interest..." 
              value={newItem} 
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button onClick={handleAddItem} size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[100px] border rounded-md p-2 bg-muted/20">
            {items.map((item, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1 pr-1">
                {item.label}
                <button onClick={() => handleRemoveItem(index)} className="hover:bg-muted rounded-full p-0.5 ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {items.length === 0 && <span className="text-muted-foreground text-sm p-2">No interests added yet.</span>}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Interests</Button>
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
    imageUrl: 'https://via.placeholder.com/300',
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
        imageUrl: 'https://via.placeholder.com/300',
        sourceLink: ''
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Project' : 'Edit Project'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Project Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="e.g. Research, Web App, Mobile" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="sourceLink">Source/Demo Link</Label>
            <Input id="sourceLink" value={formData.sourceLink} onChange={(e) => setFormData({...formData, sourceLink: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
