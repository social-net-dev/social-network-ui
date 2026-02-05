import React, { useState } from 'react';
import type { MessageFull } from '../types/message.types';
import { callUnpinMessage } from '../services/messageApi';

interface Props {
  pinned: MessageFull[];
  currentUserId?: string;
  sendReaction?: (messageId: string, emoji: string, remove?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const PinnedMessages: React.FC<Props> = ({ pinned, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);

  const count = pinned?.length || 0;

  if (!pinned || pinned.length === 0) return null;

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-card border border-gray-100 dark:border-gray-800/60 py-3 px-3 mb-3 rounded shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">Đã ghim</div>
          <div className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{count}</div>
        </div>
        {count > 0 && (
          <button className="text-xs text-primary hover:underline" onClick={() => setExpanded(s => !s)}>
            {expanded ? 'Thu gọn' : `Xem ${count} ghim`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {expanded ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinned.map(m => (
              <div key={m.id} className="relative text-left w-full bg-white dark:bg-card border border-gray-100 dark:border-gray-800/60 rounded-lg p-3 shadow-sm hover:shadow-md">
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    try {
                      await callUnpinMessage(m.id!);
                      await onRefresh();
                    } catch (err) {
                      console.error('Unpin failed', err);
                      alert('Bỏ ghim thất bại');
                    }
                  }}
                  title="Bỏ ghim"
                  className="absolute top-2 right-2 text-xs text-gray-500 hover:text-red-500"
                >
                  Bỏ ghim
                </button>

                <div className="text-sm leading-snug text-ellipsis overflow-hidden max-h-14">{(m as any).message ?? m.ciphertext ?? '(tệp đính kèm)'}</div>
                {m.created_at && (
                  <div className="text-[11px] opacity-60 mt-2 text-right">
                    {new Date(m.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PinnedMessages;
