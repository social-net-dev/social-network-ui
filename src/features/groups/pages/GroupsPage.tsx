import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function GroupsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-etechs-primary/10 text-etechs-primary flex items-center justify-center">
                    <Users className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nhóm cộng đồng</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Danh sách nhóm và cộng đồng học tập đang cập nhật.</p>
                </div>
            </div>

            <Card className="border-none shadow-lg bg-white dark:bg-card">
                <CardHeader>
                    <CardTitle className="text-lg">Khám phá cộng đồng</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-500 dark:text-gray-400">Tính năng đang phát triển. Hãy quay lại sau.</CardContent>
            </Card>
        </div>
    );
}
