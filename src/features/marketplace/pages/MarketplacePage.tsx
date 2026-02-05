import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

export function MarketplacePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Store className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Không gian trao đổi tài nguyên học tập sắp ra mắt.</p>
                </div>
            </div>

            <Card className="border-none shadow-lg bg-white dark:bg-card">
                <CardHeader>
                    <CardTitle className="text-lg">Gian hàng nổi bật</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-500 dark:text-gray-400">Tính năng đang phát triển. Hãy quay lại sau.</CardContent>
            </Card>
        </div>
    );
}
