import { Button } from "@/components/ui/button";
import { Avatar } from "@/features/shared/components/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { Image, PenSquare } from "lucide-react";

interface CreatePostTriggerProps {
  onClick: () => void;
}

export function CreatePostTrigger({ onClick }: CreatePostTriggerProps) {
  const { user } = useAuthStore();

  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 p-4">
      <div className="flex items-center gap-3">
        <Avatar user={user as any} size="md" />
        <button
          onClick={onClick}
          className="flex-1 text-left px-4 py-2.5 bg-muted/70 hover:bg-muted rounded-full text-muted-foreground text-sm transition-colors cursor-pointer"
        >
          Bạn đang nghĩ gì?
        </button>
        <Button
          onClick={onClick}
          size="icon"
          className="rounded-full h-9 w-9 bg-primary hover:bg-primary/90 shadow-sm"
        >
          <PenSquare className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40">
        <button
          onClick={onClick}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 text-xs font-medium transition-all"
        >
          <Image className="h-4 w-4" />
          Ảnh / Video
        </button>
      </div>
    </div>
  );
}
