import React from 'react';
import type { MessageOut, MessageFull, IReaction } from '../types/message.types';
import { callDeleteMessage, callAddReaction, callPinMessage, callUnpinMessage } from '../services/messageApi';
import { MessageLayout } from './MessageLayout';
import { MessageBubble } from './MessageBubble';
import { MessageActions } from './MessageActions';
import { MessageReactions } from './MessageReactions';

interface MessageItemProps {
  message: MessageFull | MessageOut;
  isMine: boolean;
  currentUserId: string;
  onRefresh?: () => void;
  sendReaction?: (messageId: string, emoji: string, remove?: boolean) => Promise<void>;
  decryptedText?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isMine, currentUserId, onRefresh, sendReaction, decryptedText }) => {
  // 🔑 NEW Priority (Shared Room Key): decryptedText > plaintext > _plaintext (fallback) > ciphertext
  const displayText = decryptedText || message.message || (message as any)._plaintext || message.ciphertext || '';
  const reactions: IReaction[] = (message as any).reactions ?? [];

  const handleDelete = async () => {
    if (!confirm('Xóa tin nhắn này?')) return;
    try {
      const res = await callDeleteMessage({
        message_id: message.id,
        user_id: currentUserId,
        hard: true,
      });

      // If backend reports deleted_all, immediately notify other parts of the FE
      const status = res?.data?.status;
      if (status === 'deleted_all') {
        try {
          window.dispatchEvent(new CustomEvent('messageDeleted', { detail: { id: message.id } }));
        } catch (e) {}
      }

      // Refresh parent list (will re-fetch messages) as fallback
      onRefresh?.();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Xóa thất bại');
    }
  };

  const handlePin = async () => {
    try {
      await callPinMessage({ message_id: message.id, pin: true });
      onRefresh?.();
    } catch (e) {
      console.error('Pin failed:', e);
      alert('Ghim thất bại');
    }
  };

  const handleUnpin = async () => {
    try {
      await callUnpinMessage(message.id);
      onRefresh?.();
    } catch (e) {
      console.error('Unpin failed:', e);
      alert('Bỏ ghim thất bại');
    }
  };

  const handleReact = async (emoji: string) => {
    try {
      if (sendReaction) {
        // For optimistic file uploads message.id may be undefined; fall back to client_id
        await sendReaction((message as any).id ?? (message as any).client_id ?? '', emoji, false);
      } else {
        await callAddReaction(message.id, { emoji, user_id: currentUserId });
        onRefresh?.();
      }
    } catch (e) {
      console.error('React failed:', e);
    }
  };

  return (
    <MessageLayout isMine={isMine}>
      {isMine ? (
        <>
          <MessageActions isMine={isMine} isPinned={(message as any).pinned} onPin={handlePin} onUnpin={handleUnpin} onDelete={handleDelete} onReact={handleReact} />
          <div className="flex flex-col gap-1 max-w-[70%]">
            <MessageBubble
              displayText={displayText}
              isMine={isMine}
              isPinned={(message as any).pinned}
              attachments={(message as any).attachments ?? null}
              attachmentUrl={(message as any).attachment_url}
              attachmentUrls={(message as any).attachment_urls}
              createdAt={message.created_at}
              status={
                // Normalize backend message status to MessageBubble expected values
                (message as any)._status === 'sending' ? 'sending' : (message as any)._status === 'failed' ? 'failed' : 'sent'
              }
              error={message._error}
            />
            {reactions.length > 0 && <MessageReactions reactions={reactions} isMine={isMine} />}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1 max-w-[70%]">
            <MessageBubble
              displayText={displayText}
              isMine={isMine}
              isPinned={(message as any).pinned}
              attachments={(message as any).attachments ?? null}
              attachmentUrl={(message as any).attachment_url}
              attachmentUrls={(message as any).attachment_urls}
              createdAt={message.created_at}
              status={(message as any)._status === 'sending' ? 'sending' : (message as any)._status === 'failed' ? 'failed' : 'sent'}
              error={message._error}
            />
            {reactions.length > 0 && <MessageReactions reactions={reactions} isMine={isMine} />}
          </div>
          <MessageActions isMine={isMine} isPinned={(message as any).pinned} onPin={handlePin} onUnpin={handleUnpin} onDelete={handleDelete} onReact={handleReact} />
        </>
      )}
    </MessageLayout>
  );
};

export default MessageItem;
