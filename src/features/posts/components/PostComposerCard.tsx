import { Image, BookOpen, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/features/shared/components/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface PostComposerCardProps {
  onOpen: (preselectedType?: string) => void;
}

const quickActions = [
  { icon: <Image className="h-4 w-4 text-green-600" />, label: "Ảnh / Video", type: "SOCIAL" },
  { icon: <BookOpen className="h-4 w-4 text-blue-600" />, label: "Học thuật", type: "ACADEMIC" },
  { icon: <MessageSquare className="h-4 w-4 text-orange-500" />, label: "Thảo luận", type: "DISCUSSION" },
];

export function PostComposerCard({ onOpen }: PostComposerCardProps) {
  const { user } = useAuthStore();
  const firstName = user?.displayName?.split(" ").at(-1) || user?.email?.split("@")[0] || "bạn";

  return (
    <Card className="border border-border/60 shadow-sm bg-card">
      {/* Main trigger row */}
      <div className="flex items-center gap-3 p-3 pb-2.5">
        <div className="shrink-0">
          <Avatar user={user as any} size="md" />
        </div>
        <button
          type="button"
          onClick={() => onOpen("SOCIAL")}
          className={cn(
            "flex-1 text-left px-4 py-2.5 rounded-full",
            "bg-muted/60 hover:bg-muted border border-border/40 hover:border-border/70",
            "text-muted-foreground text-sm transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
        >
          {firstName.charAt(0).toUpperCase() + firstName.slice(1)} đang nghĩ gì?
        </button>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* Quick action buttons */}
      <div className="flex px-1 py-0.5">
        {quickActions.map((action) => (
          <button
            key={action.type}
            type="button"
            onClick={() => onOpen(action.type)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2 rounded-lg",
              "text-muted-foreground text-xs font-medium",
              "hover:bg-muted/60 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            )}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
