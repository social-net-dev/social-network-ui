import React from 'react';
import type { IRoomUser } from '../types/message.types';

interface Props {
  rooms: IRoomUser[];
  selectedId?: string | undefined;
  onSelect: (roomId: string) => void;
}

const SidebarRooms: React.FC<Props> = ({ rooms, selectedId, onSelect }) => {
  return (
    <div className="space-y-1">
      {rooms.map(r => {
        const title = r.name && r.name.trim() ? r.name : `Phòng ${r.room_id.slice(0, 6)}`;
        const snippet = r.last_message?.snippet ?? '';
        const isSelected = selectedId === r.room_id;
        return (
          <button key={r.room_id} onClick={() => onSelect(r.room_id)} className={`w-full text-left p-2 rounded ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <div className="flex flex-col">
              <div className={`p-3 rounded ${isSelected ? 'bg-primary/0' : ''}`}>
                <div className="font-medium truncate">{title}</div>
                {/* chỉ hiện một dòng preview cắt ngắn */}
                {snippet ? <div className="text-sm opacity-80 truncate mt-1">{snippet}</div> : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SidebarRooms;
