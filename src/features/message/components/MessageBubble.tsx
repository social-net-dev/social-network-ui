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

function ImageWithFallback({ src, alt, className, onNaturalSize }: { src: string; alt?: string; className?: string; onNaturalSize?: (w: number, h: number) => void }) {
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
    <div className="relative w-full h-full">
      <img
        src={encodeURI(current)}
        alt={alt}
        onError={handleError}
        onLoad={e => {
          try {
            const img = e.currentTarget as HTMLImageElement;
            onNaturalSize?.(img.naturalWidth || 1, img.naturalHeight || 1);
          } catch (err) {}
        }}
        className={className || 'w-full h-full object-cover rounded-md'}
      />
      {failed && <div className="mt-1 text-xs text-gray-500 break-all w-full">{src}</div>}
    </div>
  );
}

// PairRow: render two images in one row with equal height and widths proportional
// to their natural aspect ratios so sum of widths fills the container.
const PairRow: React.FC<{ a: { url: string; filename?: string | null }; b: { url: string; filename?: string | null } }> = ({ a, b }) => {
  const [aspectA, setAspectA] = useState<number>(1);
  const [aspectB, setAspectB] = useState<number>(1);

  return (
    <div className="flex gap-1 overflow-hidden rounded-md h-48">
      <div style={{ flex: aspectA }} className="overflow-hidden">
        <ImageWithFallback
          src={a.url}
          alt={a.filename || 'img-a'}
          className="w-full h-full object-cover"
          onNaturalSize={(w, h) => {
            if (w && h) setAspectA(w / h);
          }}
        />
      </div>
      <div style={{ flex: aspectB }} className="overflow-hidden">
        <ImageWithFallback
          src={b.url}
          alt={b.filename || 'img-b'}
          className="w-full h-full object-cover"
          onNaturalSize={(w, h) => {
            if (w && h) setAspectB(w / h);
          }}
        />
      </div>
    </div>
  );
};

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
  const imageAttachments = normalized.filter(a => a.is_image);
  const fileAttachments = normalized.filter(a => !a.is_image);

  return (
    <div className={`inline-block p-3 rounded-2xl shadow-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'} ${status === 'failed' ? 'border-2 border-red-500' : ''}`}>
      {isPinned && <div className="absolute top-1 left-1 text-xs opacity-80">📌</div>}

      {/* Images: Zalo-like grid when multiple, large single when one */}
      {imageAttachments.length > 0 && (
        <div className="mb-2 max-w-[420px] w-full">
          {imageAttachments.length === 1 ? (
            <div className="overflow-hidden rounded-md">
              <ImageWithFallback src={imageAttachments[0].url} alt={imageAttachments[0].filename || 'image-0'} className="w-full h-auto object-cover rounded-md" />
            </div>
          ) : (
            <>
              {(() => {
                const rows: React.ReactNode[] = [];
                for (let i = 0; i < imageAttachments.length; i += 2) {
                  const a = imageAttachments[i];
                  const b = imageAttachments[i + 1];
                  if (b) {
                    rows.push(<PairRow key={`row-${i}`} a={a} b={b} />);
                  } else {
                    rows.push(
                      <div key={`row-${i}`} className="overflow-hidden rounded-md h-64">
                        <ImageWithFallback src={a.url} alt={a.filename || `image-${i}`} className="w-full h-full object-cover" />
                      </div>
                    );
                  }
                }
                return rows;
              })()}
            </>
          )}
        </div>
      )}

      {/* Files: render as stacked file blocks */}
      {fileAttachments.length > 0 && (
        <div className="flex flex-col gap-2 mb-2 max-w-[420px]">
          {fileAttachments.map((a, i) => (
            <div key={`file-${i}`} className={`w-full rounded-lg p-3 flex items-center justify-between gap-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-800`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img src={getAssetIconPath(a.filename, a.mime)} alt={a.filename || 'file'} className="w-8 h-8" />
                </div>
                <div className="flex flex-col">
                  <div className="font-semibold truncate w-[260px] text-gray-900 dark:text-gray-100">{a.filename || a.url.split('/').pop()}</div>
                  <div className="text-[12px] opacity-70">{a.mime || 'Tệp đính kèm'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={encodeURI(a.url) + `${a.url.includes('?') ? '&' : '?'}dl=1`} className="p-2 text-sm rounded-md bg-white/5 hover:bg-white/10" aria-label={`Tải xuống ${a.filename || 'file'}`}>
                  ⬇️
                </a>
              </div>
            </div>
          ))}
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
