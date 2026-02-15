import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, User as UserIcon, Shield, Trash2, Lock, AlertTriangle, Eye, EyeOff, Loader2, Info, Calendar } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useE2EEStore } from '@/stores/e2eeStore';
import { exportPrivateKey, importPrivateKey, encryptPrivateKeyWithPassphrase, decryptPrivateKeyWithPassphrase, saveKeyPair } from '@/features/message/lib/e2ee';
import { callBackupPrivateKey, callGetPrivateKeyBackup, callGetUserPublicKey } from '@/features/message/services/messageApi';
import { PassphraseModal } from '@/features/message/components/PassphraseModal';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { usersApi } from '@/lib/api/services/users';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/api/transforms';
import type { User } from '@/lib/api/types/user.types';

export function ProfileSettingsPage() {
  const { profile: rawProfile, isLoading, updateProfile, updatePrivacy, isUpdating } = useProfile();
  const profile = rawProfile as User;
  const [activeTab, setActiveTab] = useState('basic');
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [showDeactivatePassword, setShowDeactivatePassword] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  // E2EE store is available via hooks when needed; not used directly here
  const [showPassModal, setShowPassModal] = useState(false);
  const [passMode, setPassMode] = useState<'create' | 'restore'>('create');
  const [_backupLoading, _setBackupLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    birthDate: '',
    bio: '',
    school: '',
    class: '',
    location: '',
  });

  const [privacySettings, setPrivacySettings] = useState({
    display_name_visibility: 'PUBLIC',
    birth_date_visibility: 'PRIVATE',
    bio_visibility: 'FRIENDS',
    avatar_visibility: 'PUBLIC',
  });

  useEffect(() => {
    if (!profile) return;

    setFormData({
      username: profile.username || '',
      displayName: profile.displayName || '',
      birthDate: profile.birthDate || '',
      bio: profile.bio || '',
      school: profile.personalInfo?.school || '',
      class: profile.personalInfo?.class || '',
      location: profile.personalInfo?.location || '',
    });

    if (profile.privacy) {
      setPrivacySettings({
        display_name_visibility: profile.privacy.display_name_visibility || 'PUBLIC',
        birth_date_visibility: profile.privacy.birth_date_visibility || 'PRIVATE',
        bio_visibility: profile.privacy.bio_visibility || 'FRIENDS',
        avatar_visibility: profile.privacy.avatar_visibility || 'PUBLIC',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePrivacyChange = (field: string, value: string) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBasic = async () => {
    try {
      const bioPayload = JSON.stringify({
        ...(profile?.personalInfo || {}),
        bioText: formData.bio,
        school: formData.school,
        class: formData.class,
        location: formData.location,
      });

      await updateProfile({
        displayName: formData.displayName,
        username: formData.username,
        birthDate: formData.birthDate,
        bio: bioPayload,
      });
      alert('Cập nhật thành công!');
    } catch (error) {
      console.error(error);
      alert('Cập nhật thất bại!');
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await updatePrivacy(privacySettings as any);
      alert('Cập nhật quyền riêng tư thành công!');
    } catch (error) {
      console.error(error);
      alert('Cập nhật thất bại!');
    }
  };

  const handleReset = () => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        displayName: profile.displayName || '',
        birthDate: profile.birthDate || '',
        bio: profile.bio || '',
        school: profile.personalInfo?.school || '',
        class: profile.personalInfo?.class || '',
        location: profile.personalInfo?.location || '',
      });

      if (profile.privacy) {
        setPrivacySettings({
          display_name_visibility: profile.privacy.display_name_visibility || 'PUBLIC',
          birth_date_visibility: profile.privacy.birth_date_visibility || 'PRIVATE',
          bio_visibility: profile.privacy.bio_visibility || 'FRIENDS',
          avatar_visibility: profile.privacy.avatar_visibility || 'PUBLIC',
        });
      }
    }
  };

  const deactivateMutation = useMutation({
    mutationFn: () => usersApi.deactivate({ password: deactivatePassword }),
    onSuccess: async () => {
      await logout();
      navigate('/login', { replace: true });
    },
    onError: (error: any) => {
      setDeactivateError(getErrorMessage(error));
    },
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etechs-primary"></div>
      </div>
    );
  }

  // Backup / Restore handlers (currently commented out in UI - kept for future use)
  /* Temporarily disabled - uncomment when backup feature is re-enabled
  const handleOpenBackup = () => {
    setPassMode('create');
    setShowPassModal(true);
  };

  const handleOpenRestore = () => {
    setPassMode('restore');
    setShowPassModal(true);
  };
  */

  const handlePassphraseSubmit = async (passphrase: string, remember: boolean) => {
    const userId = useAuthStore.getState().getUserId();
    if (!userId) {
      alert('Không có user id');
      return;
    }

    if (passMode === 'create') {
      const keyPair = useE2EEStore.getState().keyPair;
      if (!keyPair) {
        alert('Không tìm thấy private key trên thiết bị. Vui lòng mở Messages để khởi tạo khóa trước.');
        return;
      }

      try {
        _setBackupLoading(true);
        const exported = await exportPrivateKey(keyPair.privateKey);
        const payload = await encryptPrivateKeyWithPassphrase(exported, passphrase);
        await callBackupPrivateKey(userId, payload);
        if (remember) sessionStorage.setItem(`e2ee_passphrase_${userId}`, passphrase);
        alert('Backup private key thành công');
      } catch (err) {
        console.error('Backup failed', err);
        alert('Backup thất bại: ' + (err as any).message);
      } finally {
        _setBackupLoading(false);
        setShowPassModal(false);
      }
    } else {
      // restore
      try {
        _setBackupLoading(true);
        const resp = await callGetPrivateKeyBackup(userId);
        if (!resp || !resp.data) throw new Error('No backup found');
        const payload = resp.data;
        const exportedBase64 = await decryptPrivateKeyWithPassphrase(payload, passphrase);
        const privateKey = await importPrivateKey(exportedBase64);

        // fetch public key from server to pair
        const pubResp = await callGetUserPublicKey(userId);
        const pubStr = pubResp?.data?.public_key || (typeof pubResp?.data === 'string' ? pubResp.data : undefined);
        let publicCrypto: CryptoKey | null = null;
        if (pubStr) {
          publicCrypto = await (await import('@/features/message/lib/e2ee')).importPublicKey(pubStr);
        }

        if (!publicCrypto) throw new Error('Public key not found on server to pair with restored private key');

        await saveKeyPair({ publicKey: publicCrypto, privateKey }, userId);
        // reinitialize store
        await useE2EEStore.getState().initialize(userId);
        if (remember) sessionStorage.setItem(`e2ee_passphrase_${userId}`, passphrase);
        alert('Khôi phục private key thành công');
      } catch (err) {
        console.error('Restore failed', err);
        alert('Khôi phục thất bại: ' + (err as any).message);
      } finally {
        _setBackupLoading(false);
        setShowPassModal(false);
      }
    }
  };

  const privacyItems = [
    { id: 'display_name_visibility', label: 'Tên hiển thị', icon: UserIcon },
    { id: 'avatar_visibility', label: 'Ảnh đại diện', icon: UserIcon },
    { id: 'birth_date_visibility', label: 'Ngày sinh', icon: Calendar },
    { id: 'bio_visibility', label: 'Giới thiệu bản thân', icon: Info },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Cài đặt hồ sơ</h1>
        <p className="text-gray-500 dark:text-gray-400">Quản lý chi tiết cá nhân và quyền riêng tư của bạn.</p>
      </div>

      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white dark:bg-card p-1 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 w-full justify-start mb-8 overflow-x-auto no-scrollbar">
          <TabsTrigger value="basic" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
            <UserIcon className="w-4 h-4 mr-2" /> Thông tin cơ bản
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
            <Shield className="w-4 h-4 mr-2" /> Quyền riêng tư
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
            <Lock className="w-4 h-4 mr-2" /> Bảo mật
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="outline-none">
          <Card className="border-none shadow-xl bg-white dark:bg-card rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật định danh và thông tin hiển thị của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={formData.username} onChange={handleInputChange} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Tên hiển thị</Label>
                  <Input id="displayName" value={formData.displayName} onChange={handleInputChange} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Ngày sinh</Label>
                <Input id="birthDate" type="date" value={formData.birthDate} onChange={handleInputChange} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Giới thiệu bản thân</Label>
                <textarea id="bio" value={formData.bio} onChange={handleInputChange} rows={4} className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-etechs-primary outline-none resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school">Trường học</Label>
                  <Input id="school" value={formData.school} onChange={handleInputChange} className="rounded-xl" placeholder="VD: Đại học Bách Khoa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Lớp / Khóa</Label>
                  <Input id="class" value={formData.class} onChange={handleInputChange} className="rounded-xl" placeholder="VD: K65-HEDSPI" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Vị trí</Label>
                <Input id="location" value={formData.location} onChange={handleInputChange} className="rounded-xl" placeholder="VD: Hà Nội, Việt Nam" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="outline-none space-y-6">
          <Card className="border-none shadow-xl bg-white dark:bg-card rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle>Trung tâm quyền riêng tư</CardTitle>
              <CardDescription>Quyết định ai có thể xem thông tin của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-white/5">
                  <TableRow>
                    <TableHead className="w-[300px] px-6">Danh mục</TableHead>
                    <TableHead className="text-center">Mọi người</TableHead>
                    <TableHead className="text-center">Bạn bè</TableHead>
                    <TableHead className="text-center">Chỉ mình tôi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {privacyItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="px-6 font-medium">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-gray-400" />
                          {item.label}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <RadioGroup value={(privacySettings as any)[item.id]} onValueChange={v => handlePrivacyChange(item.id, v)} className="flex justify-center">
                          <RadioGroupItem value="PUBLIC" />
                        </RadioGroup>
                      </TableCell>
                      <TableCell className="text-center">
                        <RadioGroup value={(privacySettings as any)[item.id]} onValueChange={v => handlePrivacyChange(item.id, v)} className="flex justify-center">
                          <RadioGroupItem value="FRIENDS" />
                        </RadioGroup>
                      </TableCell>
                      <TableCell className="text-center">
                        <RadioGroup value={(privacySettings as any)[item.id]} onValueChange={v => handlePrivacyChange(item.id, v)} className="flex justify-center">
                          <RadioGroupItem value="PRIVATE" />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="m-6 p-6 rounded-2xl bg-etechs-primary/10 border border-etechs-primary/20 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">Công cụ tìm kiếm</h4>
                  <p className="text-sm text-muted-foreground">Cho phép Google hiển thị hồ sơ của bạn.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="outline-none space-y-6">
          <Card className="p-6 rounded-3xl shadow-xl border-none">
            <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
            <ChangePasswordForm />
          </Card>
          <Card className="p-6 rounded-3xl shadow-xl border border-red-100 dark:border-red-900/40 bg-white dark:bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-600">Vô hiệu hóa tài khoản</h3>
                <p className="text-sm text-gray-500">Dữ liệu của bạn sẽ bị ẩn cho đến khi kích hoạt lại.</p>
              </div>
              <Button variant="destructive" onClick={() => setIsDeactivateOpen(true)}>
                Vô hiệu hóa
              </Button>
            </div>
          </Card>
          {/* <Card className="p-6 rounded-3xl shadow-xl border-none">
            <h3 className="text-lg font-semibold mb-4">Sao lưu E2EE (Backup)</h3>
            <p className="text-sm text-gray-500 mb-4">Sao lưu private key đã mã hoá lên server để phục hồi trên thiết bị khác.</p>
            <div className="flex gap-3">
              <Button onClick={handleOpenBackup} disabled={backupLoading} className="rounded-xl">
                {backupLoading ? 'Đang xử lý...' : 'Backup now'}
              </Button>
              <Button variant="outline" onClick={handleOpenRestore} disabled={backupLoading} className="rounded-xl">
                Restore from backup
              </Button>
            </div>
          </Card> */}
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-card/80 backdrop-blur-xl border-t p-4 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={handleReset} disabled={isUpdating} className="flex items-center gap-2 text-gray-500 hover:text-red-500">
            <Trash2 className="w-4 h-4" /> Hủy thay đổi
          </Button>
          <Button onClick={activeTab === 'basic' ? handleSaveBasic : handleSavePrivacy} disabled={isUpdating} className="bg-etechs-primary text-etechs-secondary px-8 rounded-xl shadow-lg flex items-center gap-2">
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
          </Button>
        </div>
      </div>

      {isDeactivateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-card p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 border border-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Xác nhận vô hiệu hóa</h3>
                <p className="text-sm text-gray-500">Bạn sẽ bị đăng xuất ngay lập tức. Vui lòng nhập mật khẩu để xác nhận.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu xác nhận</Label>
              <div className="relative">
                <Input type={showDeactivatePassword ? 'text' : 'password'} value={deactivatePassword} onChange={e => setDeactivatePassword(e.target.value)} placeholder="Nhập mật khẩu..." className="pr-10" />
                <button type="button" onClick={() => setShowDeactivatePassword(!showDeactivatePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showDeactivatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={confirmDeactivate} onChange={e => setConfirmDeactivate(e.target.checked)} className="mt-1" />
              <span>Tôi xác nhận và hiểu rằng dữ liệu sẽ bị ẩn.</span>
            </label>
            {deactivateError && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/40">{deactivateError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDeactivateOpen(false)} className="rounded-xl">
                Hủy
              </Button>
              <Button variant="destructive" onClick={() => deactivateMutation.mutate()} disabled={!deactivatePassword || !confirmDeactivate || deactivateMutation.isPending} className="rounded-xl">
                {deactivateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Xác nhận vô hiệu hóa
              </Button>
            </div>
          </div>
        </div>
      )}
      <PassphraseModal open={showPassModal} mode={passMode} onClose={() => setShowPassModal(false)} onSubmit={handlePassphraseSubmit} />
    </div>
  );
}
