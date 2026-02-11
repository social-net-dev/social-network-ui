import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FriendsAPI } from "@/lib/api/generated";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/features/shared/components/Avatar";
import { getErrorMessage } from "@/lib/api/transforms";

function userLabel(u: any) {
  return u?.display_name || u?.username || u?.email || "Người dùng";
}

export function FriendRequestsPage() {
  const qc = useQueryClient();

  const incomingQuery = useQuery({
    queryKey: ["friends", "requests", "incoming"],
    queryFn: () => FriendsAPI.listIncomingRequestsFriendsRequestsIncomingGet(),
  });
  const outgoingQuery = useQuery({
    queryKey: ["friends", "requests", "outgoing"],
    queryFn: () => FriendsAPI.listOutgoingRequestsFriendsRequestsOutgoingGet(),
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) => FriendsAPI.acceptRequestFriendsRequestsRequestIdAcceptPost(requestId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["friends", "requests"] });
    },
  });
  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => FriendsAPI.rejectRequestFriendsRequestsRequestIdRejectPost(requestId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["friends", "requests"] });
    },
  });
  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => FriendsAPI.cancelRequestFriendsRequestsRequestIdCancelPost(requestId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["friends", "requests"] });
    },
  });

  const incoming = useMemo(() => (incomingQuery.data || []) as any[], [incomingQuery.data]);
  const outgoing = useMemo(() => (outgoingQuery.data || []) as any[], [outgoingQuery.data]);

  const busy = acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending;

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
            incoming.map((fr: any) => (
              <Card key={fr.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={{ ...fr.requester, displayName: fr.requester?.display_name, username: fr.requester?.username, avatar: fr.requester?.avatar_path }} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{userLabel(fr.requester)}</div>
                    <div className="text-xs text-gray-500 truncate">@{fr.requester?.username || fr.requester?.email || "-"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="rounded-full"
                    disabled={busy}
                    onClick={() => acceptMutation.mutate(fr.id)}
                  >
                    Chấp nhận
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={busy}
                    onClick={() => rejectMutation.mutate(fr.id)}
                  >
                    Từ chối
                  </Button>
                </div>
              </Card>
            ))
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
            outgoing.map((fr: any) => (
              <Card key={fr.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar user={{ ...fr.addressee, displayName: fr.addressee?.display_name, username: fr.addressee?.username, avatar: fr.addressee?.avatar_path }} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{userLabel(fr.addressee)}</div>
                    <div className="text-xs text-gray-500 truncate">@{fr.addressee?.username || fr.addressee?.email || "-"}</div>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={busy}
                    onClick={() => cancelMutation.mutate(fr.id)}
                  >
                    Huỷ lời mời
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

