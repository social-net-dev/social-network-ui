import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Search, Sparkles, Users } from "lucide-react";
import api from "@/lib/api";
import { FriendsAPI } from "@/lib/api/generated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/config";
import { appendAuthToken } from "@/lib/api/transforms/common";

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
};

interface ApiSuggestion {
    id: string;
    name: string;
    username?: string | null;
    avatar_path?: string | null;
    role?: string;
    tags?: string[];
    connected_via?: string;
    target_name?: string;
}

function mapApiToSuggestion(r: ApiSuggestion): Suggestion {
    const tags = (r.tags || []) as Array<"CLASS" | "SCHOOL" | "FIELD">;
    const roleMap: Record<string, "Học sinh" | "Giáo viên" | "Giảng viên"> = {
        TEACH_AT_SCHOOL: "Giáo viên",
        TEACHES: "Giáo viên",
        STUDY_AT_SCHOOL: "Học sinh",
        STUDY_IN: "Học sinh",
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
        className: r.target_name || "—",
        school: r.connected_via === "School" ? r.target_name || "—" : "—",
        field: tags.includes("FIELD") ? r.target_name || "—" : "—",
        hats: 0,
        mutuals: 0,
        tags: tags.length ? tags : (r.role ? ["SCHOOL"] : ["CLASS", "SCHOOL", "FIELD"]),
        avatar: r.avatar_path
            ? (r.avatar_path.startsWith("http")
                ? r.avatar_path
                : `${getApiBaseUrl().replace(/\/+$/, "")}${appendAuthToken(r.avatar_path)}`)
            : undefined,
    };
}

async function fetchSuggestions(filter: TabValue, schoolId?: number, classId?: number, fieldId?: number): Promise<Suggestion[]> {
    const params = new URLSearchParams({ filter });
    if (schoolId != null && schoolId > 0) params.set("school_id", String(schoolId));
    if (classId != null && classId > 0) params.set("class_id", String(classId));
    if (fieldId != null && fieldId > 0) params.set("field_id", String(fieldId));
    const res = await api.get<{ suggestions: ApiSuggestion[] }>(`recommendations/suggestions/?${params.toString()}`);
    const data = res.data;
    const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
    return list.map(mapApiToSuggestion);
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export function RecommendationPage() {
    const [activeTab, setActiveTab] = useState<TabValue>("ALL");
    const [query, setQuery] = useState("");
    const [minHats, setMinHats] = useState(0);
    const schoolId = 1;
    const classId = 1;
    const fieldId = 1;
    const queryClient = useQueryClient();

    const connectMutation = useMutation({
        mutationFn: async (addressee_username: string) => {
            return FriendsAPI.createFriendRequestFriendsRequestsPost({ addressee_username });
        },
        onSuccess: () => {
            // refresh suggestions (optional) + notifications list
            queryClient.invalidateQueries({ queryKey: ["recommendations", "suggestions"] });
        },
    });

    const { data: apiSuggestions = [], isLoading } = useQuery({
        queryKey: ["recommendations", "suggestions", activeTab, schoolId, classId, fieldId],
        queryFn: () => fetchSuggestions(activeTab, schoolId, classId, fieldId),
        staleTime: 60 * 1000,
    });

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
                                    suggestions.map((user) => (
                                        <Card key={user.id} className="border-none shadow-lg bg-white dark:bg-card overflow-hidden">
                                            <div className="relative h-28 bg-gradient-to-br from-etechs-primary/30 via-white to-etechs-secondary/10 dark:from-etechs-secondary/30 dark:to-etechs-primary/10">
                                                <Avatar className="size-16 absolute left-1/2 -bottom-8 -translate-x-1/2 ring-4 ring-white dark:ring-[#0a1f29]">
                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <CardContent className="pt-10 pb-4 px-4 flex flex-col gap-3">
                                                <div className="text-center space-y-0.5">
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
                                                </div>

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
                                                    <Button
                                                        className="rounded-full"
                                                        disabled={connectMutation.isPending || !user.username}
                                                        onClick={() => {
                                                            if (!user.username) return;
                                                            connectMutation.mutate(user.username);
                                                        }}
                                                    >
                                                        {connectMutation.isPending ? "Đang gửi..." : "Kết nối"}
                                                    </Button>
                                                    <Button variant="outline" className="rounded-full">
                                                        Bỏ qua
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
