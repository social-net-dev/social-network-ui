import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/features/shared/components/Avatar";
import { GraduationCap, Search, Sparkles, Users, UserCheck, Clock, Loader2, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecommendationsSuggestions } from "@/lib/api/generated/recommendations/recommendations";
import { useFriendsSendRequest, useFriendsAcceptRequest } from "@/lib/api/generated/friends/friends";
import { getErrorMessage } from "@/lib/utils/api";
import { toast } from "sonner";
import type { ApiSuggestion } from "@/lib/api/generated/model";

const TAB_OPTIONS = [
    { value: "ALL", label: "Tất cả" },
    { value: "CLASS", label: "Chung lớp" },
    { value: "SCHOOL", label: "Chung trường" },
    { value: "FIELD", label: "Chung lĩnh vực" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

export type Suggestion = {
    id: string;
    name: string;
    username: string;
    role: "Học sinh" | "Giáo viên" | "Giảng viên";
    className: string;
    school: string;
    field: string;
    hats: number;
    mutuals: number;
    tags: Array<"CLASS" | "SCHOOL" | "FIELD">;
    avatar?: string;
    avatar_path?: string;
    background_url?: string;
    friendshipStatus: "NONE" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "FRIENDS";
    friendRequestId?: string | null;
};

function mapApiToSuggestion(r: ApiSuggestion): Suggestion {
    const tags = (r.tags || []) as Array<"CLASS" | "SCHOOL" | "FIELD">;
    const roleMap: Record<string, "Học sinh" | "Giáo viên" | "Giảng viên"> = {
        TEACH_AT_SCHOOL: "Giáo viên",
        TEACHES: "Giáo viên",
        TEACHER: "Giáo viên",
        INSTRUCTOR: "Giảng viên",
        STUDY_AT_SCHOOL: "Học sinh",
        STUDY_IN: "Học sinh",
        STUDENT: "Học sinh",
    };
    const role = (r.role && roleMap[r.role]) || "Học sinh";
    const username =
        (r.username || "").trim() ||
        (r.name || "").toLowerCase().replace(/\s+/g, "").slice(0, 20) ||
        r.id?.slice(0, 8) ||
        "user";
    return {
        id: r.id,
        name: r.name || "Người dùng",
        username,
        role,
        className: r.class_name || r.target_name || "—",
        school: r.school || (r.connected_via === "School" ? r.target_name || "—" : "—"),
        field: r.field || (tags.includes("FIELD") ? r.target_name || "—" : "—"),
        hats: 0,
        mutuals: 0,
        tags: tags.length ? tags : ["SCHOOL"],
        avatar_path: r.avatar_path || undefined,
        background_url: r.background_path || undefined,
        friendshipStatus: (r.friend_status as Suggestion["friendshipStatus"]) || "NONE",
        friendRequestId: r.friend_request_id,
    };
}

export function RecommendationPage() {
    const [activeTab, setActiveTab] = useState<TabValue>("ALL");
    const [query, setQuery] = useState("");
    const [minHats, setMinHats] = useState(0);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();

    const addProcessing = (id: string) =>
        setProcessingIds((prev) => new Set(prev).add(id));
    const removeProcessing = (id: string) =>
        setProcessingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });

    const sendRequestMutation = useFriendsSendRequest();
    const acceptRequestMutation = useFriendsAcceptRequest();

    const updateSuggestionStatus = (userId: string, newStatus: Suggestion["friendshipStatus"], requestId?: string | null) => {
        for (const tab of TAB_OPTIONS) {
            queryClient.setQueryData<Suggestion[]>(
                ["recommendations", "suggestions", tab.value],
                (old) => {
                    if (!old) return old;
                    return old.map((s) =>
                        s.id === userId
                            ? { ...s, friendshipStatus: newStatus, friendRequestId: requestId ?? s.friendRequestId }
                            : s
                    );
                }
            );
        }
    };

    const handleConnect = async (userId: string, username: string) => {
        addProcessing(userId);
        try {
            const res = await sendRequestMutation.mutateAsync({ data: { addressee_username: username } });
            toast.success("Đã gửi lời mời kết bạn");
            const requestId = res.data?.id || null;
            updateSuggestionStatus(userId, "REQUEST_SENT", requestId ? String(requestId) : null);
            queryClient.invalidateQueries({ queryKey: ["/friends/"] });
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            removeProcessing(userId);
        }
    };

    const handleAccept = async (userId: string, requestId: string) => {
        addProcessing(userId);
        try {
            await acceptRequestMutation.mutateAsync({ requestId });
            toast.success("Đã chấp nhận lời mời kết bạn");
            updateSuggestionStatus(userId, "FRIENDS");
            queryClient.invalidateQueries({ queryKey: ["/friends/"] });
        } catch (_err) {
            toast.error("Lỗi khi chấp nhận lời mời");
        } finally {
            removeProcessing(userId);
        }
    };

    const { data: suggestionsResp, isLoading } = useRecommendationsSuggestions(
        { filter: activeTab },
        { query: { queryKey: ["recommendations", "suggestions", activeTab], staleTime: 60 * 1000 } }
    );
    const rawSuggestions = (suggestionsResp?.data?.suggestions || []) as ApiSuggestion[];

    const apiSuggestions = useMemo(() => rawSuggestions.map(mapApiToSuggestion), [rawSuggestions]);

    const suggestions = useMemo(() => {
        const filteredByTab =
            activeTab === "ALL" ? apiSuggestions : apiSuggestions.filter((item) => item.tags.includes(activeTab));
        return filteredByTab.filter((item) => {
            const matchesQuery = [item.name, item.username, item.school, item.field, item.className]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase());
            const matchesHats = item.hats >= minHats;
            return matchesQuery && matchesHats;
        });
    }, [activeTab, query, minHats, apiSuggestions]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-etechs-primary/10 text-etechs-primary flex items-center justify-center">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gợi ý kết nối</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Khám phá những người học phù hợp dựa trên lớp, trường và lĩnh vực học tập.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Tìm theo tên, trường, lớp hoặc lĩnh vực"
                            className="pl-10 h-11"
                        />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f2430] px-3 h-11">
                        <GraduationCap className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">Tối thiểu</span>
                        <Input
                            type="number"
                            min={0}
                            max={10}
                            value={minHats}
                            onChange={(event) => setMinHats(Number(event.target.value) || 0)}
                            className="h-8 w-20"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300">nón</span>
                    </div>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
                <TabsList className="bg-white dark:bg-card p-1 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 w-full justify-start flex flex-wrap">
                    {TAB_OPTIONS.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="rounded-xl data-[state=active]:bg-etechs-primary data-[state=active]:text-etechs-secondary px-6 py-2.5"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {TAB_OPTIONS.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className="space-y-6 mt-6">
                        {isLoading ? (
                            <div className="py-12 text-center text-gray-500">Đang tải gợi ý...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                {suggestions.length === 0 ? (
                                    <Card className="border-dashed md:col-span-2 xl:col-span-4">
                                        <CardContent className="py-12 text-center text-gray-500">
                                            Không có gợi ý phù hợp. Hãy thử giảm bộ lọc hoặc tìm kiếm khác.
                                        </CardContent>
                                    </Card>
                                ) : (
                                    suggestions.map((user) => {
                                        return (
                                            <Card key={user.id} className="border-none shadow-lg bg-white dark:bg-card overflow-hidden">
                                                <Link to={`/profile/${user.username}`}>
                                                    <div
                                                        className="relative h-28 bg-gradient-to-br from-etechs-primary/30 via-white to-etechs-secondary/10 dark:from-etechs-secondary/30 dark:to-etechs-primary/10"
                                                    >
                                                        <div className="size-16 absolute left-1/2 -bottom-8 -translate-x-1/2">
                                                            <Avatar user={user} size="lg" className="ring-4 ring-white dark:ring-[#0a1f29]" />
                                                        </div>
                                                    </div>
                                                </Link>
                                                <CardContent className="pt-10 pb-4 px-4 flex flex-col gap-3">
                                                    <Link to={`/profile/${user.username}`} className="text-center space-y-0.5 hover:opacity-80 transition-opacity">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {user.role}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {user.className} • {user.school}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Lĩnh vực: {user.field}</p>
                                                    </Link>

                                                    <div className="flex flex-wrap justify-center gap-2">
                                                        {user.tags.includes("CLASS") && <Badge variant="outline">Chung lớp</Badge>}
                                                        {user.tags.includes("SCHOOL") && <Badge variant="outline">Chung trường</Badge>}
                                                        {user.tags.includes("FIELD") && <Badge variant="outline">Chung lĩnh vực</Badge>}
                                                        {user.mutuals > 0 && (
                                                            <Badge variant="outline" className="flex items-center gap-1">
                                                                <Users className="h-3 w-3" /> {user.mutuals} bạn chung
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {user.hats > 0 && (
                                                        <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold text-sm">
                                                            <GraduationCap className="h-5 w-5" />
                                                            <span>{user.hats} nón</span>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 gap-2">
                                                        {user.friendshipStatus === "FRIENDS" ? (
                                                            <Button className="rounded-full" variant="secondary" disabled>
                                                                <UserCheck className="h-4 w-4 mr-1" /> Bạn bè
                                                            </Button>
                                                        ) : user.friendshipStatus === "REQUEST_SENT" ? (
                                                            <Button className="rounded-full" variant="outline" disabled>
                                                                <Clock className="h-4 w-4 mr-1" /> Đã gửi lời mời
                                                            </Button>
                                                        ) : user.friendshipStatus === "REQUEST_RECEIVED" ? (
                                                            <Button
                                                                className="rounded-full"
                                                                disabled={processingIds.has(user.id)}
                                                                onClick={() => {
                                                                    if (user.friendRequestId) {
                                                                        handleAccept(user.id, user.friendRequestId);
                                                                    }
                                                                }}
                                                            >
                                                                {processingIds.has(user.id) ? (
                                                                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang chấp nhận...</>
                                                                ) : (
                                                                    <><UserCheck className="h-4 w-4 mr-1" /> Chấp nhận</>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                className="rounded-full"
                                                                disabled={processingIds.has(user.id) || !user.username}
                                                                onClick={() => {
                                                                    if (!user.username) return;
                                                                    handleConnect(user.id, user.username);
                                                                }}
                                                            >
                                                                {processingIds.has(user.id) ? (
                                                                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Đang gửi...</>
                                                                ) : (
                                                                    <><UserPlus className="h-4 w-4 mr-1" /> Kết nối</>
                                                                )}
                                                            </Button>
                                                        )}
                                                        <Button variant="outline" className="rounded-full">
                                                            Bỏ qua
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
