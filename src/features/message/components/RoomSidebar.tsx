import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SidebarRooms from './SidebarRooms';
import type { IRoomUser } from '../types/message.types';

interface RoomSidebarProps {
  rooms: IRoomUser[];
  selectedRoomId?: string;
  userId: string;
  onRoomSelect: (roomId: string) => void;
  onCreateRoom?: (name: string, memberIds: string[]) => Promise<void>;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({ rooms, selectedRoomId, userId, onRoomSelect, onCreateRoom }) => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [memberIds, setMemberIds] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!onCreateRoom) return;
    const ids = memberIds.split(',').map(s => s.trim()).filter(Boolean);
    setCreating(true);
    setError(null);
    try {
      await onCreateRoom(roomName.trim(), ids);
      setShowForm(false);
      setRoomName('');
      setMemberIds('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tạo phòng thất bại');
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="w-[30%] min-w-[220px] bg-card rounded p-2 flex flex-col h-full">
      {/* Header with create button */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold text-foreground">Tin nhắn</span>
        {onCreateRoom && (
          <button
            onClick={() => { setShowForm(v => !v); setError(null); }}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title="Tạo cuộc trò chuyện mới"
          >
            + Tạo mới
          </button>
        )}
      </div>

      {/* Inline create room form */}
      {showForm && onCreateRoom && (
        <div className="mb-2 p-2 rounded border border-border bg-background space-y-2 text-sm">
          <input
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Tên phòng (tùy chọn)"
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
          />
          <input
            className="w-full px-2 py-1.5 rounded border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Username thành viên (phân cách bằng dấu phẩy)"
            value={memberIds}
            onChange={e => setMemberIds(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !memberIds.trim()}
              className="flex-1 px-2 py-1.5 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Đang tạo...' : 'Tạo'}
            </button>
            <button
              onClick={() => { setShowForm(false); setError(null); }}
              className="px-2 py-1.5 rounded border border-border text-xs hover:bg-muted transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Rooms list */}
      <div className="mt-1 flex-1 overflow-y-auto">
        <SidebarRooms
          rooms={rooms}
          selectedId={selectedRoomId}
          onSelect={roomId => {
            onRoomSelect(roomId);
            navigate(`/messages/${roomId}`);
            const next = new URLSearchParams();
            next.set('room_id', roomId);
            next.set('user_id', userId);
            setSearchParams(next);
          }}
        />
      </div>
    </aside>
  );
};
