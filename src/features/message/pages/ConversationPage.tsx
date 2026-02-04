import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import { useRoomManager } from '../hooks/useRoomManager';
import { useMessageManager } from '../hooks/useMessageManager';
import { useFileUpload } from '../hooks/useFileUpload';
import { useAuthStore } from '@/stores/authStore';
import { RoomSidebar } from '../components/RoomSidebar';
import { MessageArea } from '../components/MessageArea';
import { MessageInput } from '../components/MessageInput';
import { filterOptimisticMessage } from '../utils/messageDedupe';

const ConversationPage: React.FC = () => {
  const params = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations } = useConversations();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const endRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef<number>(0);

  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(params.conversationId ?? searchParams.get('room_id') ?? undefined);
  const [overrideRoomId, setOverrideRoomId] = useState<string | undefined>(searchParams.get('room_id') ?? undefined);
  const [text, setText] = useState('');

  // Resolve userId and room: prefer URL query params
  const resolvedUserId = searchParams.get('user_id') ?? user?.id ?? 'anonymous';
  const resolvedRoom = overrideRoomId ?? searchParams.get('room_id') ?? selectedConversationId ?? 'default';

  // Dùng useCallback để tránh stale closure
  const handleReactionEvent = React.useCallback((data: any) => {
    console.log('[ConversationPage] ====== REACTION EVENT START ======');
    console.log('[ConversationPage] Reaction event received:', {
      type: data.type,
      action: data.action,
      message_id: data.message_id,
      user_id: data.user_id?.slice(0, 8),
      emoji: data.emoji,
      reaction_id: data.reaction_id,
    });

    // Cập nhật fetchedMessages khi nhận reaction broadcast
    setFetchedMessages(prev => {
      return prev.map(msg => {
        if (msg.id !== data.message_id) return msg;
        const reactions = (msg as any).reactions || [];
        console.log(`[ConversationPage] Current reactions for message ${msg.id}:`, reactions);

        if (data.type === 'reaction') {
          const existingById = reactions.find((r: any) => r.id === data.reaction_id);

          console.log(`[ConversationPage] Checking reaction:`, {
            message_id: data.message_id,
            user_id: data.user_id?.slice(0, 8),
            emoji: data.emoji,
            reaction_id: data.reaction_id,
            existingById: !!existingById,
            totalReactions: reactions.length,
          });

          if (existingById) {
            console.log(`[ConversationPage] Reaction ID already exists, skipping`);
            return msg;
          }

          const tempIndex = reactions.findIndex((r: any) => String(r.id).startsWith('temp-') && r.user_id === data.user_id && r.emoji === data.emoji);

          if (tempIndex !== -1) {
            console.log(`[ConversationPage] Replacing temp reaction with real ID`);
            const newReactions = reactions.map((r: any, idx: number) =>
              idx === tempIndex
                ? {
                    ...r,
                    id: data.reaction_id,
                    created_at: r.created_at || new Date().toISOString(),
                  }
                : r
            );
            return {
              ...msg,
              reactions: newReactions,
            };
          }

          console.log(`[ConversationPage] Adding new reaction (count will increase)`);
          const newReactions = [
            ...reactions,
            {
              id: data.reaction_id || `temp-${Date.now()}`,
              user_id: data.user_id,
              emoji: data.emoji,
              created_at: new Date().toISOString(),
            },
          ];
          return {
            ...msg,
            reactions: newReactions,
          };
        } else if (data.type === 'reaction_removed') {
          console.log(`[ConversationPage] Removing reaction from fetchedMessages`);
          return {
            ...msg,
            reactions: reactions.filter((r: any) => !(r.user_id === data.user_id && r.emoji === data.emoji)),
          };
        }
        return msg;
      });
    });
    console.log('[ConversationPage] ====== REACTION EVENT END ======');
  }, []);

  // WebSocket chat hook
  const {
    messages,
    send,
    sendReaction,
    status: chatStatus,
    lastError,
  } = useChat({
    room: resolvedRoom,
    userId: resolvedUserId,
    wsUrl: import.meta.env.DEV ? 'ws://localhost:8000/ws' : '',
    restBase: import.meta.env.DEV ? 'http://localhost:8000' : '',
    onReactionEvent: handleReactionEvent,
    onMessage: msg => {
      // If server echoes client_id, remove matching optimistic entry immediately
      if (msg.client_id) {
        setFetchedMessages(prev => prev.filter(m => m.client_id !== msg.client_id));
        return;
      }

      // Heuristic: match by attachments metadata
      try {
        setFetchedMessages(prev => filterOptimisticMessage(prev, msg));
      } catch (e) {
        console.error('onMessage dedupe heuristic failed', e);
      }
    },
  });

  // Room manager hook
  const { rooms, createRoom, loadRooms } = useRoomManager({ userId: resolvedUserId });

  // Message manager hook
  const { setFetchedMessages, combinedMessages, pinnedMessages, regularMessages, loadMessages } = useMessageManager({
    roomId: resolvedRoom,
    wsMessages: messages,
  });

  // File upload hook
  const { selectedFiles, fileInputRef, previews, handleFileSelect, removeFile, clearFiles, uploadFiles } = useFileUpload({
    roomId: resolvedRoom,
    userId: resolvedUserId,
    onUploadSuccess: () => {
      setText('');
    },
    onUploadError: () => {
      alert('Tải ảnh thất bại');
    },
  });

  // If URL param changes, sync it into state
  useEffect(() => {
    if (params.conversationId && params.conversationId !== selectedConversationId) {
      setSelectedConversationId(params.conversationId);
    }
  }, [params.conversationId, selectedConversationId]);

  // When conversations load and nothing is selected, pick the first
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
      navigate(`/messages/${conversations[0].id}`, { replace: true });
    }
  }, [conversations, selectedConversationId, navigate]);

  // Keep local overrideRoomId in sync with selectedConversationId
  useEffect(() => {
    if (selectedConversationId && selectedConversationId !== overrideRoomId) {
      setOverrideRoomId(selectedConversationId);
      const next = new URLSearchParams(searchParams);
      next.set('room_id', selectedConversationId);
      if (resolvedUserId) next.set('user_id', resolvedUserId);
      setSearchParams(next, { replace: true });
    }
  }, [selectedConversationId, overrideRoomId, searchParams, resolvedUserId, setSearchParams]);

  // Auto-scroll when new messages arrive (not when reactions update)
  useEffect(() => {
    const currentCount = combinedMessages.length;
    const prevCount = prevMessageCountRef.current;

    if (currentCount > prevCount) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCountRef.current = currentCount;
  }, [combinedMessages]);

  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    setSelectedConversationId(roomId);
  };

  // Handle room creation
  const handleCreateRoom = async (name: string, memberId: string) => {
    const members = [resolvedUserId, memberId];
    const roomId = await createRoom(name, members);

    if (roomId) {
      setSelectedConversationId(roomId);
      navigate(`/messages/${roomId}`);
      const next = new URLSearchParams(searchParams);
      next.set('room_id', roomId);
      next.set('user_id', resolvedUserId);
      setSearchParams(next);
    }
  };

  // Handle send message
  const handleSend = async () => {
    if ((!text.trim() && selectedFiles.length === 0) || !selectedConversationId) return;

    try {
      // Upload files if any
      if (selectedFiles.length > 0) {
        await uploadFiles(text, setFetchedMessages);
        clearFiles();
        setText('');
      } else if (text.trim()) {
        // Send text only via WebSocket
        await send(text.trim());
        setText('');
      }
    } catch (e) {
      console.error('Send failed:', e);
    }
  };

  return (
    <div className="flex-1 flex gap-4 overflow-hidden h-full p-0 min-h-0">
      {/* Left: Room sidebar */}
      <RoomSidebar rooms={rooms} selectedRoomId={selectedConversationId} userId={resolvedUserId} onRoomSelect={handleRoomSelect} onCreateRoom={handleCreateRoom} onReloadRooms={loadRooms} />

      {/* Center: Message area with input */}
      <MessageArea
        pinnedMessages={pinnedMessages}
        regularMessages={regularMessages}
        currentUserId={resolvedUserId}
        chatStatus={chatStatus}
        lastError={lastError}
        conversationTitle={conversations.find(c => c.id === selectedConversationId)?.title}
        sendReaction={sendReaction}
        onRefresh={loadMessages}
        endRef={endRef}
        messageInput={<MessageInput text={text} selectedFiles={selectedFiles} previews={previews} fileInputRef={fileInputRef} onTextChange={setText} onFileSelect={handleFileSelect} onRemoveFile={removeFile} onSend={handleSend} onAttachClick={() => fileInputRef.current?.click()} />}
      />
    </div>
  );
};

export { ConversationPage };
export default ConversationPage;
