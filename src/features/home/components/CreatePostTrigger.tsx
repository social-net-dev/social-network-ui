import { Button } from "@/components/ui/button";
import { Avatar } from "@/features/shared/components/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { PenSquare } from "lucide-react";

interface CreatePostTriggerProps {
  onClick: () => void;
}

export function CreatePostTrigger({ onClick }: CreatePostTriggerProps) {
  const { user } = useAuthStore();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="md" />
        <button
          onClick={onClick}
          className="flex-1 text-left px-4 py-3 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"
        >
          Bạn đang nghĩ gì?
        </button>
        <Button
          onClick={onClick}
          size="icon"
          className="rounded-full h-10 w-10"
        >
          <PenSquare className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
