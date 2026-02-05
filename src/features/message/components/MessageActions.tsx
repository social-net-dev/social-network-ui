import React, { useState, useEffect, useRef } from 'react';

interface MessageActionsProps {
  isMine: boolean;
  isPinned?: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageActions: React.FC<MessageActionsProps> = ({ isMine, isPinned, onPin, onUnpin, onDelete, onReact }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowEmojiPicker(false);
      }
    };

    if (showMenu || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu, showEmojiPicker]);

  const handleReact = (emoji: string) => {
    onReact(emoji);
    setShowEmojiPicker(false);
    setShowMenu(false);
  };

  return (
    <div ref={menuRef} className="relative flex-shrink-0">
      <button
        onClick={() => {
          setShowMenu(!showMenu);
          setShowEmojiPicker(false);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1 py-1 rounded"
        aria-label="menu"
        title="Thao tác"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {showMenu && (
        <div className={`absolute z-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded shadow-xl py-1 mt-2 top-full ${isMine ? 'right-0' : 'left-0'} min-w-[140px]`}>
          <button className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            😀 Thả cảm xúc
          </button>
          {isPinned ? (
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              onClick={() => {
                onUnpin();
                setShowMenu(false);
              }}
            >
              📌 Bỏ ghim
            </button>
          ) : (
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              onClick={() => {
                onPin();
                setShowMenu(false);
              }}
            >
              📌 Ghim
            </button>
          )}
          {isMine && (
            <button
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-red-600"
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
            >
              🗑️ Xóa
            </button>
          )}
        </div>
      )}

      {showEmojiPicker && (
        <div className={`absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-xl p-2 mt-2 top-full ${isMine ? 'right-0' : 'left-0'} flex gap-2`}>
          {commonEmojis.map(emoji => (
            <button key={emoji} className="text-2xl hover:scale-125 transition-transform" onClick={() => handleReact(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
