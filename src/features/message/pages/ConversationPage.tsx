import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { useConversations } from '../hooks/useConversations';
import { useChat } from '../hooks/useChat';
import type { MessageOut } from '../types/message.types';
import { useRoomManager } from '../hooks/useRoomManager';
import { useMessageManager } from '../hooks/useMessageManager';
import { useFileUpload } from '../hooks/useFileUpload';
import { useE2EEMessaging } from '../hooks/useE2EEMessaging';
import { PassphraseModal } from '../components/PassphraseModal';
import { SetDisplayName } from '../components/SetDisplayName';
import { useAuthStore } from '@/stores/authStore';
import { RoomSidebar } from '../components/RoomSidebar';
import { MessageArea } from '../components/MessageArea';
import { MessageInput } from '../components/MessageInput';
import { filterOptimisticMessage } from '../utils/messageDedupe';
import { callMarkRoomRead, callGetRoomMemberPublicKeys } from '../services/messageApi';
import { useMessageStore } from '@/stores/messageStore';

const ConversationPage: React.FC = () => {
  const params = useParams<{ conversationId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { conversations } = useConversations();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const endRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevRoomRef = useRef<string | null>(null);
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(params.conversationId ?? searchParams.get('room_id') ?? undefined);
  const [overrideRoomId, setOverrideRoomId] = useState<string | undefined>(searchParams.get('room_id') ?? undefined);
  const [text, setText] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientDisplayName, setRecipientDisplayName] = useState<string | undefined>(undefined);
  const [currentMemberDisplayName, setCurrentMemberDisplayName] = useState<string | undefined>(undefined);

  const resetUnread = useMessageStore(state => state.resetUnread);
  const incrementUnread = useMessageStore(state => state.incrementUnread);

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

    wsUrl: import.meta.env.DEV ? 'ws://localhost:8001/ws' : '',
    restBase: import.meta.env.DEV ? 'http://localhost:8001' : '',
    onReactionEvent: handleReactionEvent,
    onExternalMessage: (msg: MessageOut) => {
      if (msg.room_id && msg.room_id !== resolvedRoom) {
        incrementUnread(msg.room_id, 1);
      }
    },
    onRead: (data: any) => {
      if (data?.room_id && data?.user_id === resolvedUserId) {
        resetUnread(data.room_id);
      }

      // If the other participant (recipient) read messages in this room,
      // clear the local "greeting sent" flag so sender can continue messaging.
      try {
        if (data?.room_id === resolvedRoom && data?.user_id && recipientId && data.user_id === recipientId) {
          const key = `greeting_sent_${resolvedRoom}_${recipientId}`;
          localStorage.removeItem(key);
          console.log('[ConversationPage] Recipient opened room — cleared greeting flag for', key);
        }
      } catch (e) {
        // ignore
      }
    },

    onMessage: (msg: MessageOut) => {
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
    onDelete: (id: string) => {
      try {
        console.log('[ConversationPage] WS message_deleted received:', id);
        // Dispatch a CustomEvent so the existing messageDeleted listener removes it from fetchedMessages
        window.dispatchEvent(new CustomEvent('messageDeleted', { detail: { id } } as any));
      } catch (e) {
        console.error('[ConversationPage] Failed to process onDelete event', e);
      }
    },
  });

  // Room manager hook
  const { rooms, loadRooms } = useRoomManager({ userId: resolvedUserId });

  // Message manager hook
  const { setFetchedMessages, combinedMessages, pinnedMessages, regularMessages, loadMessages } = useMessageManager({
    roomId: resolvedRoom,
    wsMessages: messages,
  });

  // Refresh room members and messages — used after updating display name so UI updates immediately
  const refreshRoomMembers = React.useCallback(async () => {
    try {
      const resp = await callGetRoomMemberPublicKeys(resolvedRoom);
      const members = resp.data?.members || [];
      const me = members.find((m: any) => m.user_id === resolvedUserId);
      setCurrentMemberDisplayName(me?.display_name ?? undefined);
      try {
        const recipient = members.find((m: any) => m.user_id !== resolvedUserId);
        setRecipientDisplayName(recipient?.display_name ?? undefined);
      } catch (e) {
        setRecipientDisplayName(undefined);
      }
    } catch (e) {
      console.warn('[ConversationPage] Failed to refresh room members', e);
    }

    try {
      await loadMessages();
    } catch (e) {
      // ignore
    }
  }, [resolvedRoom, resolvedUserId, loadMessages]);

  // Listen for messageDeleted events dispatched by other components (optimistic removal)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail as { id?: string } | undefined;
        const id = detail?.id;
        if (id) {
          setFetchedMessages(prev => prev.filter(m => m.id !== id));
        }
      } catch (e) {}
    };
    window.addEventListener('messageDeleted', handler as EventListener);
    return () => window.removeEventListener('messageDeleted', handler as EventListener);
  }, [setFetchedMessages]);

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

  // Show one-time sync notice when server backup exists and local device hasn't seen it
  const [, setLocalSyncNoticeVisible] = useState(false);

  // E2EE hook
  const {
    isReady: e2eeReady,
    encryptForRecipient,
    decryptIncoming,
    showPassphraseModal,
    passphraseMode,
    setShowPassphraseModal,
    setPassphraseMode,
    handleCreateBackup,
    handleRestore,
    showSyncNotice,
    // dismissSyncNotice,
    ensureReady,
  } = useE2EEMessaging({
    roomId: resolvedRoom,
    userId: resolvedUserId,
    enabled: true, // Enable E2EE by default
  });

  useEffect(() => {
    if ((showSyncNotice as boolean) === true) setLocalSyncNoticeVisible(true);
  }, [showSyncNotice]);

  // Overlay to force restore/create keys when required
  const [e2eeOverlayRequired, setE2eeOverlayRequired] = useState(false);
  const [e2eeOverlayMessage, setE2eeOverlayMessage] = useState<string | null>(null);

  // Dynamic left offset to avoid overlapping global sidebar which can open/collapse
  const [leftOffset, setLeftOffset] = useState<string>('0px');
  const sidebarGapRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const findGap = () => document.querySelector<HTMLElement>('[data-slot="sidebar-gap"]');
    let gap = findGap();
    if (gap) sidebarGapRef.current = gap;

    const update = () => {
      try {
        const w = sidebarGapRef.current ? Math.ceil(sidebarGapRef.current.getBoundingClientRect().width) : 0;
        // Add a small safety margin
        setLeftOffset(`${w + 8}px`);
      } catch (e) {
        setLeftOffset('0px');
      }
    };

    update();

    // Observe size changes of the gap element
    let ro: ResizeObserver | null = null;
    if (sidebarGapRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update());
      ro.observe(sidebarGapRef.current);
    }

    // Fallback: listen to window resize
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      if (ro && sidebarGapRef.current) ro.unobserve(sidebarGapRef.current);
      ro = null;
    };
  }, []);

  // Fetch recipient ID when room changes (for E2EE encryption)
  useEffect(() => {
    if (!resolvedRoom || !resolvedUserId) {
      setRecipientId(null);
      return;
    }

    const fetchRecipient = async () => {
      try {
        console.log('[ConversationPage] 🎯 Fetching recipient for encryption');
        console.log('[ConversationPage] Current state:', {
          room: resolvedRoom,
          current_user: resolvedUserId.substring(0, 8) + '...',
          e2ee_ready: e2eeReady,
        });

        const response = await callGetRoomMemberPublicKeys(resolvedRoom);
        const members = response.data?.members || [];

        console.log('[ConversationPage] 📊 Room members:');
        members.forEach((m, idx) => {
          console.log(`  [${idx}] user_id: ${m.user_id.substring(0, 8)}..., is_me: ${m.user_id === resolvedUserId}, has_public_key: ${!!m.public_key}`);
        });

        // Find first member who is not current user (for 1-1 direct chat)
        const recipient = members.find(m => m.user_id !== resolvedUserId);

        if (recipient) {
          setRecipientId(recipient.user_id);
          setRecipientDisplayName(recipient.display_name ?? undefined);
          console.log('[ConversationPage] ✅ RECIPIENT SET:', {
            recipient_id: recipient.user_id.substring(0, 8) + '...',
            has_public_key: !!recipient.public_key,
            public_key_preview: recipient.public_key?.substring(0, 40) + '...',
          });
        } else {
          setRecipientId(null);
          setRecipientDisplayName(undefined);
          console.warn('[ConversationPage] ⚠️ No recipient found (group chat or only you)');
        }

        // Set current user's display name for SetDisplayName component
        try {
          const me = members.find(m => m.user_id === resolvedUserId);
          setCurrentMemberDisplayName(me?.display_name ?? undefined);
        } catch (e) {
          setCurrentMemberDisplayName(undefined);
        }

        // After loading members, decide if we must block the UI to force restore/create
        try {
          const localKey = !!localStorage.getItem(`e2ee_private_key_${resolvedUserId}`);
          const seenKey = localStorage.getItem(`e2ee_sync_seen_${resolvedUserId}`) === '1';
          const otherHasPublicKey = members.some(m => m.user_id !== resolvedUserId && !!m.public_key);
          // Only require overlay when other members have public keys and local key missing
          // but avoid blocking if passphrase modal is already open or E2EE is ready
          if (otherHasPublicKey && !localKey && !showPassphraseModal && !e2eeReady) {
            setE2eeOverlayMessage('Phòng này yêu cầu E2EE. Vui lòng khôi phục khoá từ backup hoặc tạo khoá mới để nhắn tin.');
            setE2eeOverlayRequired(true);
          } else if ((showSyncNotice as boolean) === true && !seenKey && !localKey && !showPassphraseModal && !e2eeReady) {
            setE2eeOverlayMessage('Phát hiện khoá E2EE trên server. Vui lòng khôi phục khoá để đồng bộ trước khi nhắn tin.');
            setE2eeOverlayRequired(true);
          } else {
            setE2eeOverlayRequired(false);
            setE2eeOverlayMessage(null);
          }
        } catch (e) {
          console.warn('[ConversationPage] Failed to evaluate E2EE overlay requirement', e);
        }
      } catch (error) {
        console.error('[ConversationPage] ❌ Failed to fetch recipient:', error);
        setRecipientId(null);
      }
    };

    fetchRecipient();
  }, [resolvedRoom, resolvedUserId, e2eeReady]);

  // Render passphrase modal for backup/restore when required
  const onSubmitPassphrase = async (passphrase: string, remember: boolean) => {
    if (passphraseMode === 'create') {
      await handleCreateBackup(passphrase, remember);
    } else if (passphraseMode === 'restore') {
      await handleRestore(passphrase, remember);
    }
  };

  // Passphrase modal UI
  const [modalOpen, setModalOpen] = React.useState(false);

  // Keep modal open state in sync with hook
  useEffect(() => {
    setModalOpen(Boolean(showPassphraseModal));
  }, [showPassphraseModal]);

  // Sync notice banner JSX
  // const SyncNotice = () => {
  //   if (!localSyncNoticeVisible) return null;
  //   return (
  //     <div className="max-w-4xl mx-auto p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm flex items-center justify-between mb-4">
  //       <div>Khôi phục khoá E2EE đã có trên server — khoá đã được đồng bộ ở thiết bị khác.</div>
  //       <div className="flex items-center gap-2">
  //         <button
  //           className="px-3 py-1 bg-etechs-primary text-white rounded-xl"
  //           onClick={() => {
  //             setLocalSyncNoticeVisible(false);
  //             try {
  //               dismissSyncNotice?.();
  //             } catch (e) {}
  //           }}
  //         >
  //           Đóng
  //         </button>
  //       </div>
  //     </div>
  //   );
  // };

  // Decrypt messages when they arrive
  useEffect(() => {
    if (!e2eeReady) {
      console.log('[ConversationPage] ⏸️ E2EE not ready, skipping decrypt');
      return;
    }

    const decrypt = async () => {
      console.log('\n🔐 ==================== DECRYPTING MESSAGES ====================');
      console.log('[ConversationPage] Total messages to process:', combinedMessages.length);
      console.log('[ConversationPage] Already decrypted:', Object.keys(decryptedMessages).length);

      const decrypted: Record<string, string> = {};
      let skipped = 0;
      let attempted = 0;
      let succeeded = 0;

      for (const msg of combinedMessages) {
        // Skip if already decrypted
        if (decryptedMessages[msg.id]) {
          decrypted[msg.id] = decryptedMessages[msg.id];
          skipped++;
          continue;
        }

        attempted++;
        console.log(`\n[ConversationPage] Processing message ${attempted}/${combinedMessages.length - skipped}:`, {
          id: msg.id?.substring(0, 8) + '...',
          sender: msg.sender_id?.substring(0, 8) + '...',
          has_encrypted_key: !!msg.encrypted_key,
          has_iv: !!msg.iv,
        });

        // Try to decrypt
        const text = await decryptIncoming(msg);
        if (text) {
          decrypted[msg.id] = text;
          succeeded++;
          console.log(`[ConversationPage] ✅ Decrypted successfully`);
        } else {
          console.log(`[ConversationPage] ⚠️ No text returned`);
        }
      }

      console.log('\n[ConversationPage] 📊 Decrypt Summary:', {
        total: combinedMessages.length,
        skipped,
        attempted,
        succeeded,
        failed: attempted - succeeded,
      });
      console.log('================================================================\n');

      setDecryptedMessages(decrypted);
    };

    decrypt();
  }, [combinedMessages, e2eeReady]);

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

  // Mark read when entering room
  useEffect(() => {
    if (!resolvedRoom || !resolvedUserId) return;
    callMarkRoomRead({ room_id: resolvedRoom, user_id: resolvedUserId })
      .then(() => {
        resetUnread(resolvedRoom);
      })
      .catch(() => {
        // ignore
      });
  }, [resolvedRoom, resolvedUserId, resetUnread]);

  // Auto-scroll when new messages arrive (not when reactions update)
  useEffect(() => {
    const currentCount = combinedMessages.length;
    const prevCount = prevMessageCountRef.current;

    if (currentCount > prevCount) {
      const container = messagesContainerRef.current;
      // fallback to endRef if container not available
      if (!container) {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Check if user is near bottom (threshold) OR last message was sent by current user -> then scroll
        const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
        const threshold = 150; // px
        const lastMsg = combinedMessages[combinedMessages.length - 1];
        const shouldForceScroll = lastMsg?.sender_id === resolvedUserId || distanceFromBottom < threshold;

        if (shouldForceScroll) {
          const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
            try {
              container.scrollTo({ top: container.scrollHeight, behavior });
            } catch (e) {
              container.scrollTop = container.scrollHeight;
            }
          };

          // immediate scroll and one delayed attempt (images/media may load after)
          scrollToBottom('smooth');
          setTimeout(() => scrollToBottom('auto'), 200);
        }
      }
    }

    prevMessageCountRef.current = currentCount;
  }, [combinedMessages]);

  // When switching rooms, always scroll to bottom after messages load/render
  useEffect(() => {
    if (prevRoomRef.current !== resolvedRoom) {
      // small delay to allow messages to render; perform a couple attempts to handle media
      const tryScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        try {
          container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });
        } catch (e) {
          container.scrollTop = container.scrollHeight;
        }
      };

      tryScroll();
      const t1 = setTimeout(tryScroll, 150);
      const t2 = setTimeout(tryScroll, 400);
      prevRoomRef.current = resolvedRoom;
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [resolvedRoom]);

  // Debounce mark-read when new messages arrive in current room
  useEffect(() => {
    if (!resolvedRoom || !resolvedUserId) return;
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    markReadTimerRef.current = setTimeout(() => {
      callMarkRoomRead({ room_id: resolvedRoom, user_id: resolvedUserId })
        .then(() => resetUnread(resolvedRoom))
        .catch(() => {
          // ignore
        });
    }, 800);
    return () => {
      if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current);
    };
  }, [combinedMessages.length, resolvedRoom, resolvedUserId, resetUnread]);

  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    setSelectedConversationId(roomId);
  };

  // Room creation is handled via UI elsewhere; keep `createRoom` from hook available when needed.

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
        // Send text only via WebSocket with E2EE if ready
        let encrypted = null;

        console.log('[ConversationPage] 📤 SENDING MESSAGE:', {
          text_preview: text.substring(0, 20) + '...',
          e2ee_ready: e2eeReady,
          recipient_id: recipientId?.substring(0, 8) + '...',
          current_user: resolvedUserId.substring(0, 8) + '...',
        });

        // If E2EE not ready but we have a recipient, attempt on-demand initialization
        let readyNow = e2eeReady;
        if (!readyNow && recipientId) {
          try {
            const ensured = await ensureReady?.();
            readyNow = !!ensured;
            console.log('[ConversationPage] ensureReady returned:', ensured);
          } catch (e) {
            console.warn('[ConversationPage] ensureReady failed:', e);
          }
        }

        // If we have a recipient but initialization did NOT succeed, block plaintext send
        if (!readyNow && recipientId) {
          console.warn('[ConversationPage] ✋ E2EE not ready and ensureReady failed — blocking plaintext send to avoid storing unhashed ciphertext');
          alert('Không thể gửi: mã hóa E2EE chưa sẵn sàng. Vui lòng khôi phục hoặc tạo khoá trước khi gửi tin nhắn.');
          return;
        }

        if (readyNow && recipientId) {
          console.log('[ConversationPage] 🔐 E2EE enabled, encrypting...');

          // Encrypt message for the recipient (Double Encryption Model)
          encrypted = await encryptForRecipient(text.trim(), recipientId);

          console.log('[ConversationPage] 🔐 Encryption result:', {
            has_ciphertext: !!encrypted?.ciphertext,
            has_key_recipient: !!(encrypted as any)?.encrypted_key_recipient,
            has_key_sender: !!(encrypted as any)?.encrypted_key_sender,
            iv_length: (encrypted as any)?.iv?.length,
          });

          // Defensive: do not send ciphertext without both encrypted keys
          if (!encrypted || !(encrypted as any).encrypted_key_recipient || !(encrypted as any).encrypted_key_sender) {
            console.error('[ConversationPage] ❌ Encryption produced no recipient/sender keys — aborting send to avoid storing unusable ciphertext');
            alert('Mã hoá thất bại: khoá mã hoá không có. Vui lòng thử lại hoặc khởi tạo E2EE.');
            return;
          }
          if (encrypted) {
            console.log('[ConversationPage] ✅ Encrypted payload:', {
              ciphertext_length: encrypted.ciphertext.length,
              has_encrypted_key_recipient: !!(encrypted as any).encrypted_key_recipient,
              has_encrypted_key_sender: !!(encrypted as any).encrypted_key_sender,
              encrypted_key_recipient_length: (encrypted as any).encrypted_key_recipient?.length,
              encrypted_key_sender_length: (encrypted as any).encrypted_key_sender?.length,
              iv_length: encrypted.iv.length,
              ciphertext_preview: encrypted.ciphertext.substring(0, 40) + '...',
            });

            // Send encrypted message via WebSocket (Double Encryption Model)
            // Pass BOTH encrypted keys so backend stores both
            // Sender uses encrypted_key_sender to decrypt own messages after reload
            // Recipient uses encrypted_key_recipient to decrypt received messages
            await send(
              encrypted.ciphertext,
              {
                encrypted_key_recipient: (encrypted as any).encrypted_key_recipient,
                encrypted_key_sender: (encrypted as any).encrypted_key_sender,
                iv: encrypted.iv,
              },
              text.trim()
            );
          } else {
            console.error('[ConversationPage] ❌ Encryption FAILED!');
            console.error('[ConversationPage] 🚨 Possible reasons:');
            console.error('[ConversationPage]    - Recipient has not initialized E2EE (not in the room yet)');
            console.error('[ConversationPage]    - Recipient public key not found on backend');
            console.error('[ConversationPage]    - Network error fetching public keys');

            // Enforce greeting-only fallback when recipient has no public key.
            const textTrim = text.trim();
            const greetingRegex = /^(hi|hello|xin chào|chào|hey)([!.,\s]|$)/i;
            const isGreeting = greetingRegex.test(textTrim);
            const greetingKey = `greeting_sent_${resolvedRoom}_${recipientId ?? 'unknown'}`;
            const greetingSent = localStorage.getItem(greetingKey) === '1';

            // If we don't know recipient, fall back to existing behavior (allow plaintext)
            if (!recipientId) {
              console.log('[ConversationPage] No recipientId - sending plaintext fallback');
              await send(`⚠️ [E2EE Failed - Sent as plaintext]: ${textTrim}`);
              alert('Không thể mã hóa tin nhắn vì không xác định được người nhận. Tin đã gửi dưới dạng plaintext.');
            } else if (!greetingSent) {
              // First allowed plaintext is a greeting only
              if (isGreeting) {
                await send(textTrim);
                try {
                  localStorage.setItem(greetingKey, '1');
                } catch (e) {}
                alert('Lời chào đã gửi. Khi người nhận mở tin nhắn, bạn sẽ có thể nhắn tiếp một cách bảo mật.');
              } else {
                alert('Người nhận chưa khởi tạo E2EE. Vui lòng chỉ gửi lời chào đầu tiên (ví dụ: "Xin chào").\n\nHoặc chờ người đó mở tin nhắn để E2EE được khởi tạo.');
                return;
              }
            } else {
              // Greeting already sent but recipient hasn't opened yet
              alert('Bạn đã gửi lời chào. Vui lòng chờ người nhận mở tin nhắn để nhắn tiếp một cách bảo mật.');
              return;
            }
          }
        } else {
          // E2EE not ready or no recipient, send plaintext
          if (!e2eeReady) {
            console.log('[ConversationPage] 📢 E2EE not ready, sending plaintext');
          }
          if (!recipientId) {
            console.log('[ConversationPage] 📢 No recipient ID, sending plaintext');
          }
          await send(text.trim());
        }

        setText('');
      }
    } catch (e) {
      console.error('Send failed:', e);
    }
  };

  return (
    // Fixed container below the top header so inner columns handle scrolling
    // Use dynamic left offset (style) so we respect the main sidebar open/collapse state
    <div style={{ left: leftOffset }} className="fixed top-16 right-0 bottom-0 flex gap-4 overflow-hidden p-0">
      {/* Left: Room sidebar */}
      <RoomSidebar rooms={rooms} selectedRoomId={selectedConversationId} userId={resolvedUserId} onRoomSelect={handleRoomSelect} />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Sync notice disabled per user request */}
        {/* <SyncNotice /> */}
        {passphraseMode && <PassphraseModal open={modalOpen} mode={passphraseMode} onClose={() => setShowPassphraseModal(false)} onSubmit={onSubmitPassphrase} />}

        {/* Center: Message area with input */}
        <div className="relative flex-1 min-h-0">
          <MessageArea
            pinnedMessages={pinnedMessages}
            regularMessages={regularMessages}
            currentUserId={resolvedUserId}
            chatStatus={chatStatus}
            lastError={lastError}
            conversationTitle={
              // Prefer server-provided room name, then conversations placeholder
              rooms.find(r => r.room_id === selectedConversationId)?.name || conversations.find(c => c.id === selectedConversationId)?.title
            }
            sendReaction={sendReaction}
            onRefresh={refreshRoomMembers}
            endRef={endRef}
            messagesContainerRef={messagesContainerRef}
            decryptedMessages={decryptedMessages}
            roomId={resolvedRoom}
            currentMemberDisplayName={currentMemberDisplayName}
            messageInput={<MessageInput text={text} selectedFiles={selectedFiles} previews={previews} fileInputRef={fileInputRef} onTextChange={setText} onFileSelect={handleFileSelect} onRemoveFile={removeFile} onSend={handleSend} onAttachClick={() => fileInputRef.current?.click()} />}
          />

          {recipientId && (
            <div className="absolute top-4 right-4 z-40">
              <SetDisplayName
                roomId={resolvedRoom}
                userId={recipientId}
                currentDisplayName={recipientDisplayName}
                onSuccess={() => {
                  // Refresh members/messages and room list so sidebar/header update immediately
                  try {
                    refreshRoomMembers();
                  } catch (e) {}
                  try {
                    loadRooms();
                  } catch (e) {}
                }}
                onOptimistic={(name, targetId) => {
                  // Update recipient display name immediately for optimistic UI
                  if (targetId === recipientId) setRecipientDisplayName(name || undefined);
                }}
              />
            </div>
          )}

          {e2eeOverlayRequired && (
            // Limit overlay bottom so message input stays visible and usable
            <div className="absolute left-0 right-0 top-0 bottom-16 bg-white/80 z-50 flex items-center justify-center p-6">
              <div className="max-w-xl text-center">
                <h3 className="text-lg font-semibold mb-2">Bảo mật đầu cuối yêu cầu khoá</h3>
                <p className="mb-4">{e2eeOverlayMessage || 'Phòng này yêu cầu E2EE. Vui lòng khôi phục khoá hoặc tạo khoá mới để tiếp tục.'}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    className="px-4 py-2 bg-etechs-primary text-white rounded"
                    onClick={() => {
                      try {
                        setPassphraseMode && setPassphraseMode('restore');
                      } catch (e) {}
                      try {
                        setShowPassphraseModal(true);
                      } catch (e) {}
                    }}
                  >
                    Khôi phục từ backup
                  </button>
                  <button
                    className="px-4 py-2 border rounded"
                    onClick={() => {
                      try {
                        setPassphraseMode && setPassphraseMode('create');
                      } catch (e) {}
                      try {
                        setShowPassphraseModal(true);
                      } catch (e) {}
                    }}
                  >
                    Tạo & Backup khoá
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* E2EE Debug Panel - Chỉ hiện trong dev mode
      {selectedConversationId && <E2EEDebugPanel roomId={selectedConversationId} />} */}
    </div>
  );
};

export { ConversationPage };
export default ConversationPage;
