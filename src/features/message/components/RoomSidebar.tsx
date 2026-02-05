import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SidebarRooms from './SidebarRooms';
import type { IRoomUser } from '../types/message.types';

interface RoomSidebarProps {
  rooms: IRoomUser[];
  selectedRoomId?: string;
  userId: string;
  onRoomSelect: (roomId: string) => void;
  onCreateRoom: (name: string, memberId: string) => Promise<void>;
  onReloadRooms: () => Promise<void>;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({ rooms, selectedRoomId, userId, onRoomSelect, onCreateRoom, onReloadRooms }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [overrideUserId, setOverrideUserId] = React.useState<string | undefined>(searchParams.get('user_id') ?? undefined);
  const [overrideRoomId, setOverrideRoomId] = React.useState<string | undefined>(searchParams.get('room_id') ?? undefined);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [newMemberId, setNewMemberId] = React.useState('');

  const handleApply = async () => {
    const next = new URLSearchParams(searchParams);
    if (overrideUserId) next.set('user_id', overrideUserId);
    else next.delete('user_id');
    if (overrideRoomId) next.set('room_id', overrideRoomId);
    else next.delete('room_id');
    setSearchParams(next);

    // Reload rooms with new user_id
    await onReloadRooms();

    if (overrideRoomId) {
      navigate(`/messages/${overrideRoomId}`);
      onRoomSelect(overrideRoomId);
    }
  };

  const handleClear = () => {
    setOverrideUserId(undefined);
    setOverrideRoomId(undefined);
    setSearchParams(new URLSearchParams());
  };

  const handleCreateRoom = async () => {
    if (!newMemberId.trim()) return;

    try {
      await onCreateRoom(newRoomName, newMemberId.trim());
      setNewRoomName('');
      setNewMemberId('');
    } catch (e) {
      console.error('Create room failed', e);
    }
  };

  return (
    <aside className="w-[30%] min-w-[220px] bg-card rounded p-2 flex flex-col h-full">
      {/* Debug controls */}
      <div className="px-2 py-2 space-y-2">
        <div className="flex gap-2">
          <input placeholder="user_id (ví dụ UUID)" value={overrideUserId ?? ''} onChange={e => setOverrideUserId(e.target.value)} className="flex-1 p-2 rounded border bg-white dark:bg-[#02182B]" />
          <input placeholder="room_id" value={overrideRoomId ?? ''} onChange={e => setOverrideRoomId(e.target.value)} className="w-36 p-2 rounded border bg-white dark:bg-[#02182B]" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleApply} className="px-3 py-1 bg-primary text-white rounded">
            Áp dụng
          </button>
          <button onClick={handleClear} className="px-3 py-1 border rounded">
            Xóa
          </button>
        </div>
      </div>

      {/* Create room form */}
      <div className="mt-2 px-2">
        <div className="text-sm font-medium mb-2">Tạo phòng mới</div>
        <input placeholder="Tên phòng" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="w-full p-2 rounded border bg-white dark:bg-[#02182B] text-sm mb-2" />
        <input placeholder="Thêm 1 user id (ví dụ để tạo 1-1)" value={newMemberId} onChange={e => setNewMemberId(e.target.value)} className="w-full p-2 rounded border bg-white dark:bg-[#02182B] text-sm" />
        <div className="flex items-center justify-end mt-2">
          <button className="text-xs px-2 py-1 border rounded" onClick={handleCreateRoom}>
            Tạo
          </button>
        </div>
      </div>

      {/* Rooms list */}
      <div className="mt-2 flex-1 overflow-y-auto">
        <SidebarRooms
          rooms={rooms}
          selectedId={selectedRoomId}
          onSelect={roomId => {
            onRoomSelect(roomId);
            navigate(`/messages/${roomId}`);
            const next = new URLSearchParams(searchParams);
            next.set('room_id', roomId);
            next.set('user_id', userId);
            setSearchParams(next);
          }}
        />
      </div>
    </aside>
  );
};
