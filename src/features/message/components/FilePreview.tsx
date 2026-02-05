import React from 'react';

interface FilePreviewProps {
  files: File[];
  previews: string[];
  onRemove: (index: number) => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ files, previews, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {files.map((file, idx) => {
        const preview = previews[idx];
        const isImage = file.type.startsWith('image/');

        return (
          <div key={idx} className="relative group">
            {isImage ? (
              <img
                src={preview}
                alt={file.name}
                className="w-20 h-20 object-cover rounded border"
                onLoad={() => {
                  try {
                    URL.revokeObjectURL(preview);
                  } catch (e) {
                    // ignore
                  }
                }}
              />
            ) : (
              <div className="w-20 h-20 flex items-center justify-center rounded border bg-gray-50 dark:bg-gray-800 text-xs p-1 text-center">
                <div>
                  <div className="font-semibold truncate">{file.name}</div>
                  <a href={preview} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline">
                    Mở
                  </a>
                </div>
              </div>
            )}
            <button onClick={() => onRemove(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600" title="Xóa">
              ×
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 truncate">{file.name}</div>
          </div>
        );
      })}
    </div>
  );
};
