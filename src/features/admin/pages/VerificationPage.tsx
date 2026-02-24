import { useState } from "react";
import { useAdminVerificationRequests, useApproveVerification, useRejectVerification } from "../hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export function AdminVerificationPanel({ showTitle = true }: { showTitle?: boolean }) {
    const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
    const [showRejectInput, setShowRejectInput] = useState<{ [key: string]: boolean }>({});

    const { data: requests = [], isLoading } = useAdminVerificationRequests("PENDING");

    const approveMutation = useApproveVerification();
    const rejectMutation = useRejectVerification();

    const handleApprove = (requestId: string, role: string) => {
        approveMutation.mutate({ requestId, data: { role } });
    };

    const handleRejectClick = (requestId: string) => {
        setShowRejectInput((prev) => ({ ...prev, [requestId]: true }));
    };

    const handleReject = (requestId: string) => {
        const reason = rejectReason[requestId] || "Không phù hợp";
        rejectMutation.mutate({ requestId, data: { reason } });
    };

    return (
        <div className="space-y-6">
            {showTitle && <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Duyệt xác minh tài khoản</h2>}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader className="h-8 w-8 animate-spin text-teal-600" />
                </div>
            ) : requests.length === 0 ? (
                <Card className="p-6 text-center">
                    <p className="text-gray-600">Không có yêu cầu xác minh nào chờ duyệt</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <Card key={req.id} className="p-6">
                            <div className="space-y-4">
                                {/* User Info */}
                                <div>
                                <h3 className="font-semibold text-lg text-gray-900">{req.user?.displayName}</h3>
                                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Email:</span> {req.user?.email}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">SĐT:</span> {req.user?.phone || "N/A"}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Loại TK:</span>{" "}
                                        {req.requested_role === "STUDENT" ? "Học sinh" : "Giáo viên"}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        <span className="font-medium">Ngày đăng ký:</span> {new Date(req.created_at).toLocaleString("vi-VN")}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Trạng thái TK:</span> {req.user?.accountStatus || "UNVERIFIED"}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Dung lượng:</span> {req.user?.storageQuotaMb}MB →{" "}
                                        {req.user?.accountStatus === "VERIFIED" ? "5GB" : "100MB sau phê duyệt"}
                                    </p>
                                </div>
                                </div>

                                {/* CCCD Images */}
                                {(req.user?.cccd_front_path || req.user?.cccd_back_path) && (
                                    <div>
                                        <p className="font-medium text-sm text-gray-700 mb-3">Hình CCCD:</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            {req.user?.cccd_front_path && (
                                                <div className="border rounded-lg overflow-hidden bg-gray-50 flex flex-col">
                                                    <p className="text-xs font-medium text-gray-600 px-2 py-2 border-b bg-gray-100">Mặt trước</p>
                                                    <div className="flex-1 flex items-center justify-center min-h-64">
                                                        <img
                                                            src={`http://localhost:9000/private/${req.user.cccd_front_path}`}
                                                            alt="CCCD Front"
                                                            className="w-full h-full object-contain p-2"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EKhông có ảnh%3C/text%3E%3C/svg%3E";
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {req.user?.cccd_back_path && (
                                                <div className="border rounded-lg overflow-hidden bg-gray-50 flex flex-col">
                                                    <p className="text-xs font-medium text-gray-600 px-2 py-2 border-b bg-gray-100">Mặt sau</p>
                                                    <div className="flex-1 flex items-center justify-center min-h-64">
                                                        <img
                                                            src={`http://localhost:9000/private/${req.user.cccd_back_path}`}
                                                            alt="CCCD Back"
                                                            className="w-full h-full object-contain p-2"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src =
                                                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EKhông có ảnh%3C/text%3E%3C/svg%3E";
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 flex-col pt-4 border-t">
                                    {!showRejectInput[req.id] ? (
                                        <>
                                            <Button
                                                onClick={() => handleApprove(req.id, req.requested_role)}
                                                disabled={approveMutation.isPending}
                                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                            >
                                                {approveMutation.isPending ? (
                                                    <Loader className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4" />
                                                )}
                                                Duyệt
                                            </Button>
                                            <Button
                                                onClick={() => handleRejectClick(req.id)}
                                                variant="destructive"
                                                className="flex items-center gap-2"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Từ Chối
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="space-y-2 w-80">
                                            <input
                                                type="text"
                                                placeholder="Lý do từ chối..."
                                                value={rejectReason[req.id] || ""}
                                                onChange={(e) => setRejectReason((prev) => ({ ...prev, [req.id]: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={rejectMutation.isPending}
                                                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                                                >
                                                    {rejectMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setShowRejectInput((prev) => ({ ...prev, [req.id]: false }))}
                                                    className="flex-1"
                                                >
                                                    Hủy
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export function AdminVerificationPage() {
    return (
        <div className="space-y-6">
            <AdminVerificationPanel />
        </div>
    );
}
