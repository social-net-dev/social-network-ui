import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Edit2, Share2, MapPin, BadgeCheck, School, PlusCircle, 
  BookOpen, Heart, Camera, Terminal,   Bike, Gamepad2, Globe
} from 'lucide-react'
import { 
  EditBasicInfoDialog, 
  EditAcademicBackgroundDialog, 
  EditInterestsDialog, 
  EditProjectDialog,
  type Project
} from '../components/EditProfileDialogs'

export function PersonalProfilePage() {
  const { profile, updateProfile, isLoading } = useProfile()
  
  // --- State for Profile Sections ---

  const [userInfo, setUserInfo] = useState({
    displayName: "User",
    username: "",
    birthDate: "",
    role: "Member",
    location: "Vietnam",
    bio: "Welcome to my profile!",
    avatarUrl: "https://github.com/shadcn.png"
  })

  useEffect(() => {
    if (profile) {
      setUserInfo(prev => ({
        ...prev,
        displayName: profile.displayName || prev.displayName,
        username: profile.username || prev.username,
        birthDate: profile.birthDate || prev.birthDate,
        role: profile.role || prev.role,
        bio: profile.bio || prev.bio,
        avatarUrl: profile.avatar || prev.avatarUrl
      }))
    }
  }, [profile])

  const [academicBackground, setAcademicBackground] = useState({
    institution: "University of Technology",
    degree: "Bachelor",
    major: "Computer Science",
    graduationYear: "2024",
    logoUrl: "https://ui-avatars.com/api/?name=UT&background=random"
  })

  const [academicInterests, setAcademicInterests] = useState([
    { label: "Machine Learning", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800" },
    { label: "Human-Computer Interaction", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
    { label: "Computational Linguistics", color: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800" },
    { label: "Data Structures", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
    { label: "Quantum Computing", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
    { label: "UI/UX Principles", color: "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800" },
  ])

  const [personalInterests, setPersonalInterests] = useState([
    { label: "Photography", icon: Camera },
    { label: "Open Source Coding", icon: Terminal },
    { label: "Cycling", icon: Bike },
    { label: "Strategy Games", icon: Gamepad2 },
    { label: "Travel Photography", icon: Globe },
  ])

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      category: "Independent Research",
      title: "Neural Network Optimization for Edge Devices",
      description: "Developed a novel pruning technique reducing memory footprint by 40% while maintaining 98% accuracy on benchmark datasets.",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj50MGZO9v0EAyTv-4LtsO8Uow44gB_Hz8qoVd0uf4-4_KDWlt0PGQcF830eG2Y0L7_B9lYWSSz4sj7hOHvrlj_fQ2MDMGoWDsA0xMVCQn_NjNtx8wMkWcb3booNnd6sH3DH7XWD1kMHU8F4IB3__zvtAq_J6b-al2RCQWdjVB8qkcBzoUC84WeCtVtJdOMeueHFHvCZ4BdwGKmuWhng4HG0NaxYD42fn6uLZM6BZbYzRo29Da8cPF9vdSt7XtaDVrGobmy2Mx0LpE",
      sourceLink: "#"
    }
  ])

  // --- Handlers ---
  const handleUpdateUserInfo = async (newData: any) => {
    try {
      // Call API to update profile
      const updatedProfile = await updateProfile({
        displayName: newData.displayName,
        username: newData.username,
        birthDate: newData.birthDate,
        bio: newData.bio
      })
      
      // Update local state with API response + local fields (like location/role if not in API)
      setUserInfo(prev => ({
        ...prev,
        displayName: updatedProfile.displayName,
        username: updatedProfile.username || prev.username,
        birthDate: updatedProfile.birthDate || prev.birthDate,
        bio: updatedProfile.bio || prev.bio,
        location: newData.location || prev.location // Keep location local
      }))
    } catch (error) {
      console.error("Failed to update profile:", error)
      // Optionally show toast error here
    }
  }

  const handleUpdateAcademicBackground = (newData: any) => {
    setAcademicBackground({ ...academicBackground, ...newData })
  }

  const handleUpdateAcademicInterests = (newInterests: any) => {
    setAcademicInterests(newInterests)
  }

  const handleUpdatePersonalInterests = (newInterests: any) => {
    // For simplicity, we just assume new items get a default icon if not present
    // Ideally we'd have an icon picker
    const updated = newInterests.map((item: any) => ({
        ...item,
        icon: item.icon || Heart // Default icon
    }))
    setPersonalInterests(updated)
  }

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => {
        const index = prev.findIndex(p => p.id === updatedProject.id)
        if (index >= 0) {
            const newProjects = [...prev]
            newProjects[index] = updatedProject
            return newProjects
        } else {
            return [...prev, updatedProject]
        }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etechs-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-10 lg:px-40 py-8 space-y-8">
        
        {/* Profile Header Section */}
        <section className="bg-white dark:bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-between">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative">
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white dark:border-background shadow-xl overflow-hidden">
                  <img 
                    src={userInfo.avatarUrl}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-2 right-2 bg-etechs-primary text-etechs-secondary p-1 rounded-full border-2 border-white dark:border-background">
                  <BadgeCheck className="w-5 h-5 fill-current" />
                </div>
              </div>
              
              <div className="text-center md:text-left space-y-2">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{userInfo.displayName}</h1>
                  <p className="text-muted-foreground text-lg font-medium">{userInfo.role}</p>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{userInfo.location}</span>
                </div>
                {userInfo.bio && <p className="text-sm text-muted-foreground max-w-md">{userInfo.bio}</p>}
              </div>
            </div>
            
            <div className="flex gap-3">
              <EditBasicInfoDialog 
                initialData={userInfo} 
                onSave={handleUpdateUserInfo}
                trigger={
                  <Button className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 rounded-xl h-11 px-6 font-bold shadow-md shadow-primary/20 transition-all">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                }
              />
              <Button variant="outline" className="rounded-xl h-11 w-11 p-0 bg-secondary/50 border-0 hover:bg-secondary transition-all">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Grid Layout for Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Academic Background Card */}
          <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white dark:bg-card">
              <div className="flex items-center gap-2">
                <School className="w-6 h-6 text-etechs-primary" />
                <CardTitle className="text-xl font-bold">Academic Background</CardTitle>
              </div>
              <EditAcademicBackgroundDialog
                data={academicBackground}
                onSave={handleUpdateAcademicBackground}
                trigger={
                  <Button variant="ghost" size="icon" className="text-etechs-primary hover:bg-etechs-primary/10 rounded-lg">
                    <Edit2 className="w-5 h-5" />
                  </Button>
                }
              />
            </CardHeader>
            <CardContent className="space-y-4 pt-4 bg-white dark:bg-card">
              <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-xl border-l-4 border-etechs-primary">
                <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm shrink-0">
                  <img 
                    alt="University Logo" 
                    className="w-full h-full object-contain" 
                    src={academicBackground.logoUrl}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-etechs-primary">{academicBackground.degree}</p>
                  <p className="text-lg font-extrabold">{academicBackground.institution}</p>
                  <p className="text-muted-foreground text-sm font-medium">{academicBackground.major}</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary/50 transition-all group">
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-etechs-primary transition-colors">
                  <PlusCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">Add previous education</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Interests Card */}
          <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white dark:bg-card">
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-etechs-primary" />
                <CardTitle className="text-xl font-bold">Academic Interests</CardTitle>
              </div>
              <EditInterestsDialog
                title="Academic Interests"
                interests={academicInterests}
                onSave={handleUpdateAcademicInterests}
                trigger={
                    <Button variant="ghost" size="icon" className="text-etechs-primary hover:bg-etechs-primary/10 rounded-lg">
                        <Edit2 className="w-5 h-5" />
                    </Button>
                }
              />
            </CardHeader>
            <CardContent className="pt-4 bg-white dark:bg-card">
              <div className="flex flex-wrap gap-2">
                {academicInterests.map((tag) => (
                  <Badge 
                    key={tag.label} 
                    variant="outline" 
                    className={`px-4 py-2 rounded-full text-sm font-bold border ${tag.color || "bg-secondary/20"} hover:brightness-95 transition-all`}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personal Interests Card */}
          <Card className="rounded-xl border border-border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white dark:bg-card">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-etechs-primary" />
                <CardTitle className="text-xl font-bold">Personal Interests</CardTitle>
              </div>
              <EditInterestsDialog
                title="Personal Interests"
                interests={personalInterests}
                onSave={handleUpdatePersonalInterests}
                trigger={
                    <Button variant="ghost" size="icon" className="text-etechs-primary hover:bg-etechs-primary/10 rounded-lg">
                        <Edit2 className="w-5 h-5" />
                    </Button>
                }
              />
            </CardHeader>
            <CardContent className="pt-4 bg-white dark:bg-card">
              <div className="flex flex-wrap gap-2">
                {personalInterests.map((interest) => {
                  const Icon = interest.icon || Heart
                  return (
                    <div 
                        key={interest.label}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-xl border border-border hover:border-etechs-primary/50 cursor-default transition-all group"
                    >
                        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-etechs-primary transition-colors" />
                        <span className="text-sm font-bold">{interest.label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Profile Completion Sidebar/Info */}
          <div className="bg-etechs-primary/5 dark:bg-etechs-primary/10 rounded-xl p-6 border-2 border-etechs-primary/20 shadow-inner flex flex-col justify-center h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Profile Strength</h3>
              <span className="text-etechs-primary font-black">85%</span>
            </div>
            <Progress value={85} className="h-3 bg-secondary/20" indicatorClassName="bg-etechs-primary" />
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              You're almost there! Add a <strong>professional summary</strong> and <strong>past projects</strong> to reach 100% and get noticed by study groups.
            </p>
            <Button className="mt-6 w-full h-11 bg-background text-foreground font-bold border border-border hover:border-etechs-primary hover:text-etechs-primary transition-all">
              Complete Profile
            </Button>
          </div>

        </div>

        {/* Highlighted Projects Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-bold">Highlighted Projects</h2>
             <EditProjectDialog
                mode="add"
                onSave={handleUpdateProject}
                trigger={
                    <Button variant="outline" className="gap-2">
                        <PlusCircle className="w-4 h-4" /> Add Project
                    </Button>
                }
             />
          </div>
          
          <div className="space-y-6">
            {projects.map(project => (
                <div key={project.id} className="flex flex-col md:flex-row items-stretch justify-between gap-6 bg-white dark:bg-card rounded-2xl p-6 border border-border shadow-sm">
                    <div className="flex flex-[3_3_0px] flex-col gap-4 justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-etechs-primary text-sm font-bold uppercase tracking-wider">{project.category}</p>
                        <h3 className="text-2xl font-extrabold leading-tight">{project.title}</h3>
                        <p className="text-muted-foreground text-base font-medium mt-2 leading-relaxed">
                        {project.description}
                        </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button variant="ghost" className="bg-etechs-primary/20 text-etechs-secondary dark:text-etechs-primary hover:bg-etechs-primary/30 font-bold rounded-xl h-10 px-4 transition-all">
                        <Terminal className="w-5 h-5 mr-2" />
                        View Source
                        </Button>
                        <EditProjectDialog
                            project={project}
                            onSave={handleUpdateProject}
                            trigger={
                                <Button variant="outline" className="font-bold rounded-xl h-10 px-4 bg-secondary/50 border-0 hover:bg-secondary transition-all">
                                <Edit2 className="w-5 h-5 mr-2" />
                                Edit
                                </Button>
                            }
                        />
                    </div>
                    </div>
                    <div className="flex-1 min-h-[160px] md:max-w-[320px] rounded-xl shadow-lg border border-border overflow-hidden">
                    <img 
                        src={project.imageUrl} 
                        alt="Project Thumbnail" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    </div>
                </div>
            ))}
          </div>
        </section>

      </div>
  )
}
