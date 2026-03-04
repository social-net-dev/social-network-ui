import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Shield, Trash2, Lock, Info, Calendar, Edit2, User as UserIcon, Globe, Users as UsersIcon, LockKeyhole, Loader2 } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useE2EEStore } from '@/stores/e2eeStore';
import { exportPrivateKey, importPrivateKey, encryptPrivateKeyWithPassphrase, decryptPrivateKeyWithPassphrase, saveKeyPair } from '@/features/message/lib/e2ee';
import { callBackupPrivateKey, callGetPrivateKeyBackup, callGetUserPublicKey } from '@/features/message/services/messageApi';
import { PassphraseModal } from '@/features/message/components/PassphraseModal';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { useUsersDeactivate } from '@/lib/api/hooks/users.hooks';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/lib/api/types';
import { privacyToFlatSettings } from '../lib/privacy';
import { DeactivateAccountDialog } from '../components/settings/DeactivateAccountDialog';

export function ProfileSettingsPage() {
  const { profile: rawProfile, isLoading, updatePrivacy, isUpdating } = useProfile();
  const profile = rawProfile as User;
  const [activeTab, setActiveTab] = useState('privacy');
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  // E2EE store is available via hooks when needed; not used directly here
  const [showPassModal, setShowPassModal] = useState(false);
  const [passMode, setPassMode] = useState<'create' | 'restore'>('create');
  const [_backupLoading, _setBackupLoading] = useState(false);


  const [privacySettings, setPrivacySettings] = useState({
    display_name_visibility: 'PUBLIC',
    birth_date_visibility: 'PRIVATE',
    bio_visibility: 'FRIENDS',
    avatar_visibility: 'PUBLIC',
  });

  useEffect(() => {
    if (!profile) return;

    if (profile.privacy) {
      const flat = privacyToFlatSettings(profile.privacy);
      setPrivacySettings({
        display_name_visibility: flat.display_name_visibility || 'PUBLIC',
        birth_date_visibility: flat.birth_date_visibility || 'PRIVATE',
        bio_visibility: flat.bio_visibility || 'FRIENDS',
        avatar_visibility: flat.avatar_visibility || 'PUBLIC',
      });
    }
  }, [profile]);

  const handlePrivacyChange = (field: string, value: string) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
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
    if (profile && profile.privacy) {
      const flat = privacyToFlatSettings(profile.privacy);
      setPrivacySettings({
        display_name_visibility: flat.display_name_visibility || 'PUBLIC',
        birth_date_visibility: flat.birth_date_visibility || 'PRIVATE',
        bio_visibility: flat.bio_visibility || 'FRIENDS',
        avatar_visibility: flat.avatar_visibility || 'PUBLIC',
      });
    }
  };

  const deactivateMutation = useUsersDeactivate({
    onSuccess: async () => {
      await logout();
      navigate('/login', { replace: true });
    },
    onError: (error: unknown) => {
      const e = error as { response?: { data?: { detail?: string; message?: string }; }; message?: string };
      setDeactivateError(e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Đã có lỗi xảy ra');
    },
  });

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etechs-primary"></div>
      </div>
    );
  }

  // Backup / Restore handlers (UI now shows sync-only action)
  const handleSync = async () => {
    const userId = useAuthStore.getState().getUserId();
    if (!userId) {
      alert('Không có user id');
      return;
    }

    try {
      _setBackupLoading(true);
      const resp = await callGetPrivateKeyBackup(userId).catch(() => null);
      const payload = resp?.data;
      const hasBackup = (p: any) => {
        if (!p) return false;
        if (Array.isArray(p.backups)) return p.backups.length > 0;
        if (typeof p === 'object' && (p.ciphertext || p.backup || p.payload)) return true;
        return false;
      };

      if (!hasBackup(payload)) {
        alert('Không tìm thấy bản backup trên server.');
      } else {
        // Prompt user to enter passphrase to restore now (do NOT persist passphrase)
        setPassMode('restore');
        setShowPassModal(true);
      }
    } catch (err) {
      console.error('Sync failed', err);
      alert('Đồng bộ thất bại');
    } finally {
      _setBackupLoading(false);
    }
  };

  const handlePassphraseSubmit = async (passphrase: string) => {
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
        // Do NOT persist passphrase on this device automatically
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
        // mark this device as having seen sync so ConversationPage won't re-prompt
        try {
          localStorage.setItem(`e2ee_sync_seen_${userId}`, '1');
        } catch (e) {
          console.warn('Failed to set e2ee_sync_seen after restore', e);
        }
        // Do NOT persist passphrase on this device automatically
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
    <div className="max-w-5xl mx-auto space-y-5 pb-32">
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Cài đặt</h1>
        <p className="text-muted-foreground text-sm">Quản lý quyền riêng tư và bảo mật tài khoản của bạn.</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Chỉnh sửa thông tin cá nhân</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Để cập nhật tên hiển thị, ảnh đại diện, giới thiệu, học vấn và thông tin cá nhân khác, vui lòng truy cập trang hồ sơ của bạn.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg gap-2 border-primary/30 hover:bg-primary/10"
            onClick={() => navigate('/profile/me')}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Đi tới trang hồ sơ
          </Button>
        </div>
      </div>

      <Tabs defaultValue="privacy" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-auto bg-transparent border-b border-border w-full justify-start mb-6 p-0 rounded-none">
          <TabsTrigger 
            value="privacy" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 gap-2 font-medium"
          >
            <Shield className="w-4 h-4" /> Quyền riêng tư
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 gap-2 font-medium"
          >
            <Lock className="w-4 h-4" /> Bảo mật
          </TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="outline-none space-y-5">
          <Card className="border border-border/50 shadow-sm bg-card rounded-xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold">Trung tâm quyền riêng tư</CardTitle>
              <CardDescription className="text-sm">Quyết định ai có thể xem thông tin của bạn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {privacyItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">Ai có thể xem {item.label.toLowerCase()} của bạn</p>
                    </div>
                  </div>
                  <Select
                    value={(privacySettings as any)[item.id]}
                    onValueChange={(v) => handlePrivacyChange(item.id, v)}
                  >
                    <SelectTrigger className="w-[180px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span>Mọi người</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="FRIENDS">
                        <div className="flex items-center gap-2">
                          <UsersIcon className="w-4 h-4" />
                          <span>Bạn bè</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="PRIVATE">
                        <div className="flex items-center gap-2">
                          <LockKeyhole className="w-4 h-4" />
                          <span>Chỉ mình tôi</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              <div className="mt-6 p-5 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm">Công cụ tìm kiếm</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Cho phép Google hiển thị hồ sơ của bạn.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="outline-none space-y-5">
          <Card className="p-6 rounded-xl shadow-sm border border-border/50">
            <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
            <ChangePasswordForm />
          </Card>
          <Card className="p-6 rounded-xl shadow-sm border border-red-200 dark:border-red-900/40 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Vô hiệu hóa tài khoản</h3>
                <p className="text-sm text-muted-foreground mt-1">Dữ liệu của bạn sẽ bị ẩn cho đến khi kích hoạt lại.</p>
              </div>
              <Button variant="destructive" onClick={() => setIsDeactivateOpen(true)} className="rounded-lg">
                Vô hiệu hóa
              </Button>
            </div>
          </Card>
          <Card className="p-6 rounded-xl shadow-sm border border-border/50">
            <h3 className="text-lg font-semibold mb-2">Sao lưu E2EE (Đồng bộ)</h3>
            <p className="text-sm text-muted-foreground mb-4">Kiểm tra và đồng bộ trạng thái backup private key trên server.</p>
            <div className="flex gap-3">
              <Button onClick={handleSync} disabled={_backupLoading} className="rounded-lg">
                {_backupLoading ? 'Đang xử lý...' : 'Đồng bộ'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 w-full bg-card/95 backdrop-blur-xl border-t border-border p-4 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={handleReset} disabled={isUpdating} className="flex items-center gap-2 text-muted-foreground hover:text-destructive rounded-lg">
            <Trash2 className="w-4 h-4" /> Hủy thay đổi
          </Button>
          <Button onClick={handleSavePrivacy} disabled={isUpdating} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-lg shadow-md flex items-center gap-2">
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
          </Button>
        </div>
      </div>

      <DeactivateAccountDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={(password) => deactivateMutation.mutate({ password })}
        isPending={deactivateMutation.isPending}
        error={deactivateError}
      />
      <PassphraseModal open={showPassModal} mode={passMode} onClose={() => setShowPassModal(false)} onSubmit={handlePassphraseSubmit} />
    </div>
  );
}
