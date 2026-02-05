import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GraduationCap, Search, Sparkles, Users } from "lucide-react";

const TAB_OPTIONS = [
    { value: "ALL", label: "Tất cả" },
    { value: "CLASS", label: "Chung lớp" },
    { value: "SCHOOL", label: "Chung trường" },
    { value: "FIELD", label: "Chung lĩnh vực" },
] as const;

type TabValue = (typeof TAB_OPTIONS)[number]["value"];

type Suggestion = {
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

const MOCK_SUGGESTIONS: Suggestion[] = [
    {
        id: "u1",
        name: "Lê Công Thảo",
        username: "lecongthao",
        role: "Học sinh",
        className: "Lớp 11A1",
        school: "THPT Nguyễn Du",
        field: "Toán học",
        hats: 4,
        mutuals: 6,
        tags: ["CLASS", "SCHOOL"],
        avatar: "https://i.pravatar.cc/120?img=10",
    },
    {
        id: "u2",
        name: "Nguyễn Minh Anh",
        username: "minhanh",
        role: "Giáo viên",
        className: "Khối 11",
        school: "THPT Nguyễn Du",
        field: "Vật lý",
        hats: 7,
        mutuals: 12,
        tags: ["SCHOOL", "FIELD"],
        avatar: "https://i.pravatar.cc/120?img=32",
    },
    {
        id: "u3",
        name: "Trần Hoàng Phúc",
        username: "hoangphuc",
        role: "Giảng viên",
        className: "Lớp 12C2",
        school: "THPT Trần Phú",
        field: "Tin học",
        hats: 9,
        mutuals: 20,
        tags: ["FIELD"],
        avatar: "https://i.pravatar.cc/120?img=15",
    },
    {
        id: "u4",
        name: "Phạm Thu Hà",
        username: "thuhap",
        role: "Học sinh",
        className: "Lớp 11B2",
        school: "THPT Nguyễn Du",
        field: "Hóa học",
        hats: 3,
        mutuals: 4,
        tags: ["CLASS", "SCHOOL"],
        avatar: "https://i.pravatar.cc/120?img=45",
    },
    {
        id: "u5",
        name: "Đỗ Quang Huy",
        username: "quanghuy",
        role: "Giáo viên",
        className: "Khối 10",
        school: "THPT Lê Quý Đôn",
        field: "Sinh học",
        hats: 6,
        mutuals: 8,
        tags: ["SCHOOL", "FIELD"],
        avatar: "https://i.pravatar.cc/120?img=11",
    },
    {
        id: "u6",
        name: "Bùi Ngọc Lan",
        username: "ngoclan",
        role: "Học sinh",
        className: "Lớp 10A2",
        school: "THPT Lê Quý Đôn",
        field: "Ngữ văn",
        hats: 5,
        mutuals: 7,
        tags: ["CLASS", "FIELD"],
        avatar: "https://i.pravatar.cc/120?img=25",
    },
];

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

    const suggestions = useMemo(() => {
        const filteredByTab = activeTab === "ALL" ? MOCK_SUGGESTIONS : MOCK_SUGGESTIONS.filter((item) => item.tags.includes(activeTab));

        return filteredByTab.filter((item) => {
            const matchesQuery = [item.name, item.username, item.school, item.field, item.className]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase());
            const matchesHats = item.hats >= minHats;
            return matchesQuery && matchesHats;
        });
    }, [activeTab, query, minHats]);

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
                                                <Badge variant="outline" className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> {user.mutuals} bạn chung
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold text-sm">
                                                <GraduationCap className="h-5 w-5" />
                                                <span>{user.hats} nón</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                <Button className="rounded-full">Kết nối</Button>
                                                <Button variant="outline" className="rounded-full">
                                                    Bỏ qua
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
