import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useFriendsListIncomingRequests, useFriendsListOutgoingRequests, useFriendsAcceptRequest, useFriendsRejectRequest, useFriendsCancelRequest } from "@/lib/api/generated/friends/friends";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/features/shared/components/Avatar";
import { getErrorMessage } from "@/lib/utils/api";
import { Loader2, UserCheck, UserX, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { FriendRequest } from "@/lib/api/generated/model";

function userLabel(fr: FriendRequest, side: 'requester' | 'addressee') {
  const u = side === 'requester' ? fr.requester : fr.addressee;
  return u?.display_name || u?.username || "Người dùng";
}

export function FriendRequestsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const addProcessing = (id: string) =>
    setProcessingIds((prev) => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const handleUserClick = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const incomingQuery = useFriendsListIncomingRequests();
  const outgoingQuery = useFriendsListOutgoingRequests();
  const acceptMutation = useFriendsAcceptRequest();
  const rejectMutation = useFriendsRejectRequest();
  const cancelMutation = useFriendsCancelRequest();

  const isQueryLoading = incomingQuery.isLoading || outgoingQuery.isLoading;
  const isError = incomingQuery.isError || outgoingQuery.isError;

  const handleAccept = async (requestId: string) => {
    addProcessing(requestId);
    try {
      await acceptMutation.mutateAsync({ requestId });
      toast.success("Đã chấp nhận lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["/friends/"] });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Lỗi khi chấp nhận lời mời");
    } finally {
      removeProcessing(requestId);
    }
  };

  const handleReject = async (requestId: string) => {
    addProcessing(requestId);
    try {
      await rejectMutation.mutateAsync({ requestId });
      toast.success("Đã từ chối lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["/friends/"] });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Lỗi khi từ chối lời mời");
    } finally {
      removeProcessing(requestId);
    }
  };

  const handleCancel = async (requestId: string) => {
    addProcessing(requestId);
    try {
      await cancelMutation.mutateAsync({ requestId });
      toast.success("Đã hủy lời mời kết bạn");
      qc.invalidateQueries({ queryKey: ["/friends/"] });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || "Lỗi khi hủy lời mời");
    } finally {
      removeProcessing(requestId);
    }
  };

  const incoming = useMemo(() => incomingQuery.data?.data || [], [incomingQuery.data]);
  const outgoing = useMemo(() => outgoingQuery.data?.data || [], [outgoingQuery.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lời mời kết bạn</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Xem lời mời đến và các lời mời bạn đã gửi.</p>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="h-auto bg-transparent border-b border-border w-full justify-start mb-6 p-0 rounded-none">
          <TabsTrigger value="incoming" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 font-medium">
            Đến ({incoming.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none px-4 py-3 font-medium">
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
            <div className="max-w-3xl mx-auto space-y-3">
              {incoming.map((fr) => {
                const isProcessing = processingIds.has(fr.id);
                const requester = fr.requester;
                return (
                  <Card key={fr.id} className={`p-4 transition-opacity ${isProcessing ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between gap-4">
                      <button
                        className="flex items-center gap-3 min-w-0 flex-1 hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => requester?.username && handleUserClick(requester.username)}
                        disabled={!requester?.username}
                      >
                        <Avatar user={requester as Parameters<typeof Avatar>[0]['user']} size="md" />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="font-semibold truncate">{userLabel(fr, 'requester')}</div>
                          <div className="text-xs text-gray-500 truncate">@{requester?.username || "-"}</div>
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
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
                          size="sm"
                          className="rounded-full"
                          disabled={isProcessing}
                          onClick={() => handleReject(fr.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
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
            <div className="max-w-3xl mx-auto space-y-3">
              {outgoing.map((fr) => {
                const isProcessing = processingIds.has(fr.id);
                const addressee = fr.addressee;
                return (
                  <Card key={fr.id} className={`p-4 transition-opacity ${isProcessing ? "opacity-60" : ""}`}>
                    <div className="flex items-center justify-between gap-4">
                      <button
                        className="flex items-center gap-3 min-w-0 flex-1 hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => addressee?.username && handleUserClick(addressee.username)}
                        disabled={!addressee?.username}
                      >
                        <Avatar user={addressee as Parameters<typeof Avatar>[0]['user']} size="md" />
                        <div className="min-w-0 flex-1 text-left">
                          <div className="font-semibold truncate">{userLabel(fr, 'addressee')}</div>
                          <div className="text-xs text-gray-500 truncate">@{addressee?.username || "-"}</div>
                        </div>
                      </button>
                      <div className="shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
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
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
