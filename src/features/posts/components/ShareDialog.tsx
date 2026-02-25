import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (content: string) => Promise<void>;
}

export function ShareDialog({ isOpen, onClose, onShare }: ShareDialogProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onShare(content);
      setContent("");
      onClose();
    } catch (error) {
      console.error("Failed to share:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Chia sẻ bài viết
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Thêm suy nghĩ của bạn..."
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Đang chia sẻ..." : "Chia sẻ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
