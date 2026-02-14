import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFriends, useFriendActions } from "@/lib/api/hooks/useFriends";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/features/shared/components/Avatar";
import { getErrorMessage, transformUser } from "@/lib/api/transforms";
import { Loader2, UserCheck, UserX, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/api/types/user.types";
import type { FriendRequest } from "@/lib/api/types/friend.types";

function userLabel(u: User) {
  return u.displayName || u.username || u.email || "Người dùng";
}

export function FriendRequestsPage() {
  const qc = useQueryClient();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const addProcessing = (id: string) =>
    setProcessingIds((prev) => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const { incomingRequests, outgoingRequests, isLoading: isQueryLoading, isError } = useFriends();
  const { acceptRequest, rejectRequest, cancelRequest } = useFriendActions();

  const handleAccept = async (requestId: string) => {
    addProcessing(requestId);
    try {
      await acceptRequest(requestId);
      toast.success("Đã chấp nhận lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    } catch (err: any) {
      toast.error(getErrorMessage(err) || "Lỗi khi chấp nhận lời mời");
    } finally {
      removeProcessing(requestId);
    }
  };

  const handleReject = async (requestId: string) => {
    addProcessing(requestId);
    try {
      await rejectRequest(requestId);
      toast.success("Đã từ chối lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["friends", "requests"] });
    } catch (err: any) {
      toast.error(getErrorMessage(err) || "Lỗi khi từ chối lời mời");
    } finally {
      removeProcessing(requestId);
    }
  };

  const handleCancel = async (requestId: string) => {
    addProcessing(requestId);
    try {
      await cancelRequest(requestId);
      toast.success("Đã hủy lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["friends", "requests"] });
    } catch (err: any) {
      toast.error(getErrorMessage(err) || "Lỗi khi hủy lời mời");
    } finally {
      removeProcessing(requestId);
    }
  };

  const incoming = useMemo(() => (incomingRequests || []) as FriendRequest[], [incomingRequests]);
  const outgoing = useMemo(() => (outgoingRequests || []) as FriendRequest[], [outgoingRequests]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lời mời kết bạn</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Xem lời mời đến và các lời mời bạn đã gửi.</p>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="bg-white dark:bg-card p-1 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
          <TabsTrigger value="incoming" className="rounded-xl px-6 py-2.5">
            Đến ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="rounded-xl px-6 py-2.5">
            Đã gửi ({outgoing.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3 mt-6">
          {isQueryLoading ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : isError ? (
            <div className="text-red-600">Đã xảy ra lỗi khi tải dữ liệu.</div>
          ) : incoming.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">Chưa có lời mời nào.</Card>
          ) : (
            incoming.map((fr) => {
              const requester = transformUser(fr.requester);
              const isProcessing = processingIds.has(fr.id);
              return (
                <Card key={fr.id} className={`p-4 flex items-center justify-between gap-4 transition-opacity ${isProcessing ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar user={requester} size="md" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{userLabel(requester)}</div>
                      <div className="text-xs text-gray-500 truncate">@{requester.username || requester.email || "-"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="rounded-full"
                      disabled={isProcessing}
                      onClick={() => handleAccept(fr.id)}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <UserCheck className="h-4 w-4 mr-1" />
                      )}
                      Chấp nhận
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={isProcessing}
                      onClick={() => handleReject(fr.id)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Từ chối
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-3 mt-6">
          {isQueryLoading ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : isError ? (
            <div className="text-red-600">Đã xảy ra lỗi khi tải dữ liệu.</div>
          ) : outgoing.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">Bạn chưa gửi lời mời nào.</Card>
          ) : (
            outgoing.map((fr) => {
              const addressee = transformUser(fr.addressee);
              const isProcessing = processingIds.has(fr.id);
              return (
                <Card key={fr.id} className={`p-4 flex items-center justify-between gap-4 transition-opacity ${isProcessing ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar user={addressee} size="md" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{userLabel(addressee)}</div>
                      <div className="text-xs text-gray-500 truncate">@{addressee.username || addressee.email || "-"}</div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={isProcessing}
                      onClick={() => handleCancel(fr.id)}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Huỷ lời mời
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
