import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/features/shared/components/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { Image, Video, X, Smile, MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { POST_TYPES, ACADEMIC_FIELDS } from '../constants/fields';

export interface ExistingMediaItem {
  id: string;
  url: string;
  mime_type?: string;
}

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string, files: File[], hashtags: string[], postType?: string, fieldId?: string) => void;
  isLoading?: boolean;
  // Edit mode
  editPostId?: string;
  initialContent?: string;
  initialMediaUrls?: ExistingMediaItem[];
  initialPostType?: string;
  initialFieldId?: string;
  onUpdate?: (postId: string, formData: FormData) => void;
}

export function CreatePostModal({ open, onOpenChange, onSubmit, isLoading = false, editPostId, initialContent, initialMediaUrls, initialPostType, initialFieldId, onUpdate }: CreatePostModalProps) {
  const isEditMode = Boolean(editPostId);
  const { user } = useAuthStore();
  const [content, setContent] = useState(initialContent ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [keepMediaItems, setKeepMediaItems] = useState<ExistingMediaItem[]>(initialMediaUrls ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState(initialPostType ?? 'SOCIAL');
  const [fieldId, setFieldId] = useState(initialFieldId ?? '');
  const [showFieldOptions, setShowFieldOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync initial values when modal opens in edit mode
  useEffect(() => {
    if (open) {
      setContent(initialContent ?? '');
      setFiles([]);
      setKeepMediaItems(initialMediaUrls ?? []);
      setPostType(initialPostType ?? 'SOCIAL');
      setFieldId(initialFieldId ?? '');
      setShowFieldOptions(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0 && keepMediaItems.length === 0) return;
    try {
      setIsSubmitting(true);
      if (isEditMode && editPostId && onUpdate) {
        const formData = new FormData();
        formData.append('content_text', content);
        formData.append('post_type', postType);
        formData.append('field_id', fieldId);
        formData.append('keep_media_urls', JSON.stringify(keepMediaItems.map(m => m.url)));
        files.forEach(f => formData.append('files', f));
        await onUpdate(editPostId, formData);
      } else {
        await onSubmit(content, files, [], postType, fieldId);
      }
      handleReset();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to save post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setFiles([]);
    setKeepMediaItems([]);
    setPostType('SOCIAL');
    setFieldId('');
    setShowFieldOptions(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files;
    if (!chosen) return;
    const arr = Array.from(chosen);
    setFiles(prev => [...prev, ...arr].slice(0, 10));
  };

  const fileType = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Cập nhật nội dung và hình ảnh bài viết' : 'Chia sẻ suy nghĩ, hình ảnh hoặc video của bạn với mọi người'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar user={user as any} size="md" />
            <div>
              <p className="font-semibold text-sm">{user?.displayName || user?.email}</p>
              <p className="text-xs text-muted-foreground">Công khai</p>
            </div>
          </div>

          {/* Post Type Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {POST_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPostType(t.value)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium transition-all border', postType === t.value ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border')}
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
              onChange={e => setContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì?"
              className="w-full px-4 py-3 bg-transparent border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground resize-none min-h-[120px] text-base leading-relaxed rounded-lg transition-all"
              rows={4}
              maxLength={5000}
            />
            {content.length > 0 && <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">{content.length} / 5000</div>}
          </div>

          {/* Field Selector (below content) */}
          <div className="space-y-2">
            <button type="button" onClick={() => setShowFieldOptions(!showFieldOptions)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all">
              <ChevronDown className={cn('w-4 h-4 transition-transform', showFieldOptions && 'rotate-180')} />
              {fieldId ? `Lĩnh vực: ${ACADEMIC_FIELDS.find(f => f.value === fieldId)?.label || ''}` : 'Chọn lĩnh vực (tuỳ chọn)'}
            </button>

            {showFieldOptions && (
              <div className="animate-in fade-in-0 slide-in-from-top-1">
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setFieldId('')} className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-all border', !fieldId ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted')}>
                    Tất cả
                  </button>
                  {ACADEMIC_FIELDS.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFieldId(fieldId === f.value ? '' : f.value)}
                      className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-all border', fieldId === f.value ? f.color + ' border-current' : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted')}
                    >
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Existing Media (edit mode) */}
          {isEditMode && keepMediaItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ảnh / video hiện tại:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {keepMediaItems.map(item => (
                  <div key={item.id} className="relative aspect-square group">
                    {(item.mime_type ?? '').startsWith('video/') ? <video src={item.url} className="w-full h-full object-cover rounded-lg" /> : <img src={item.url} alt="existing media" className="w-full h-full object-cover rounded-lg" />}
                    <button type="button" onClick={() => setKeepMediaItems(prev => prev.filter(m => m.url !== item.url))} className="absolute -top-2 -right-2 p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New File Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {files.map((file, index) => {
                const url = URL.createObjectURL(file);
                const type = fileType(file);
                return (
                  <div key={index} className="relative aspect-square group">
                    {type === 'image' ? (
                      <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                    ) : type === 'video' ? (
                      <video src={url} className="w-full h-full object-cover rounded-lg" controls />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                        <p className="text-xs text-center p-2">{file.name}</p>
                      </div>
                    )}
                    <button type="button" onClick={() => handleRemoveFile(index)} className="absolute -top-2 -right-2 p-1.5 bg-destructive rounded-full text-white hover:bg-destructive/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
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
            <span className="text-xs text-muted-foreground">{files.length > 0 && `${files.length} tệp`}</span>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={(!content.trim() && files.length === 0 && keepMediaItems.length === 0) || isSubmitting || isLoading || content.length > 5000} className="min-w-24">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                  <span>{isEditMode ? 'Lưu...' : 'Đăng...'}</span>
                </div>
              ) : isEditMode ? (
                'Lưu'
              ) : (
                'Đăng bài'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
