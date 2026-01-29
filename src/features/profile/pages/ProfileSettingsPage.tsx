import { useState } from 'react'
import { MainLayout } from '@/features/shared/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Save, User, School, Shield, Mail, Phone, GraduationCap, Award, BookOpen, Info, Trash2 } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'

export function ProfileSettingsPage() {
  const { profile, isLoading } = useProfile()
  const [activeTab, setActiveTab] = useState('privacy')

  if (isLoading || !profile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etechs-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-32">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/profile">Hồ sơ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cài đặt</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Cài đặt hồ sơ</h1>
          <p className="text-gray-500 dark:text-gray-400">Quản lý chi tiết cá nhân, trình độ học vấn và quyền riêng tư của bạn.</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="privacy" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white dark:bg-card p-1 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 w-full justify-start mb-8 overflow-x-auto no-scrollbar">
            <TabsTrigger value="basic" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
              <User className="w-4 h-4 mr-2" />
              Thông tin cơ bản
            </TabsTrigger>
            <TabsTrigger value="academic" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
              <School className="w-4 h-4 mr-2" />
              Thông tin học vấn
            </TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5">
              <Shield className="w-4 h-4 mr-2" />
              Quyền riêng tư & Hiển thị
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="outline-none">
            <Card className="border-none shadow-xl bg-white dark:bg-card rounded-3xl overflow-hidden">
                <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>Cập nhật họ tên và thông tin giới thiệu của bạn.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Họ</Label>
                            <Input id="firstName" defaultValue={profile.firstName} className="rounded-xl border-gray-200 dark:border-gray-800" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Tên</Label>
                            <Input id="lastName" defaultValue={profile.lastName} className="rounded-xl border-gray-200 dark:border-gray-800" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio">Giới thiệu bản thân</Label>
                        <textarea 
                            id="bio" 
                            defaultValue={profile.bio} 
                            rows={4}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-etechs-primary outline-none resize-none"
                        />
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic" className="outline-none">
            <Card className="border-none shadow-xl bg-white dark:bg-card rounded-3xl overflow-hidden">
                <CardHeader>
                    <CardTitle>Trình độ học vấn</CardTitle>
                    <CardDescription>Thông tin về trường lớp và các thành tựu học tập.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-gray-800 text-center">
                        <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Chưa có thông tin học vấn nào được thêm.</p>
                        <Button variant="outline" className="mt-4 rounded-xl border-etechs-primary text-etechs-secondary dark:text-etechs-primary hover:bg-etechs-primary/10">
                            Thêm học vấn mới
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="outline-none space-y-6">
            <Card className="border-none shadow-xl bg-white dark:bg-card rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold">Trung tâm kiểm soát quyền riêng tư</CardTitle>
                    <CardDescription>Quyết định chính xác ai có thể xem thông tin của bạn. Các thay đổi được áp dụng ngay sau khi lưu.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50 dark:bg-white/5">
                                <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800">
                                    <TableHead className="w-[300px] py-4 px-6 text-gray-900 dark:text-white font-bold uppercase text-xs tracking-wider">Danh mục</TableHead>
                                    <TableHead className="text-center py-4 px-6 text-gray-900 dark:text-white font-bold uppercase text-xs tracking-wider">Mọi người</TableHead>
                                    <TableHead className="text-center py-4 px-6 text-gray-900 dark:text-white font-bold uppercase text-xs tracking-wider">Bạn bè</TableHead>
                                    <TableHead className="text-center py-4 px-6 text-gray-900 dark:text-white font-bold uppercase text-xs tracking-wider">Chỉ mình tôi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    { id: 'email', label: 'Địa chỉ Email', icon: Mail },
                                    { id: 'phone', label: 'Số điện thoại', icon: Phone },
                                    { id: 'academic', label: 'Lịch sử học tập', icon: BookOpen },
                                    { id: 'certs', label: 'Chứng chỉ & Huy hiệu', icon: Award },
                                    { id: 'grades', label: 'Điểm số khóa học', icon: Info },
                                ].map((item) => (
                                    <TableRow key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 border-gray-100 dark:border-gray-800 transition-colors">
                                        <TableCell className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 group-hover:text-etechs-secondary dark:group-hover:text-etechs-primary transition-colors">
                                                    <item.icon className="w-4 h-4" />
                                                </div>
                                                {item.label}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4 px-6">
                                            <RadioGroup defaultValue="me" className="flex justify-center">
                                                <RadioGroupItem value="everyone" className="border-2 border-gray-300 dark:border-gray-600 text-etechs-primary ring-offset-etechs-primary" />
                                            </RadioGroup>
                                        </TableCell>
                                        <TableCell className="text-center py-4 px-6">
                                            <RadioGroup defaultValue="me" className="flex justify-center">
                                                <RadioGroupItem value="connections" className="border-2 border-gray-300 dark:border-gray-600 text-etechs-primary ring-offset-etechs-primary" />
                                            </RadioGroup>
                                        </TableCell>
                                        <TableCell className="text-center py-4 px-6">
                                            <RadioGroup defaultValue="me" className="flex justify-center">
                                                <RadioGroupItem value="me" className="border-2 border-gray-300 dark:border-gray-600 text-etechs-primary ring-offset-etechs-primary" />
                                            </RadioGroup>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="m-6 p-6 rounded-2xl bg-etechs-primary/10 border border-etechs-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="space-y-1">
                            <h4 className="font-bold text-gray-900 dark:text-white">Lập chỉ mục công cụ tìm kiếm</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cho phép các công cụ tìm kiếm công cộng (Google, Bing) hiển thị hồ sơ của bạn.</p>
                        </div>
                        <Switch defaultChecked className="data-[state=checked]:bg-etechs-primary" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-etechs-primary/5 rounded-3xl p-6 border border-etechs-primary/10 flex gap-4 items-start">
                <div className="p-2 rounded-xl bg-etechs-primary/20 text-etechs-secondary dark:text-etechs-primary">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">Điều gì xảy ra khi tôi chọn "Chỉ mình tôi"?</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Thông tin sẽ bị ẩn khỏi hồ sơ công khai của bạn và chỉ bạn mới có thể nhìn thấy khi đã đăng nhập. 
                        Quản trị viên mạng vẫn có thể truy cập vì lý do tuân thủ.
                    </p>
                </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Footer Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-card/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 p-4 z-40 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button variant="ghost" className="text-gray-500 hover:text-red-500 font-bold px-6 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4 mr-2" />
                Hủy thay đổi
            </Button>
            <div className="flex gap-4">
                <Button variant="outline" className="hidden sm:flex rounded-xl border-gray-200 dark:border-gray-800 px-6 font-bold">
                    Lưu bản nháp
                </Button>
                <Button className="bg-etechs-primary text-etechs-secondary hover:bg-etechs-primary/90 font-bold px-8 rounded-xl shadow-lg shadow-etechs-primary/20 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                </Button>
            </div>
        </div>
      </div>
    </MainLayout>
  )
}
