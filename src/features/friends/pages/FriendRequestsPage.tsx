import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FriendsAPI } from "@/lib/api/generated";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/features/shared/components/Avatar";
import { getErrorMessage } from "@/lib/api/transforms";
import { Loader2, UserCheck, UserX, XCircle } from "lucide-react";
import { toast } from "sonner";

function userLabel(u: any) {
  return u?.display_name || u?.username || u?.email || "Người dùng";
}

export function FriendRequestsPage() {
  const qc = useQueryClient();
  // Track which individual request IDs are being processed
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const addProcessing = (id: string) =>
    setProcessingIds((prev) => new Set(prev).add(id));
  const removeProcessing = (id: string) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const incomingQuery = useQuery({
    queryKey: ["friends", "requests", "incoming"],
    queryFn: () => FriendsAPI.listIncomingRequestsFriendsRequestsIncomingGet(),
  });
  const outgoingQuery = useQuery({
    queryKey: ["friends", "requests", "outgoing"],
    queryFn: () => FriendsAPI.listOutgoingRequestsFriendsRequestsOutgoingGet(),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => {
      addProcessing(requestId);
      return FriendsAPI.acceptRequestFriendsRequestsRequestIdAcceptPost(requestId);
    },
    onSuccess: (_data, requestId) => {
      removeProcessing(requestId);
      toast.success("Đã chấp nhận lời mời kết bạn");
      // Optimistically remove from incoming list
      qc.setQueryData(["friends", "requests", "incoming"], (old: any[] | undefined) =>
        old ? old.filter((fr: any) => fr.id !== requestId) : []
      );
      // Background refresh
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (err: any, requestId) => {
      removeProcessing(requestId);
      toast.error(getErrorMessage(err) || "Lỗi khi chấp nhận lời mời");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => {
      addProcessing(requestId);
      return FriendsAPI.rejectRequestFriendsRequestsRequestIdRejectPost(requestId);
    },
    onSuccess: (_data, requestId) => {
      removeProcessing(requestId);
      toast.success("Đã từ chối lời mời kết bạn");
      qc.setQueryData(["friends", "requests", "incoming"], (old: any[] | undefined) =>
        old ? old.filter((fr: any) => fr.id !== requestId) : []
      );
      qc.invalidateQueries({ queryKey: ["friends", "requests"] });
    },
    onError: (err: any, requestId) => {
      removeProcessing(requestId);
      toast.error(getErrorMessage(err) || "Lỗi khi từ chối lời mời");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => {
      addProcessing(requestId);
      return FriendsAPI.cancelRequestFriendsRequestsRequestIdCancelPost(requestId);
    },
    onSuccess: (_data, requestId) => {
      removeProcessing(requestId);
      toast.success("Đã hủy lời mời kết bạn");
      qc.setQueryData(["friends", "requests", "outgoing"], (old: any[] | undefined) =>
        old ? old.filter((fr: any) => fr.id !== requestId) : []
      );
      qc.invalidateQueries({ queryKey: ["friends", "requests"] });
    },
    onError: (err: any, requestId) => {
      removeProcessing(requestId);
      toast.error(getErrorMessage(err) || "Lỗi khi hủy lời mời");
    },
  });

  const incoming = useMemo(() => (incomingQuery.data || []) as any[], [incomingQuery.data]);
  const outgoing = useMemo(() => (outgoingQuery.data || []) as any[], [outgoingQuery.data]);

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
          {incomingQuery.isPending ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : incomingQuery.isError ? (
            <div className="text-red-600">{getErrorMessage(incomingQuery.error)}</div>
          ) : incoming.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">Chưa có lời mời nào.</Card>
          ) : (
            incoming.map((fr: any) => {
              const isProcessing = processingIds.has(fr.id);
              return (
                <Card key={fr.id} className={`p-4 flex items-center justify-between gap-4 transition-opacity ${isProcessing ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar user={fr.requester} size="md" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{userLabel(fr.requester)}</div>
                      <div className="text-xs text-gray-500 truncate">@{fr.requester?.username || fr.requester?.email || "-"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="rounded-full"
                      disabled={isProcessing}
                      onClick={() => acceptMutation.mutate(fr.id)}
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
                      onClick={() => rejectMutation.mutate(fr.id)}
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
          {outgoingQuery.isPending ? (
            <div className="text-gray-500">Đang tải...</div>
          ) : outgoingQuery.isError ? (
            <div className="text-red-600">{getErrorMessage(outgoingQuery.error)}</div>
          ) : outgoing.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">Bạn chưa gửi lời mời nào.</Card>
          ) : (
            outgoing.map((fr: any) => {
              const isProcessing = processingIds.has(fr.id);
              return (
                <Card key={fr.id} className={`p-4 flex items-center justify-between gap-4 transition-opacity ${isProcessing ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar user={fr.addressee} size="md" />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{userLabel(fr.addressee)}</div>
                      <div className="text-xs text-gray-500 truncate">@{fr.addressee?.username || fr.addressee?.email || "-"}</div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      disabled={isProcessing}
                      onClick={() => cancelMutation.mutate(fr.id)}
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

