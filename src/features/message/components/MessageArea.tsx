import React from 'react';
import MessageItem from './MessageItem';
import PinnedMessages from './PinnedMessages';
import { groupMessagesByDate } from '../utils/messageHelpers';
import type { MessageOut, MessageFull } from '../types/message.types';

interface MessageAreaProps {
  pinnedMessages: MessageOut[];
  regularMessages: MessageOut[];
  currentUserId: string;
  chatStatus: 'connecting' | 'open' | 'closed' | 'error';
  lastError: string | null;
  conversationTitle?: string;
  sendReaction?: (messageId: string, emoji: string, remove?: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
  endRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
  messageInput: React.ReactNode;
}

export const MessageArea: React.FC<MessageAreaProps> = ({ pinnedMessages, regularMessages, currentUserId, chatStatus, lastError, conversationTitle, sendReaction, onRefresh, endRef, messagesContainerRef, messageInput }) => {
  // Scrolling is handled by the parent `ConversationPage` to avoid conflicting jumps

  return (
    <div className="flex-1 flex flex-col bg-card rounded overflow-hidden min-h-0 relative">
      {/* Header (sticky) */}
      <header className="border-b pb-3 pt-4 px-4 flex-shrink-0 sticky top-0 z-20 bg-card">
        <div className="text-lg font-semibold">
          {conversationTitle ?? 'Cuộc trò chuyện'}
          <span className="ml-3 text-sm align-middle">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chatStatus === 'open' ? 'bg-green-100 text-green-800' : chatStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : chatStatus === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{chatStatus}</span>
          </span>
          {lastError && <div className="text-xs text-red-500 mt-1">Lỗi kết nối: {lastError}</div>}
        </div>
      </header>

      {/* Messages - scrollable */}
      <section ref={messagesContainerRef as any} className="flex-1 min-h-0 overflow-y-auto space-y-3 px-4 py-3">
        {/* Pinned messages: sticky at top */}
        <PinnedMessages pinned={pinnedMessages as MessageFull[]} currentUserId={currentUserId} sendReaction={sendReaction} onRefresh={onRefresh} />

        {/* Regular messages grouped by date */}
        {groupMessagesByDate(regularMessages).map((group, groupIdx) => (
          <div key={groupIdx}>
            {group.date && (
              <div className="flex justify-center my-4">
                <span className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-xs font-medium">{group.date}</span>
              </div>
            )}
            <div className="space-y-3">
              {group.messages.map((m, msgIdx) => (
                <MessageItem key={m.id ?? m.client_id ?? `${groupIdx}-${msgIdx}`} message={m} isMine={m.sender_id === currentUserId} currentUserId={currentUserId} sendReaction={sendReaction} onRefresh={onRefresh} />
              ))}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </section>

      {/* Input - sticky at bottom of the message container */}
      <div className="flex-shrink-0 sticky bottom-0 z-20 bg-card px-4 py-3">{messageInput}</div>
    </div>
  );
};
