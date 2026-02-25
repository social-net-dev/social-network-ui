import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, Save, User as UserIcon, School, Heart } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { getDefaultAvatar } from '@/lib/utils/api';
import type { User } from '@/lib/api/generated/model';
import { toast } from 'sonner';

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileSheet({ open, onOpenChange }: EditProfileSheetProps) {
  const { profile: rawProfile, updateProfile, uploadAvatar, isUpdating, isLoading } = useProfile();
  const profile = rawProfile as User | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    birthDate: '',
    bio: '',
    location: '',
    school: '',
    class: '',
    major: '',
  });

  useEffect(() => {
    if (!profile) return;
    setFormData({
      displayName: profile.displayName || '',
      username: profile.username || '',
      birthDate: profile.birthDate || '',
      bio: profile.bio || '',
      location: profile.personalInfo?.location || '',
      school: profile.personalInfo?.school || '',
      class: profile.personalInfo?.class || '',
      major: profile.personalInfo?.major || '',
    });
  }, [profile, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        display_name: formData.displayName,
        username: formData.username,
        birth_date: formData.birthDate && formData.birthDate.trim() !== '' ? formData.birthDate : undefined,
        bio: formData.bio,
        personal_info: {
          ...(profile?.personalInfo || {}),
          location: formData.location,
          school: formData.school,
          class: formData.class,
          major: formData.major,
        },
      });
      toast.success('Cập nhật hồ sơ thành công!');
      onOpenChange(false);
    } catch {
      toast.error('Cập nhật thất bại, vui lòng thử lại.');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success('Cập nhật ảnh đại diện thành công!');
    } catch {
      toast.error('Tải lên ảnh đại diện thất bại.');
    }
  };

  if (isLoading || !profile) return null;

  const initials = profile.displayName ? profile.displayName.slice(0, 2).toUpperCase() : '?';
  const fallbackAvatar = getDefaultAvatar();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold">Chỉnh sửa hồ sơ</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 flex-1">
          {/* Avatar section */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-xl">
            <div className="relative shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <Avatar
                className="w-16 h-16 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <AvatarImage src={profile.avatar || fallbackAvatar} alt={profile.displayName} className="object-cover" />
                <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : initials}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute bottom-0 right-0 p-1 bg-etechs-primary text-etechs-secondary rounded-full border-2 border-background cursor-pointer hover:scale-110 transition-transform"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-3 h-3" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">{profile.displayName}</p>
              <p className="text-xs text-muted-foreground mb-2">@{profile.username}</p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs rounded-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdating}
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                Đổi ảnh đại diện
              </Button>
            </div>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="h-auto bg-transparent border-b border-border w-full justify-start mb-5 p-0 rounded-none">
              <TabsTrigger value="basic" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2.5 gap-1.5 text-xs font-medium">
                <UserIcon className="w-3.5 h-3.5" />
                Cơ bản
              </TabsTrigger>
              <TabsTrigger value="education" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-2.5 gap-1.5 text-xs font-medium">
                <School className="w-3.5 h-3.5" />
                Học vấn
              </TabsTrigger>
            </TabsList>

            {/* Basic info tab */}
            <TabsContent value="basic" className="outline-none space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-xs font-medium">Tên hiển thị</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="rounded-lg h-9 text-sm"
                    placeholder="Tên của bạn"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-medium">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="rounded-lg h-9 text-sm"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthDate" className="text-xs font-medium">Ngày sinh</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="rounded-lg h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-medium">Vị trí</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="rounded-lg h-9 text-sm"
                  placeholder="VD: Hà Nội, Việt Nam"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio" className="text-xs font-medium">Giới thiệu bản thân</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Viết vài dòng về bản thân..."
                />
              </div>
            </TabsContent>

            {/* Education tab */}
            <TabsContent value="education" className="outline-none space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="school" className="text-xs font-medium">Trường học</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="rounded-lg h-9 text-sm"
                  placeholder="VD: Đại học Bách Khoa Hà Nội"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="major" className="text-xs font-medium">Chuyên ngành</Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={handleChange}
                    className="rounded-lg h-9 text-sm"
                    placeholder="VD: Khoa học máy tính"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="class" className="text-xs font-medium">Lớp / Khóa</Label>
                  <Input
                    id="class"
                    value={formData.class}
                    onChange={handleChange}
                    className="rounded-lg h-9 text-sm"
                    placeholder="VD: K65-CS1"
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Sở thích & Lĩnh vực quan tâm</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chỉnh sửa sở thích và lĩnh vực quan tâm trong tab <strong>Giới thiệu</strong> trên trang hồ sơ.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            className="flex-1 rounded-lg"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
