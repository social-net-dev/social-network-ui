import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText } from "lucide-react";

export function MessagesPage() {
    const [params] = useSearchParams();
    const user = params.get("user");

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <MessageSquareText className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tin nhắn</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user ? `Đang mở cuộc trò chuyện với ${user}` : "Chọn một người bạn để bắt đầu trò chuyện."}
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-lg bg-white dark:bg-card">
                <CardHeader>
                    <CardTitle className="text-lg">Khu vực chat</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-500 dark:text-gray-400">
                    Tính năng chat đang được hoàn thiện. Bạn có thể quay lại sau.
                </CardContent>
            </Card>
        </div>
    );
}
