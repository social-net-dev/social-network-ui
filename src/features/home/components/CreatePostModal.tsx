import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/features/shared/components/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { Image, Video, X, Smile, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { POST_TYPES, ACADEMIC_FIELDS } from "../constants/fields";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string, files: File[], hashtags: string[], postType?: string, fieldId?: string) => void;
  isLoading?: boolean;
}

export function CreatePostModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: CreatePostModalProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState("SOCIAL");
  const [fieldId, setFieldId] = useState("");
  const [showFieldOptions, setShowFieldOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(URL.createObjectURL(file)));
    };
  }, [files]);

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) return;
    try {
      setIsSubmitting(true);
      await onSubmit(content, files, [], postType, fieldId);
      handleReset();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContent("");
    setFiles([]);
    setPostType("SOCIAL");
    setFieldId("");
    setShowFieldOptions(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    const arr = Array.from(chosen);
    setFiles((prev) => [...prev, ...arr].slice(0, 10));
  };

  const fileType = (file: File) => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "file";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo bài viết</DialogTitle>
          <DialogDescription>
            Chia sẻ suy nghĩ, hình ảnh hoặc video của bạn với mọi người
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar user={user as any} size="md" />
            <div>
              <p className="font-semibold text-sm">{user?.display_name || user?.displayName || user?.email}</p>
              <p className="text-xs text-muted-foreground">Công khai</p>
            </div>
          </div>

          {/* Post Type Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {POST_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPostType(t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  postType === t.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì?"
              className="w-full px-4 py-3 bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground resize-none min-h-[120px] text-base leading-relaxed rounded-lg transition-all"
              rows={4}
              maxLength={5000}
            />
            {content.length > 0 && (
              <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                {content.length} / 5000
              </div>
            )}
          </div>

          {/* Field Selector (below content) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowFieldOptions(!showFieldOptions)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFieldOptions && "rotate-180")} />
              {fieldId ? `Lĩnh vực: ${ACADEMIC_FIELDS.find(f => f.value === fieldId)?.label || ''}` : 'Chọn lĩnh vực (tuỳ chọn)'}
            </button>

            {showFieldOptions && (
              <div className="animate-in fade-in-0 slide-in-from-top-1">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFieldId("")}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                      !fieldId ? "bg-secondary text-secondary-foreground border-secondary" : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
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
                        "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                        fieldId === f.value ? f.color + " border-current" : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted"
                      )}
                    >
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {files.map((file, index) => {
                const url = URL.createObjectURL(file);
                const type = fileType(file);
                return (
                  <div key={index} className="relative aspect-square group">
                    {type === "image" ? (
                      <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                    ) : type === "video" ? (
                      <video src={url} className="w-full h-full object-cover rounded-lg" controls />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                        <p className="text-xs text-center p-2">{file.name}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />

          {/* Actions Bar */}
          <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={files.length >= 10} className="h-9 w-9 p-0 hover:bg-green-600/10" title="Thêm ảnh">
                <Image className="w-5 h-5 text-green-600" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={files.length >= 10} className="h-9 w-9 p-0 hover:bg-red-600/10" title="Thêm video">
                <Video className="w-5 h-5 text-red-600" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-yellow-600/10" disabled title="Thêm emoji (Sắp có)">
                <Smile className="w-5 h-5 text-yellow-600" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-blue-600/10" disabled title="Thêm vị trí (Sắp có)">
                <MapPin className="w-5 h-5 text-blue-600" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {files.length > 0 && `${files.length} tệp`}
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={(!content.trim() && files.length === 0) || isSubmitting || isLoading || content.length > 5000}
              className="min-w-24"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                  <span>Đăng...</span>
                </div>
              ) : (
                "Đăng bài"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
