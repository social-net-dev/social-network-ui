import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/features/shared/components/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { Image, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { POST_TYPES, ACADEMIC_FIELDS } from "../constants/fields";

interface CreatePostFormProps {
  onSubmit: (content: string, files: File[], postType?: string, fieldId?: string) => void;
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
  const [postType, setPostType] = useState("SOCIAL");
  const [fieldId, setFieldId] = useState("");
  const [showOptions, setShowOptions] = useState(false);
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
      await onSubmit(content, files, postType, fieldId);
      setContent("");
      setFiles([]);
      setPostType("SOCIAL");
      setFieldId("");
      setShowOptions(false);
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
    <div className="bg-card rounded-xl shadow-sm hover:shadow-md transition-all-300 p-5 mb-6 border border-border/50 animate-fadeIn">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar user={user} size="md" className="ring-2 ring-transparent hover:ring-primary/20 transition-all-300" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Post Type Selector */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPostType(t.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all-300 border",
                    postType === t.value
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
                  )}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì?"
            className="w-full px-0 py-3 border-0 focus:ring-0 text-foreground placeholder:text-muted-foreground/50 resize-none min-h-[120px] transition-all-300 text-base leading-relaxed"
            rows={4}
          />

          {/* Field Selector (below content) */}
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all-300"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", showOptions && "rotate-180")} />
              {fieldId ? `Lĩnh vực: ${ACADEMIC_FIELDS.find(f => f.value === fieldId)?.label || ''}` : 'Chọn lĩnh vực (tuỳ chọn)'}
            </button>

            {showOptions && (
              <div className="mt-2 animate-fadeIn">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFieldId("")}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all-300 border",
                      !fieldId
                        ? "bg-secondary text-secondary-foreground border-secondary"
                        : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                    )}
                  >
                    Tất cả
                  </button>
                  {ACADEMIC_FIELDS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFieldId(fieldId === f.value ? "" : f.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium transition-all-300 border",
                        fieldId === f.value
                          ? f.color + " border-current"
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                      )}
                    >
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 animate-fadeInUp">
              {files.map((file, index) => {
                const url = URL.createObjectURL(file);
                return (
                  <div key={index} className="relative w-28 h-28 group">
                    <img
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover rounded-lg shadow-sm group-hover:shadow-md transition-all-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/90 shadow-lg transition-all-300 hover:scale-110"
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

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all-300 rounded-full px-4"
              onClick={() => inputRef.current?.click()}
              disabled={files.length >= 8}
            >
              <Image className="w-5 h-5 mr-2" />
              Thêm ảnh / tệp
            </Button>
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-xs text-muted-foreground transition-colors-300",
                content.length > 500 && "text-orange-500 dark:text-orange-400",
                content.length > 1000 && "text-destructive"
              )}>
                {content.length} / 1000
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting || isLoading || content.length > 1000}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all-300 rounded-full px-6 hover-lift"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                    <span>Đang đăng...</span>
                  </div>
                ) : (
                  "Đăng bài"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
