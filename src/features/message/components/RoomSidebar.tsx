import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SidebarRooms from './SidebarRooms';
import type { IRoomUser } from '../types/message.types';

interface RoomSidebarProps {
  rooms: IRoomUser[];
  selectedRoomId?: string;
  userId: string;
  onRoomSelect: (roomId: string) => void;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({ rooms, selectedRoomId, userId, onRoomSelect }) => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  return (
    <aside className="w-[30%] min-w-[220px] bg-card rounded p-2 flex flex-col h-full">
      {/* Rooms list */}
      <div className="mt-2 flex-1 overflow-y-auto">
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
