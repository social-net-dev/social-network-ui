/**
 * DevTools Page
 * Dashboard for debugging and monitoring development environment
 * 
 * Features:
 * - Environment info (API URL, mode, mock status)
 * - MSW mock data preview
 * - Orval generation status
 * - Quick actions (clear storage, toggle theme, etc.)
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Database, 
  Code, 
  Trash2, 
  RefreshCw,
  Server,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/config";
import { mockUsers, mockPosts } from "@/mocks/fixtures";
import { useAuthStore } from "@/stores/authStore";

export function DevToolsPage() {
  const [activeTab, setActiveTab] = useState("environment");
  const navigate = useNavigate();
  const isMockEnabled = import.meta.env.VITE_USE_MOCK === "true";
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const handleForceLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            DevTools Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Công cụ debug và monitor cho development
          </p>
        </div>
        <Badge variant={isMockEnabled ? "default" : "secondary"} className="text-sm px-3 py-1">
          {isMockEnabled ? "MOCK MODE" : "REAL API"}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environment" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="mock" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Mock Data
          </TabsTrigger>
          <TabsTrigger value="orval" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Orval
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Actions
          </TabsTrigger>
        </TabsList>

        {/* Environment Tab */}
        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                API Configuration
              </CardTitle>
              <CardDescription>Thông tin cấu hình API và môi trường</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Base URL</p>
                  <p className="font-mono text-sm mt-1">{getApiBaseUrl()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Mode</p>
                  <p className="font-mono text-sm mt-1">{import.meta.env.MODE}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">MSW Mock</p>
                  <Badge variant={isMockEnabled ? "default" : "outline"}>
                    {isMockEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">DEV Mode</p>
                  <Badge variant={import.meta.env.DEV ? "default" : "outline"}>
                    {import.meta.env.DEV ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Auth Status
              </CardTitle>
              <CardDescription>Trạng thái đăng nhập hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span>{isAuthenticated ? "Đã đăng nhập" : "Chưa đăng nhập"}</span>
              </div>
              {user && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Current User</p>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              )}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Tokens</p>
                <div className="text-xs mt-2 space-y-1">
                  <p>auth_token: {localStorage.getItem("auth_token") ? "✅ Present" : "❌ Missing"}</p>
                  <p>refresh_token: {localStorage.getItem("refresh_token") ? "✅ Present" : "❌ Missing"}</p>
                  <p>tenant_slug: {localStorage.getItem("tenant_slug") || "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mock Data Tab */}
        <TabsContent value="mock" className="space-y-4">
          {isMockEnabled ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Mock Users ({mockUsers.length})</CardTitle>
                  <CardDescription>Danh sách users giả cho testing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockUsers.map((user) => (
                      <div key={user.id} className="p-3 rounded-lg bg-muted flex items-center gap-3">
                        <img 
                          src={user.avatar_path || "https://github.com/shadcn.png"} 
                          alt={user.display_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{user.display_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="outline" className="ml-auto">{user.id}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mock Posts ({mockPosts.length})</CardTitle>
                  <CardDescription>Danh sách bài viết giả cho testing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {mockPosts.map((post) => (
                      <div key={post.id} className="p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{post.id}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by {post.author.display_name}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{post.content_text}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{post.reaction_count} reactions</span>
                          <span>{post.comment_count} comments</span>
                          <span>{post.media_files.length} media</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium">Mock Mode Disabled</h3>
                <p className="text-muted-foreground mt-2">
                  Chạy <code className="bg-muted px-2 py-1 rounded">pnpm dev:mock</code> để bật mock mode
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* API Integration Tab */}
        <TabsContent value="orval" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                API Strategy
              </CardTitle>
              <CardDescription>Trạng thái tích hợp API hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-teal-200 bg-teal-50 dark:bg-teal-950 dark:border-teal-800">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Manual API Integration (Active)</span>
                </div>
                <p className="text-sm text-teal-600 dark:text-teal-500 mt-2">
                  Dự án đã chuyển từ Orval Generated sang Manual API để kiểm soát dữ liệu tốt hơn.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Cấu trúc API hiện tại:</p>
                <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                  <p>• Types: <code>src/lib/api/types/</code></p>
                  <p>• Services: <code>src/lib/api/services/</code></p>
                  <p>• Hooks: <code>src/lib/api/hooks/</code></p>
                  <p>• Transforms: <code>src/lib/api/transforms/</code></p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-xs text-yellow-700">
                <strong>Ghi chú:</strong> Thư mục <code>src/lib/api/generated/</code> đã được loại bỏ hoặc thay thế bằng stubs.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>Các thao tác nhanh cho development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Reload Page</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={handleClearStorage}
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear Storage</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => console.table(mockUsers)}
                >
                  <Database className="w-5 h-5" />
                  <span>Log Users</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => console.table(mockPosts)}
                >
                  <Database className="w-5 h-5" />
                  <span>Log Posts</span>
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleForceLogout}
                >
                  Force Logout & Clear Session
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>localStorage Contents</CardTitle>
              <CardDescription>Dữ liệu đang lưu trong localStorage</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-muted text-xs overflow-auto max-h-60">
                {JSON.stringify(
                  Object.fromEntries(
                    Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])
                  ),
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
