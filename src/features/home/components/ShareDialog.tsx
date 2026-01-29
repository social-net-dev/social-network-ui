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
      <div className="bg-white dark:bg-[#0A2737] rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chia sẻ bài viết
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
              className="bg-[#1b7a78] hover:bg-teal-700"
            >
              {isSubmitting ? "Đang chia sẻ..." : "Chia sẻ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
