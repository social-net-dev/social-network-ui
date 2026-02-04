import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
    Save,
    User,
    Shield,
    Trash2,
    Lock,
    AlertTriangle,
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";

import { useProfile } from "../hooks/useProfile";
import { ChangePasswordForm } from "../components/ChangePasswordForm";
import { deactivateAccount } from "@/lib/api/manual-apis";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/lib/api/transforms";

export function ProfileSettingsPage() {
    const { profile, isLoading, updateProfile, updatePrivacy, isUpdating } = useProfile();
    const [activeTab, setActiveTab] = useState("basic");
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
    const [deactivatePassword, setDeactivatePassword] = useState("");
    const [showDeactivatePassword, setShowDeactivatePassword] = useState(false);
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);
    const [deactivateError, setDeactivateError] = useState<string | null>(null);
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        birthDate: '',
        bio: ''
    });

    const [privacySettings, setPrivacySettings] = useState({
        displayNameVisibility: 'PUBLIC',
        birthDateVisibility: 'PRIVATE',
        bioVisibility: 'FRIENDS',
        avatarVisibility: 'PUBLIC',
    });

    useEffect(() => {
        if (!profile) return;

        setFormData({
            username: profile.username || '',
            displayName: profile.displayName || '',
            birthDate: profile.birthDate || '',
            bio: profile.bio || ''
        });

        if (profile.privacy) {
            setPrivacySettings({
                displayNameVisibility: profile.privacy.displayNameVisibility || 'PUBLIC',
                birthDateVisibility: profile.privacy.birthDateVisibility || 'PRIVATE',
                bioVisibility: profile.privacy.bioVisibility || 'FRIENDS',
                avatarVisibility: profile.privacy.avatarVisibility || 'PUBLIC',
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
            await updateProfile({
                displayName: formData.displayName,
                username: formData.username,
                birthDate: formData.birthDate,
                bio: formData.bio,
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
                bio: profile.bio || ''
            });

            if (profile.privacy) {
                setPrivacySettings({
                    displayNameVisibility: profile.privacy.displayNameVisibility || 'PUBLIC',
                    birthDateVisibility: profile.privacy.birthDateVisibility || 'PRIVATE',
                    bioVisibility: profile.privacy.bioVisibility || 'FRIENDS',
                    avatarVisibility: profile.privacy.avatarVisibility || 'PUBLIC',
                });
            }
        }
    };

    const deactivateMutation = useMutation({
        mutationFn: () => deactivateAccount(deactivatePassword),
        onSuccess: async () => {
            await logout();
            navigate("/login", { replace: true });
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

    const privacyItems = [
        { id: 'displayNameVisibility', label: 'Tên hiển thị' },
        { id: 'avatarVisibility', label: 'Ảnh đại diện' },
        { id: 'birthDateVisibility', label: 'Ngày sinh' },
        { id: 'bioVisibility', label: 'Giới thiệu bản thân' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink href="/">Trang chủ</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbLink href="/profile">Hồ sơ</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem><BreadcrumbPage>Cài đặt</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Cài đặt hồ sơ</h1>
                    <p className="text-gray-500 dark:text-gray-400">Quản lý chi tiết cá nhân và quyền riêng tư của bạn.</p>
                </div>

                <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white dark:bg-card p-1 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 w-full justify-start mb-8 overflow-x-auto">
                        <TabsTrigger value="basic" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
                            <User className="w-4 h-4 mr-2" /> Thông tin cơ bản
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
                            <Shield className="w-4 h-4 mr-2" /> Quyền riêng tư
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
                            <Lock className="w-4 h-4 mr-2" /> Bảo mật
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="outline-none">
                        <Card className="border-none shadow-xl bg-white dark:bg-card rounded-3xl p-6 space-y-6">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle>Thông tin cá nhân</CardTitle>
                                <CardDescription>Cập nhật định danh và thông tin hiển thị của bạn.</CardDescription>
                            </CardHeader>
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
                                <Label htmlFor="bio">Giới thiệu</Label>
                                <textarea id="bio" value={formData.bio} onChange={handleInputChange} rows={4} className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-3 outline-none resize-none" />
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="privacy" className="outline-none">
                        <Card className="border-none shadow-xl bg-white dark:bg-card rounded-3xl p-0 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-white/5">
                                    <TableRow>
                                        <TableHead className="px-6">Danh mục</TableHead>
                                        <TableHead className="text-center">Mọi người</TableHead>
                                        <TableHead className="text-center">Bạn bè</TableHead>
                                        <TableHead className="text-center">Chỉ mình tôi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {privacyItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="px-6 font-medium">{item.label}</TableCell>
                                            <TableCell className="text-center">
                                                <RadioGroup value={(privacySettings as any)[item.id]} onValueChange={(v) => handlePrivacyChange(item.id, v)} className="flex justify-center">
                                                    <RadioGroupItem value="PUBLIC" />
                                                </RadioGroup>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <RadioGroup value={(privacySettings as any)[item.id]} onValueChange={(v) => handlePrivacyChange(item.id, v)} className="flex justify-center">
                                                    <RadioGroupItem value="FRIENDS" />
                                                </RadioGroup>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <RadioGroup value={(privacySettings as any)[item.id]} onValueChange={(v) => handlePrivacyChange(item.id, v)} className="flex justify-center">
                                                    <RadioGroupItem value="PRIVATE" />
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="outline-none space-y-6">
                        <Card className="p-6 rounded-3xl shadow-xl">
                            <h3 className="text-lg font-semibold mb-4">Đổi mật khẩu</h3>
                            <ChangePasswordForm />
                        </Card>
                        <Card className="p-6 rounded-3xl shadow-xl border-red-100 dark:border-red-900/40">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-red-600">Vô hiệu hóa tài khoản</h3>
                                    <p className="text-sm text-gray-500">Dữ liệu của bạn sẽ bị ẩn cho đến khi kích hoạt lại.</p>
                                </div>
                                <Button variant="destructive" onClick={() => setIsDeactivateOpen(true)}>Vô hiệu hóa</Button>
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-card/80 backdrop-blur-xl border-t p-4 z-40">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <Button variant="ghost" onClick={handleReset} disabled={isUpdating} className="flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Hủy thay đổi
                        </Button>
                        <Button onClick={activeTab === 'basic' ? handleSaveBasic : handleSavePrivacy} disabled={isUpdating} className="bg-etechs-primary text-etechs-secondary px-8 rounded-xl shadow-lg flex items-center gap-2">
                            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
                        </Button>
                    </div>
                </div>

                {isDeactivateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="bg-white dark:bg-card p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Xác nhận vô hiệu hóa</h3>
                                    <p className="text-sm text-gray-500">Bạn sẽ bị đăng xuất và không thể truy cập cho đến khi admin khôi phục.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Mật khẩu xác nhận</Label>
                                <div className="relative">
                                    <Input type={showDeactivatePassword ? "text" : "password"} value={deactivatePassword} onChange={e => setDeactivatePassword(e.target.value)} placeholder="Nhập mật khẩu của bạn" />
                                    <button type="button" onClick={() => setShowDeactivatePassword(!showDeactivatePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showDeactivatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <label className="flex items-start gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={confirmDeactivate} onChange={e => setConfirmDeactivate(e.target.checked)} className="mt-1" />
                                Tôi xác nhận muốn vô hiệu hóa tài khoản và hiểu rõ hậu quả.
                            </label>
                            {deactivateError && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{deactivateError}</p>}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsDeactivateOpen(false)}>Hủy</Button>
                                <Button variant="destructive" onClick={() => deactivateMutation.mutate()} disabled={!deactivatePassword || !confirmDeactivate || deactivateMutation.isPending}>
                                    {deactivateMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}
