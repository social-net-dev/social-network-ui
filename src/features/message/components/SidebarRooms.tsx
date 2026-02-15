import React, { useEffect, useState } from 'react';
import type { IRoomUser } from '../types/message.types';
import { useMessageStore } from '@/stores/messageStore';
import { callFetchMessagesRoom } from '../services/messageApi';

interface Props {
  rooms: IRoomUser[];
  selectedId?: string | undefined;
  onSelect: (roomId: string) => void;
}

const SidebarRooms: React.FC<Props> = ({ rooms, selectedId, onSelect }) => {
  const unreadByRoom = useMessageStore(state => state.unreadByRoom);
  const [remoteSnippets, setRemoteSnippets] = useState<Record<string, string>>({});

  // If backend didn't include last_message, fetch latest message for rooms to show preview
  useEffect(() => {
    let cancelled = false;
    const fetchFor = async (roomId: string) => {
      try {
        const res = await callFetchMessagesRoom(roomId);
        const rows = res.data || [];
        if (!rows || rows.length === 0) return;
        // pick most recent by created_at
        const latest = rows.reduce((acc: any, cur: any) => {
          if (!acc) return cur;
          const ta = acc.created_at ? Date.parse(acc.created_at) : 0;
          const tb = cur.created_at ? Date.parse(cur.created_at) : 0;
          return tb >= ta ? cur : acc;
        }, null as any);

        let text = '';
        if (latest) {
          text = latest.snippet ?? latest.message ?? latest.text ?? latest.ciphertext ?? '';
          const attachments = latest.attachments ?? latest.attachment_urls ?? (latest.attachment_url ? [latest.attachment_url] : undefined);
          if (!text && attachments && Array.isArray(attachments) && attachments.length > 0) text = `${attachments.length} file`;
        }

        if (!cancelled && text) setRemoteSnippets(prev => ({ ...prev, [roomId]: text }));
      } catch (e) {
        // ignore individual room fetch errors
      }
    };

    // fetch for rooms that lack a last message
    const targets = rooms
      .filter(r => {
        const has = (r as any).last_message ?? (r as any).lastMessage ?? (r as any).last ?? null;
        return !has;
      })
      .slice(0, 12); // cap to first 12 to avoid too many requests

    for (const r of targets) {
      fetchFor(r.room_id);
    }

    return () => {
      cancelled = true;
    };
  }, [rooms]);

  // No localStorage overrides: rely on server-provided room `name`.
  const getLocalTitle = (_roomId: string): string | null => null;

  return (
    <div className="space-y-1">
      {rooms.map(r => {
        const localTitle = getLocalTitle(r.room_id);
        const title = (localTitle && localTitle.trim()) || (r.name && r.name.trim()) || `Phòng ${r.room_id.slice(0, 6)}`;
        // tolerate different backend shapes: snake_case or camelCase or legacy `last`
        const last = (r as any).last_message ?? (r as any).lastMessage ?? (r as any).last ?? null;
        let snippet = '';
        if (last) {
          snippet = last.snippet ?? last.message ?? last.text ?? last.ciphertext ?? '';
          // attachments may appear as attachments array or attachment_urls
          const attachments = last.attachments ?? last.attachment_urls ?? (last.attachment_url ? [last.attachment_url] : undefined);
          if (!snippet && attachments && Array.isArray(attachments) && attachments.length > 0) {
            snippet = `${attachments.length} file`;
          }
        }
        // fallback to remoteSnippets if no server-provided last
        if (!snippet) snippet = remoteSnippets[r.room_id] ?? '';
        if (snippet && snippet.length > 60) snippet = snippet.slice(0, 57).trim() + '...';
        const isSelected = selectedId === r.room_id;
        const unread = unreadByRoom[r.room_id] ?? r.unread ?? 0;
        return (
          <button
            key={r.room_id}
            onClick={() => onSelect(r.room_id)}
            className={`w-full text-left p-2 rounded border ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-white dark:bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
          >
            <div className="flex flex-col">
              <div className={`p-3 rounded flex flex-col ${isSelected ? 'bg-primary/0' : ''} ${unread > 0 && !isSelected ? 'pl-3 border-l-4 border-secondary/80' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className={`truncate ${unread > 0 && !isSelected ? 'text-secondary font-semibold' : 'font-medium'}`}>{title}</div>
                  {unread > 0 && !isSelected && <span className="min-w-[1.5rem] h-6 px-2 rounded-full bg-secondary text-black text-xs font-semibold flex items-center justify-center shadow-sm">{unread}</span>}
                </div>
                {/* show single-line truncated preview (ellipsis) */}
                <div className={`text-sm mt-1 truncate ${unread > 0 && !isSelected ? 'text-secondary/90 font-medium' : 'text-gray-500 dark:text-gray-400 opacity-80'}`}>{snippet}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SidebarRooms;
