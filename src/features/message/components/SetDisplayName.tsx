import React, { useState } from 'react';
import { callSetMemberDisplayName } from '../services/messageApi';
import { useAuthStore } from '@/stores/authStore';

interface SetDisplayNameProps {
  roomId: string;
  currentDisplayName?: string;
  onSuccess?: () => void;
}

export const SetDisplayName: React.FC<SetDisplayNameProps> = ({ roomId, currentDisplayName, onSuccess }) => {
  const user = useAuthStore(state => state.user);
  const currentUserId = user?.id ?? '';

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      alert('Tên hiển thị không được để trống');
      return;
    }

    setLoading(true);
    try {
      if (!currentUserId) {
        alert('Không xác định được người dùng. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }

      await callSetMemberDisplayName(roomId, currentUserId, {
        display_name: displayName.trim(),
      });

      // Also save a local override so this display name is shown on this device only
      try {
        const key = `local_display_name_${roomId}_${currentUserId}`;
        localStorage.setItem(key, displayName.trim());
      } catch (e) {
        // ignore storage failures
      }

      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to set display name:', error);
      alert('Đặt tên hiển thị thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(currentDisplayName || '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <button onClick={() => setIsEditing(true)} className="text-xs text-primary hover:underline" title="Đặt tên hiển thị trong phòng này">
        {currentDisplayName ? `Tên: ${currentDisplayName}` : 'Đặt tên hiển thị'}
      </button>
    );
  }

  return (
    <div className="flex gap-2 items-center p-2 border rounded bg-white dark:bg-gray-800">
      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tên hiển thị..." className="flex-1 px-2 py-1 text-sm border rounded" autoFocus disabled={loading} />
      <button onClick={handleSave} disabled={loading} className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50">
        {loading ? 'Đang lưu...' : 'Lưu'}
      </button>
      <button onClick={handleCancel} disabled={loading} className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
        Hủy
      </button>
    </div>
  );
};
