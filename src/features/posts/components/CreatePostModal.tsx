import { useState, useRef, useEffect, useCallback, useDeferredValue } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/features/shared/components/Avatar";
import { useAuthStore } from "@/stores/authStore";
import { Image, Video, X, Globe, Users, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { POST_TYPES, ACADEMIC_FIELDS } from "../constants/fields";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string, files: File[], hashtags: string[], postType?: string, fieldId?: string) => void;
  isLoading?: boolean;
  initialPostType?: string;
}

const PRIVACY_OPTIONS = [
  { value: "PUBLIC", label: "Mọi người", icon: Globe, className: "text-green-600" },
  { value: "FRIENDS", label: "Bạn bè", icon: Users, className: "text-blue-600" },
  { value: "PRIVATE", label: "Chỉ mình tôi", icon: Lock, className: "text-muted-foreground" },
] as const;

const PLACEHOLDERS: Record<string, string> = {
  SOCIAL: "Bạn đang nghĩ gì?",
  ACADEMIC: "Chia sẻ kiến thức hoặc tài liệu học thuật...",
  RESOURCE: "Chia sẻ tài nguyên hữu ích...",
  DISCUSSION: "Bắt đầu một cuộc thảo luận...",
};

const MAX_CHARS = 5000;
const WARN_THRESHOLD = 0.8;
const DANGER_THRESHOLD = 0.95;

// Circular SVG ring for character count
function CharRing({ count, max }: { count: number; max: number }) {
  const ratio = count / max;
  const size = 28;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(ratio, 1);

  const color =
    ratio >= DANGER_THRESHOLD
      ? "#ef4444"
      : ratio >= WARN_THRESHOLD
      ? "#f59e0b"
      : "hsl(var(--primary))";

  if (count === 0) return null;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.15s ease, stroke 0.3s ease" }}
        />
      </svg>
      {ratio >= WARN_THRESHOLD && (
        <span
          className="absolute text-[9px] font-semibold tabular-nums"
          style={{ color, lineHeight: 1 }}
        >
          {max - count}
        </span>
      )}
    </div>
  );
}

// Smart media grid
function MediaGrid({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (files.length === 0) return null;

  const getUrl = (f: File) => URL.createObjectURL(f);
  const isVideo = (f: File) => f.type.startsWith("video/");
  const isImage = (f: File) => f.type.startsWith("image/");

  const renderItem = (file: File, index: number, className: string, overlay?: React.ReactNode) => (
    <div key={index} className={cn("relative group overflow-hidden rounded-lg bg-muted", className)}>
      {isImage(file) ? (
        <img src={getUrl(file)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
      ) : isVideo(file) ? (
        <video src={getUrl(file)} className="w-full h-full object-cover" controls />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-2">
          <p className="text-xs text-center text-muted-foreground break-all">{file.name}</p>
        </div>
      )}
      {overlay}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white shadow transition-opacity opacity-0 group-hover:opacity-100"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  const shown = files.slice(0, 4);
  const extra = files.length - 4;

  if (files.length === 1) {
    return <div className="rounded-lg overflow-hidden max-h-80">{renderItem(files[0], 0, "h-72 w-full")}</div>;
  }
  if (files.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden h-60">
        {shown.map((f, i) => renderItem(f, i, "h-full"))}
      </div>
    );
  }
  if (files.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden h-60">
        {renderItem(files[0], 0, "row-span-2 h-full")}
        <div className="grid grid-rows-2 gap-1 h-full">
          {renderItem(files[1], 1, "h-full")}
          {renderItem(files[2], 2, "h-full")}
        </div>
      </div>
    );
  }
  // 4+
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg overflow-hidden h-60">
      {shown.map((f, i) =>
        renderItem(
          f,
          i,
          "h-full",
          i === 3 && extra > 0 ? (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <span className="text-white font-bold text-2xl">+{extra}</span>
            </div>
          ) : undefined
        )
      )}
    </div>
  );
}

export function CreatePostModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  initialPostType = "SOCIAL",
}: CreatePostModalProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState(initialPostType);
  const [fieldId, setFieldId] = useState("");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">("PUBLIC");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const deferredContent = useDeferredValue(content);

  // Sync postType when modal is opened with a pre-selected type
  useEffect(() => {
    if (open) {
      setPostType(initialPostType);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open, initialPostType]);

  // Auto-grow textarea
  const autoGrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, []);

  useEffect(() => {
    autoGrow();
  }, [deferredContent, autoGrow]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(URL.createObjectURL(f)));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setContent("");
    setFiles([]);
    setPostType("SOCIAL");
    setFieldId("");
    setPrivacy("PUBLIC");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    setFiles((prev) => [...prev, ...Array.from(chosen)].slice(0, 10));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (dropped.length > 0) {
      setFiles((prev) => [...prev, ...dropped].slice(0, 10));
    }
  };

  const selectedPrivacy = PRIVACY_OPTIONS.find((p) => p.value === privacy)!;
  const PrivacyIcon = selectedPrivacy.icon;
  const canSubmit = (content.trim().length > 0 || files.length > 0) && !isSubmitting && !isLoading && content.length <= MAX_CHARS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg p-0 gap-0 overflow-hidden max-h-[92vh] flex flex-col"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag & drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Image className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="text-primary font-semibold">Thả file vào đây</p>
              <p className="text-primary/70 text-sm">Ảnh và video được hỗ trợ</p>
            </div>
          </div>
        )}

        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 shrink-0">
          <DialogTitle className="text-base font-semibold text-center">Tạo bài viết</DialogTitle>
        </DialogHeader>

        <Separator />

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* User info + privacy */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <Avatar user={user as any} size="md" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm leading-tight">{user?.displayName || user?.email}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                      "bg-muted hover:bg-muted/80 transition-colors border border-border/50",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    )}
                  >
                    <PrivacyIcon className={cn("h-3 w-3", selectedPrivacy.className)} />
                    <span>{selectedPrivacy.label}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {PRIVACY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setPrivacy(opt.value)}
                        className={cn("gap-2 text-sm", privacy === opt.value && "bg-muted font-medium")}
                      >
                        <Icon className={cn("h-4 w-4", opt.className)} />
                        {opt.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Textarea */}
          <div className="px-4 pb-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDERS[postType] ?? PLACEHOLDERS.SOCIAL}
              className={cn(
                "w-full bg-transparent text-foreground placeholder:text-muted-foreground",
                "resize-none outline-none border-none ring-0 focus:ring-0",
                "text-base leading-relaxed py-1",
                content.length > MAX_CHARS && "text-destructive"
              )}
              style={{ minHeight: 80, maxHeight: 240 }}
              maxLength={MAX_CHARS + 50}
            />
          </div>

          {/* Media grid */}
          {files.length > 0 && (
            <div className="px-4 pb-3">
              <MediaGrid files={files} onRemove={handleRemoveFile} />
            </div>
          )}

          {/* Post type toolbar */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1 flex-wrap">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPostType(t.value)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                    postType === t.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}

              {/* Field dropdown — only for non-SOCIAL types */}
              {postType !== "SOCIAL" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                        fieldId
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      )}
                    >
                      {fieldId
                        ? ACADEMIC_FIELDS.find((f) => f.value === fieldId)?.icon + " " + ACADEMIC_FIELDS.find((f) => f.value === fieldId)?.label
                        : "Lĩnh vực"}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-52 max-h-64 overflow-y-auto">
                    <DropdownMenuItem
                      onClick={() => setFieldId("")}
                      className={cn("gap-2 text-xs", !fieldId && "bg-muted font-medium")}
                    >
                      Không chọn
                    </DropdownMenuItem>
                    {ACADEMIC_FIELDS.map((f) => (
                      <DropdownMenuItem
                        key={f.value}
                        onClick={() => setFieldId(fieldId === f.value ? "" : f.value)}
                        className={cn("gap-2 text-xs", fieldId === f.value && "bg-muted font-medium")}
                      >
                        {f.icon} {f.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions footer */}
        <div className="px-4 py-3 shrink-0 flex items-center gap-2">
          {/* Media buttons */}
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 10}
              className="h-9 w-9 hover:bg-green-500/10 rounded-lg"
              title="Thêm ảnh / video"
            >
              <Image className="h-5 w-5 text-green-600" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= 10}
              className="h-9 w-9 hover:bg-red-500/10 rounded-lg"
              title="Thêm video"
            >
              <Video className="h-5 w-5 text-red-500" />
            </Button>
          </div>

          <div className="flex-1" />

          {/* Char ring */}
          <CharRing count={content.length} max={MAX_CHARS} />

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="sm"
            className="min-w-[80px] rounded-full font-semibold"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-1.5">
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent" />
                <span>Đăng...</span>
              </div>
            ) : (
              "Đăng bài"
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}

