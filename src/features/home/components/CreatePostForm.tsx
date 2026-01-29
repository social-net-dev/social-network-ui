import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/features/shared/components/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { Image, X } from "lucide-react";

interface CreatePostFormProps {
  onSubmit: (content: string, files: File[]) => void;
  isLoading?: boolean;
}

export function CreatePostForm({
  onSubmit,
  isLoading = false,
}: CreatePostFormProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, [files]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      setIsSubmitting(true);
      await onSubmit(content, files);
      setContent("");
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    const arr = Array.from(chosen);
    setFiles((prev) => [...prev, ...arr].slice(0, 8));
  };

  return (
    <div className="bg-white dark:bg-[#0A2737] rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-start space-x-4">
        <Avatar user={user} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full px-0 py-2 border-0 focus:ring-0 text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none min-h-[100px]"
            rows={3}
          />
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((file, index) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={index} className="relative w-32 h-32">
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 dark:text-gray-400"
              onClick={() => inputRef.current?.click()}
            >
              <Image className="w-5 h-5 mr-1" />
              Thêm ảnh / tệp
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting || isLoading}
              className="bg-[#1b7a78] hover:bg-teal-700 text-white"
            >
              {isSubmitting ? "Đang đăng..." : "Đăng bài"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
