import React, { useRef } from 'react';
import { FilePreview } from './FilePreview';

interface MessageInputProps {
  text: string;
  selectedFiles: File[];
  previews: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onTextChange: (text: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onSend: () => void;
  onAttachClick: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ text, selectedFiles, previews, fileInputRef, onTextChange, onFileSelect, onRemoveFile, onSend, onAttachClick }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);

    // Auto-resize
    if (textareaRef.current) {
      // Prevent the textarea from growing the entire page. Cap height to max (128px = Tailwind max-h-32).
      const MAX_PX = 128;
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, MAX_PX);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <footer className="border-t px-4 py-3 bg-card">
      {/* File preview area */}
      <FilePreview files={selectedFiles} previews={previews} onRemove={onRemoveFile} />

      <div className="flex gap-2 items-end">
        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={onFileSelect} />
        <button className="px-3 py-2 border border-border rounded hover:bg-muted transition-colors" onClick={onAttachClick} title="Đính kèm ảnh">
          📎
        </button>
        <textarea ref={textareaRef} value={text} onChange={handleTextChange} placeholder="Nhập tin nhắn..." className="flex-1 p-2 rounded border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none max-h-32 overflow-y-auto" rows={1} onKeyDown={handleKeyDown} />
        <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90" onClick={onSend}>
          Gửi
        </button>
      </div>
    </footer>
  );
};
