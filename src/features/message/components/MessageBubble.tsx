import React, { useState, useEffect } from 'react';

interface MessageBubbleProps {
  displayText: string;
  isMine: boolean;
  isPinned?: boolean;
  // support multiple attachments
  attachmentUrl?: string;
  attachmentUrls?: string[] | null;
  // new normalized attachments metadata from backend
  attachments?: Array<{
    url: string;
    filename?: string | null;
    mime?: string | null;
    is_image?: boolean;
  }> | null;
  // message.created_at can be string | null | undefined from API
  createdAt?: string | null;
  status?: 'sending' | 'sent' | 'failed';
  // allow null as well since message._error may be null
  error?: string | null;
}

function ImageWithFallback({ src, alt }: { src: string; alt?: string }) {
  const [current, setCurrent] = useState<string>(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(src);
    setFailed(false);
  }, [src]);

  const handleError = async () => {
    if (failed) return;
    setFailed(true);
    try {
      const res = await fetch(encodeURI(src), { mode: 'cors' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      setCurrent(obj);
      setFailed(false);
    } catch (e) {
      console.warn('Image fetch fallback failed', src, e);
      setFailed(true);
    }
  };

  return (
    <div className="relative">
      <img src={encodeURI(current)} alt={alt} onError={handleError} className="max-w-[220px] rounded-md object-cover" />
      {failed && <div className="mt-1 text-xs text-gray-500 break-all max-w-[220px]">{src}</div>}
    </div>
  );
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ displayText, isMine, isPinned, attachmentUrl, attachmentUrls, attachments, createdAt, status, error }) => {
  // Normalize attachments: prefer `attachments`, else fallback to `attachmentUrls`/`attachmentUrl`
  const normalized: Array<{
    url: string;
    filename?: string | null;
    mime?: string | null;
    is_image?: boolean;
  }> =
    attachments && attachments.length > 0
      ? attachments
      : attachmentUrls && attachmentUrls.length > 0
        ? attachmentUrls.map(u => ({
            url: u,
            filename: u.split('/').pop() || u,
            is_image: /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(u),
          }))
        : attachmentUrl
          ? [
              {
                url: attachmentUrl,
                filename: attachmentUrl.split('/').pop() || attachmentUrl,
                is_image: /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(attachmentUrl),
              },
            ]
          : [];

  const getAssetIconPath = (filename?: string | null, mime?: string | null) => {
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
    // prefer mime when extension is missing
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
    // resolve from src/assets/icon-file so Vite will bundle it
    try {
      return new URL(`../../../assets/icon-file/${file}`, import.meta.url).href;
    } catch (e) {
      // fallback to public path
      return `/assets/icon-file/${file}`;
    }
  };
  return (
    <div className={`inline-block p-3 rounded-2xl shadow-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'} ${status === 'failed' ? 'border-2 border-red-500' : ''}`}>
      {isPinned && <div className="absolute top-1 left-1 text-xs opacity-80">📌</div>}

      {/* Render multiple attachments if present, otherwise single url */}
      {normalized.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {normalized.map((a, i) =>
            a.is_image ? (
              <ImageWithFallback key={`${a.url}-${i}`} src={a.url} alt={a.filename || `attachment-${i}`} />
            ) : (
              <div key={`${a.url}-${i}`} className="w-40 min-h-[56px] flex flex-col items-start justify-center rounded bg-transparent p-2 text-sm">
                <div className="flex items-center gap-3 w-full">
                  <div className="w-8 h-8 flex items-center justify-center text-inherit">
                    <img src={getAssetIconPath(a.filename, a.mime)} alt={a.filename || 'file'} className="w-7 h-7" />
                  </div>
                  <div className="truncate w-[150px] text-sm font-semibold text-inherit">{a.filename || a.url.split('/').pop()}</div>
                </div>
                <div className="mt-2">
                  <a href={encodeURI(a.url) + `${a.url.includes('?') ? '&' : '?'}dl=1`} className="inline-block text-[12px] px-3 py-1 border rounded text-inherit border-current bg-transparent hover:bg-white/5" aria-label={`Tải xuống ${a.filename || 'file'}`}>
                    Tải xuống
                  </a>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="text-sm whitespace-pre-wrap break-words break-all">{displayText}</div>

      {status === 'failed' && (
        <div className="text-xs text-red-500 mt-1">
          Gửi thất bại
          {error && <div className="text-[11px] text-red-400 mt-1">{error}</div>}
        </div>
      )}

      {createdAt && (
        <div className="text-[10px] opacity-60 mt-1 text-right">
          {new Date(createdAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
};
