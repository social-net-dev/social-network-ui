import React from 'react';

interface FilePreviewProps {
  files: File[];
  previews: string[];
  onRemove: (index: number) => void;
}

const getAssetIconPath = (filename?: string, mime?: string) => {
  const ext = (filename || '').split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    pdf: 'pdf-file.svg',
    doc: 'free-doc.svg',
    docx: 'free-doc.svg',
    xls: 'sheet-file.svg',
    xlsx: 'sheet-file.svg',
    csv: 'sheet-file.svg',
    ppt: 'ppt-file.svg',
    pptx: 'ppt-file.svg',
    json: 'json-file.svg',
    html: 'html-file.svg',
    mp3: 'free-audio.svg',
    wav: 'free-audio.svg',
    zip: 'zip-file.svg',
  };
  let key = ext;
  if (!key && mime) {
    if (mime.includes('pdf')) key = 'pdf';
    else if (mime.includes('word') || mime.includes('officedocument')) key = 'doc';
    else if (mime.includes('spreadsheet') || mime.includes('excel')) key = 'xls';
    else if (mime.includes('json')) key = 'json';
    else if (mime.includes('html')) key = 'html';
    else if (mime.includes('audio')) key = 'mp3';
  }
  const file = map[key] || 'default-file-icon.svg';
  try {
    return new URL(`../../../assets/icon-file/${file}`, import.meta.url).href;
  } catch (e) {
    return `/assets/icon-file/${file}`;
  }
};

export const FilePreview: React.FC<FilePreviewProps> = ({ files, previews, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="flex gap-2 overflow-x-auto py-1">
        {files.map((file, idx) => {
          const preview = previews[idx];
          const isImage = file.type.startsWith('image/');
          const icon = getAssetIconPath(file.name, file.type);
          return (
            <div key={idx} className="relative w-20 flex-shrink-0 overflow-visible">
              {isImage ? (
                <img
                  src={preview}
                  alt={file.name}
                  className="w-20 h-20 object-cover rounded border"
                  onLoad={() => {
                    try {
                      URL.revokeObjectURL(preview);
                    } catch (e) {}
                  }}
                />
              ) : (
                <div className="w-20 h-20 flex items-center justify-center rounded border bg-gray-50 dark:bg-gray-800">
                  <img src={icon} alt={file.name} className="w-10 h-10" />
                </div>
              )}

              <button onClick={() => onRemove(idx)} className="absolute left-1 -bottom-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-md" style={{ transform: 'translateY(50%)' }} title="Xóa">
                ×
              </button>
              <div className="text-[11px] truncate w-20 text-center mt-1">{file.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
