import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (content: string) => Promise<void>;
}

export function ShareDialog({ isOpen, onClose, onShare }: ShareDialogProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chia sẻ bài viết</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Thêm suy nghĩ của bạn..."
            rows={4}
            autoFocus
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang chia sẻ..." : "Chia sẻ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
