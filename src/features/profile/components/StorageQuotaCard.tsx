import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { HardDrive, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface StorageQuotaCardProps {
  quotaMb: number;
}

export function StorageQuotaCard({ quotaMb }: StorageQuotaCardProps) {
  const isVerified = quotaMb >= 5120; // 5GB
  const totalGb = (quotaMb / 1024).toFixed(quotaMb % 1024 === 0 ? 0 : 1);
  
  // Mock usage for UI demonstration (In real app, fetch from backend)
  const usedMb = isVerified ? 1200 : 45;
  const usagePercent = (usedMb / quotaMb) * 100;

  return (
    <Card className="rounded-xl border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-2 pt-5 px-5 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-primary" />
          Dung lượng lưu trữ
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-xs">
              {isVerified 
                ? "Bạn đang sở hữu 5GB dung lượng lưu trữ dành cho tài khoản đã xác minh." 
                : "Tài khoản chưa xác minh được giới hạn 100MB. Hãy xác minh để nhận 5GB."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        <div className="flex justify-between items-end">
          <p className="text-2xl font-black text-foreground">{totalGb}<span className="text-sm font-medium ml-1">GB</span></p>
          <p className="text-xs text-muted-foreground mb-1">{usedMb}MB / {quotaMb}MB</p>
        </div>
        <Progress value={usagePercent} className="h-2" />
        {!isVerified && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Sắp hết dung lượng? Xác minh ngay để tăng lên 5GB.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
