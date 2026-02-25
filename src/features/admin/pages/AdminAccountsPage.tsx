import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCcw } from "lucide-react";
import { useAdminUsers, useReactivateUser } from "../hooks/useAdmin";
import { AdminVerificationPanel } from "./VerificationPage";

const STATUS_LABELS: Record<string, string> = {
    UNVERIFIED: "Chưa xác nhận",
    VERIFIED: "Đã xác nhận",
    PENDING: "Đang đợi xác nhận",
    REJECTED: "Từ chối",
    LOCKED: "Bị khóa",
    DISABLED: "Bị vô hiệu hóa",
    DEACTIVATED: "Đã vô hiệu hóa",
    TERMINATED: "Đã chấm dứt",
};

const ROLE_LABELS: Record<string, string> = {
    USER: "Người dùng",
    VERIFIED_USER: "Đã xác minh",
    STUDENT: "Học viên",
    INSTRUCTOR: "Giảng viên",
    ADMIN: "Quản trị viên",
};

const RECOVERABLE_STATUSES = ["DEACTIVATED", "LOCKED", "DISABLED"];

function statusBadgeVariant(status: string) {
    switch (status) {
        case "VERIFIED": return "secondary";
        case "PENDING": return "outline";
        case "UNVERIFIED": return "ghost";
        case "DEACTIVATED":
        case "DISABLED":
        case "LOCKED":
            return "destructive";
        default: return "outline";
    }
}

function formatDate(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    return isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
}

function getDaysSinceDeactivation(deactivatedAt?: string | null): string {
    if (!deactivatedAt) return "-";
    const deactivatedDate = new Date(deactivatedAt);
    if (isNaN(deactivatedDate.getTime())) return "-";
    const now = new Date();
    const diffMs = now.getTime() - deactivatedDate.getTime();
    return `${Math.floor(diffMs / (1000 * 60 * 60 * 24))} ngày`;
}

export function AdminAccountsPage() {
    const [activeTab, setActiveTab] = useState("ALL");

    const {
        data: users = [],
        isLoading,
        refetch,
        isFetching,
        isError,
        error,
    } = useAdminUsers();

    const reactivateMutation = useReactivateUser();

    const filteredUsers = useMemo<any[]>(() => {
        const usersList = (Array.isArray(users) ? users : (users as any)?.data || []) as any[];
        if (activeTab === "ALL") {
            return usersList;
        }
        if (activeTab === "RECOVERABLE") {
            return usersList.filter((u) => RECOVERABLE_STATUSES.includes(u.account_status));
        }
        return usersList.filter((u) => u.account_status === activeTab);
    }, [activeTab, users]);

    const tabs = [
        { value: "ALL", label: "Tất cả tài khoản" },
        { value: "VERIFIED", label: "Đã xác nhận" },
        { value: "PENDING", label: "Đang đợi xác nhận" },
        { value: "DEACTIVATED", label: "Đã vô hiệu hóa" },
        { value: "RECOVERABLE", label: "Có thể khôi phục lại" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý tài khoản</h1>
                    <p className="text-gray-500 dark:text-gray-400">Danh sách tất cả tài khoản và trạng thái hiện tại.</p>
                </div>
                <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2">
                    <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    Làm mới
                </Button>
            </div>

            <Card className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="h-auto bg-transparent border-b border-border w-full justify-start mb-6 p-0 rounded-none flex flex-wrap">
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 font-medium">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {tabs.map((tab) => (
                        <TabsContent key={tab.value} value={tab.value} className="pt-4">
                            {tab.value === "PENDING" ? (
                                <AdminVerificationPanel showTitle={false} />
                            ) : isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader className="h-8 w-8 animate-spin text-teal-600" />
                                </div>
                            ) : isError ? (
                                <div className="text-center text-red-600 py-12">
                                    {(error as Error)?.message || "Không thể tải danh sách tài khoản"}
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">Không có tài khoản phù hợp.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Thông tin</TableHead>
                                                <TableHead>Loại TK</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead>Dung lượng</TableHead>
                                                <TableHead>CCCD</TableHead>
                                                <TableHead>{activeTab === "DEACTIVATED" ? "Ngày vô hiệu hóa" : "Ngày đăng ký"}</TableHead>
                                                {activeTab === "DEACTIVATED" && <TableHead>Số ngày vô hiệu hóa</TableHead>}
                                                <TableHead>Hành động</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((user: any) => {
                                                const isRecoverable = RECOVERABLE_STATUSES.includes(user.account_status);
                                                const storageLabel = user.account_status === "VERIFIED" ? "5GB" : "100MB";
                                                return (
                                                    <TableRow key={user.id}>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="font-medium text-gray-900 dark:text-white">
                                                                    {user.display_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{user.email}</div>
                                                                <div className="text-xs text-gray-500">{user.phone || "-"}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{ROLE_LABELS[user.role] || user.role}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={statusBadgeVariant(user.account_status) as any}>
                                                                {STATUS_LABELS[user.account_status] || user.account_status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{storageLabel}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                {user.cccd_front_path ? (
                                                                    <img
                                                                        src={`http://localhost:9000/private/${user.cccd_front_path}`}
                                                                        alt="CCCD front"
                                                                        className="h-10 w-16 rounded object-cover border"
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">-</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {activeTab === "DEACTIVATED"
                                                                ? formatDate(user.deactivated_at)
                                                                : formatDate(user.created_at)}
                                                        </TableCell>
                                                        {activeTab === "DEACTIVATED" && (
                                                            <TableCell>{getDaysSinceDeactivation(user.deactivated_at)}</TableCell>
                                                        )}
                                                        <TableCell>
                                                            {isRecoverable ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => reactivateMutation.mutate(user.id)}
                                                                    disabled={reactivateMutation.isPending}
                                                                >
                                                                    Kích hoạt lại
                                                                </Button>
                                                            ) : (
                                                                <span className="text-xs text-gray-400">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </Card>
        </div>
    );
}
