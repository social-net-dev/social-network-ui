import React, { useState } from 'react';
import { callSetMemberDisplayName } from '../services/messageApi';
import { useAuthStore } from '@/stores/authStore';

interface SetDisplayNameProps {
  roomId: string;
  currentDisplayName?: string;
  onSuccess?: () => void;
  memberId?: string; // optional: allow setting display name for any member (defaults to current user)
  // Backwards-compatible prop name used in some places
  userId?: string;
  // Called immediately with optimistic value before API request. Receives (newDisplayName, targetId).
  onOptimistic?: (displayName: string, targetId: string) => void;
}

export const SetDisplayName: React.FC<SetDisplayNameProps> = ({ roomId, currentDisplayName, onSuccess, memberId, userId, onOptimistic }) => {
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

      const targetId = (userId && userId.trim()) || (memberId && memberId.trim()) || currentUserId;

      try {
        onOptimistic?.(displayName.trim(), targetId);
      } catch (e) {
        // ignore optimistic handler errors
      }

      await callSetMemberDisplayName(roomId, targetId, {
        display_name: displayName.trim(),
      });

      // Do not persist local overrides in localStorage. The server stores per-room display names
      // and the UI will refresh room members via `onSuccess` to pick up the authoritative mapping.

      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to set display name:', error);
      alert('Đặt tên hiển thị thất bại');

      // If optimistic update was applied, revert to previous value
      try {
        const targetId = (userId && userId.trim()) || (memberId && memberId.trim()) || currentUserId;
        onOptimistic?.(currentDisplayName || '', targetId);
      } catch (e) {
        // ignore
      }
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
      <button onClick={() => setIsEditing(true)} className="text-primary hover:text-primary/90 p-1 rounded" title={currentDisplayName ? `Tên: ${currentDisplayName}` : 'Đặt tên hiển thị'} aria-label={currentDisplayName ? `Tên: ${currentDisplayName}` : 'Đặt tên hiển thị'}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        <span className="sr-only">{currentDisplayName ? `Tên: ${currentDisplayName}` : 'Đặt tên hiển thị'}</span>
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
