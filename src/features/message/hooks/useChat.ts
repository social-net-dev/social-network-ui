import { useEffect, useRef, useState } from 'react';
import ChatClient from '../lib/chatClient';
import type { MessageOut } from '../types/message.types';

export function useChat({
  room,
  userId,
  wsUrl,
  restBase,
  onReactionEvent,
  onMessage: onMessageCallback,
  onExternalMessage,
  onRead,
  onDelete,
}: {
  room: string;
  userId: string;
  wsUrl: string;
  restBase: string;
  onReactionEvent?: (data: any) => void;
  onMessage?: (msg: MessageOut) => void;
  onExternalMessage?: (msg: MessageOut) => void;
  onRead?: (data: any) => void;
  onDelete?: (messageId: string) => void;
}) {
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  const clientRef = useRef<ChatClient | null>(null);

  useEffect(() => {
    // clear previous room messages when room/user changes to avoid cross-room leakage
    setMessages([]);
    const resolvedWs = wsUrl || import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'ws://localhost:8001/ws' : 'wss://api.example.com/ws');

    const resolvedRest = restBase || import.meta.env.VITE_API_URL_MESSAGE || (import.meta.env.DEV ? 'http://localhost:8001' : 'https://api.example.com');

    console.log('\n🔄 ==================== useChat EFFECT ====================');
    console.log('[useChat] 🔌 Setting up WebSocket for:', {
      room,
      userId: userId.substring(0, 8) + '...',
      resolvedWs,
      resolvedRest,
    });
    console.log('=========================================================\n');
    const optsObj = { wsUrl: resolvedWs, restBase: resolvedRest, room, userId };
    // reuse existing client when options match to avoid duplicate sockets
    if (clientRef.current && typeof (clientRef.current as any).getOpts === 'function') {
      try {
        const existingOpts = (clientRef.current as any).getOpts();
        console.log('[useChat] 🔍 Checking existing connection:', {
          existing_room: existingOpts.room,
          new_room: room,
          will_reuse: JSON.stringify(existingOpts) === JSON.stringify(optsObj),
        });

        if (JSON.stringify(existingOpts) === JSON.stringify(optsObj)) {
          console.log('[useChat] ♻️ REUSING existing WebSocket connection');
          const existing = clientRef.current;
          existing.onStatus = s => {
            setStatus(s);
            if (s === 'open') setLastError(null);
          };
          existing.onError = e => setLastError(String(e));
          existing.onMessage = m => {
            console.log('[useChat] 📨 RECEIVED message via WebSocket:', {
              message_id: m.id,
              message_room: m.room_id,
              current_room: room,
              sender: m.sender_id?.substring(0, 8) + '...',
              is_for_this_room: m.room_id === room,
            });

            if (m.room_id && m.room_id !== room) {
              console.log('[useChat] 📭 Message for different room, calling onExternalMessage');
              onExternalMessage?.(m);
              return;
            }

            setMessages(prev => {
              if (m.client_id) {
                const idx = prev.findIndex(x => x.client_id === m.client_id);
                if (idx !== -1) {
                  const copy = [...prev];
                  // 🔑 CRITICAL: Preserve _plaintext from optimistic message when merging with server broadcast
                  const optimisticPlaintext = copy[idx]._plaintext;
                  copy[idx] = { ...copy[idx], ...m, id: m.id, _status: 'sent', _plaintext: optimisticPlaintext };
                  return copy;
                }
              }
              // avoid duplicate server messages
              if (m.id && prev.find(x => x.id === m.id)) return prev;
              return [...prev, m];
            });
          };
          existing.onAck = ack => {
            if (ack.client_id && ack.status === 'ok') {
              setMessages(prev =>
                prev.map(item => {
                  if (item.id === ack.client_id) {
                    return {
                      ...item,
                      id: ack.server_id ?? item.id,
                      _status: 'sent',
                      created_at: ack.created_at ?? item.created_at,
                      _plaintext: item._plaintext,
                    };
                  }
                  return item;
                })
              );
            } else if (ack.client_id && ack.status === 'error') {
              setMessages(prev => prev.map(item => (item.id === ack.client_id ? { ...item, _status: 'failed' } : item)));
            }
          };
          existing.onReaction = data => {
            console.log('[useChat] Reaction event received (reused client):', data);

            // Nếu là ACK, không cần xử lý gì (optimistic update đã hiện)
            if (data.type === 'ack' && (data.action === 'reaction_added' || data.action === 'reaction_removed')) {
              // If ACK originated from this user, keep optimistic update; but
              // if it's an ACK for another user (broadcasted by server), apply it so remote clients see the change.
              if (data.user_id === userId) {
                console.log('[useChat] Reaction ACK from self - keeping optimistic update');
                return;
              }
              console.log('[useChat] Reaction ACK from other user - applying update');
            }

            // Gọi callback để ConversationPage cập nhật fetchedMessages
            if (onReactionEvent) {
              console.log('[useChat] Calling onReactionEvent callback (reused)');
              onReactionEvent(data);
            }

            setMessages(prev => {
              return prev.map(msg => {
                if (msg.id !== data.message_id) return msg;
                const reactions = (msg as any).reactions || [];
                if (data.type === 'reaction') {
                  const exists = reactions.find((r: any) => r.user_id === data.user_id && r.emoji === data.emoji);
                  if (!exists) {
                    console.log(`[useChat] Adding reaction ${data.emoji} to message ${data.message_id}`);
                    return {
                      ...msg,
                      reactions: [
                        ...reactions,
                        {
                          id: data.reaction_id || Math.random().toString(),
                          user_id: data.user_id,
                          emoji: data.emoji,
                          created_at: new Date().toISOString(),
                        },
                      ],
                    };
                  }
                } else if (data.type === 'reaction_removed') {
                  console.log(`[useChat] Removing reaction ${data.emoji} from message ${data.message_id}`);
                  return {
                    ...msg,
                    reactions: reactions.filter((r: any) => !(r.user_id === data.user_id && r.emoji === data.emoji)),
                  };
                }
                return msg;
              });
            });
          };

          existing.onRead = data => {
            onRead?.(data);
          };
          existing.onDelete = id => {
            console.log('[useChat] onDelete (reused client) received:', id);
            setMessages(prev => prev.filter(m => m.id !== id));
            onDelete?.(id);
          };
          return () => {
            // detach handlers only
            existing.onMessage = () => {};
            existing.onAck = () => {};
            existing.onStatus = () => {};
            existing.onError = () => {};
            existing.onReaction = () => {};

            existing.onRead = () => {};
            existing.onDelete = () => {};
          };
        }
      } catch {}
    }

    console.log('[useChat] 🆕 CREATING NEW WebSocket connection for room:', room);
    const client = new ChatClient({
      wsUrl: resolvedWs,
      restBase: resolvedRest,
      room,
      userId,
    });
    client.onStatus = s => {
      setStatus(s);
      if (s === 'open') setLastError(null);
    };
    client.onError = e => setLastError(String(e));
    client.onMessage = m => {
      // DEBUG: log raw incoming message to verify encrypted metadata
      console.log('[useChat] 📨 RECEIVED message via WebSocket (new client):', {
        message_id: m.id,
        message_room: m.room_id,
        current_room: room,
        sender: m.sender_id?.substring(0, 8) + '...',
        is_for_this_room: m.room_id === room,
        has_encrypted_key: !!m.encrypted_key,
        has_iv: !!m.iv,
      });

      if (m.room_id && m.room_id !== room) {
        console.log('[useChat] 📭 Message for different room, calling onExternalMessage');
        onExternalMessage?.(m);
        return;
      }

      // Call external callback first to remove optimistic from fetchedMessages
      if (onMessageCallback) {
        try {
          onMessageCallback(m);
        } catch (e) {
          console.error('onMessage callback error:', e);
        }
      }
      setMessages(prev => {
        // replace optimistic item if client_id matches (keep client_id on item)
        if (m.client_id) {
          const idx = prev.findIndex(x => x.client_id === m.client_id);
          if (idx !== -1) {
            const copy = [...prev];
            // 🔑 CRITICAL: Preserve _plaintext and E2EE keys from optimistic message
            const optimisticPlaintext = copy[idx]._plaintext;
            const optimisticEncryptedKeyRecipient = copy[idx].encrypted_key_recipient;
            const optimisticEncryptedKeySender = copy[idx].encrypted_key_sender;
            // merge into existing optimistic item
            copy[idx] = {
              ...copy[idx],
              ...m,
              id: m.id,
              _status: 'sent',
              _plaintext: optimisticPlaintext,
              // Preserve E2EE keys if WebSocket message doesn't have them (backend issue)
              encrypted_key_recipient: m.encrypted_key_recipient ?? optimisticEncryptedKeyRecipient,
              encrypted_key_sender: m.encrypted_key_sender ?? optimisticEncryptedKeySender,
            };
            return copy;
          }
        }
        // avoid duplicate server messages by server id
        if (m.id && prev.find(x => x.id === m.id)) return prev;
        return [...prev, m];
      });
    };
    client.onReaction = data => {
      console.log('[useChat] Reaction event received:', data);

      // If it's an ACK reaction event, only skip handling when it's from this client
      if (data.type === 'ack' && (data.action === 'reaction_added' || data.action === 'reaction_removed')) {
        if (data.user_id === userId) {
          console.log('[useChat] Reaction ACK from self - keeping optimistic update');
          return;
        }
        console.log('[useChat] Reaction ACK from other user - applying update');
      }
      client.onDelete = id => {
        console.log('[useChat] onDelete received:', id);
        setMessages(prev => prev.filter(m => m.id !== id));
        onDelete?.(id);
      };

      // Gọi callback để ConversationPage cập nhật fetchedMessages
      if (onReactionEvent) {
        console.log('[useChat] Calling onReactionEvent callback');
        onReactionEvent(data);
      }

      setMessages(prev => {
        console.log(`[useChat] Searching for message ${data.message_id} in ${prev.length} messages`);
        console.log(
          '[useChat] Message IDs:',
          prev.map(m => m.id)
        );

        return prev.map(msg => {
          if (msg.id !== data.message_id) return msg;

          console.log(`[useChat] Found matching message ${msg.id}`);
          const reactions = (msg as any).reactions || [];
          console.log(`[useChat] Current reactions:`, reactions);

          if (data.type === 'reaction') {
            // Thêm reaction (từ broadcast)
            const exists = reactions.find((r: any) => r.user_id === data.user_id && r.emoji === data.emoji);
            if (!exists) {
              console.log(`[useChat] Adding reaction ${data.emoji} to message ${data.message_id} from broadcast`);
              const newReactions = [
                ...reactions,
                {
                  id: data.reaction_id || Math.random().toString(),
                  user_id: data.user_id,
                  emoji: data.emoji,
                  created_at: new Date().toISOString(),
                },
              ];
              console.log(`[useChat] New reactions:`, newReactions);
              return {
                ...msg,
                reactions: newReactions,
              };
            } else {
              console.log(`[useChat] Reaction already exists, skipping`);
            }
          } else if (data.type === 'reaction_removed') {
            // Bỏ reaction (từ broadcast)
            console.log(`[useChat] Removing reaction ${data.emoji} from message ${data.message_id} from broadcast`);
            return {
              ...msg,
              reactions: reactions.filter((r: any) => !(r.user_id === data.user_id && r.emoji === data.emoji)),
            };
          }
          return msg;
        });
      });
    };

    client.onRead = data => {
      onRead?.(data);
    };

    client.onAck = ack => {
      if (ack.client_id) {
        if (ack.status === 'ok') {
          setMessages(prev =>
            prev.map(item => {
              if (item.client_id === ack.client_id) {
                return {
                  ...item,
                  id: ack.server_id ?? item.id,
                  _status: 'sent',
                  created_at: ack.created_at ?? item.created_at,
                  _plaintext: item._plaintext,
                };
              }
              return item;
            })
          );
        } else if (ack.status === 'error') {
          setMessages(prev => prev.map(item => (item.client_id === ack.client_id ? { ...item, _status: 'failed' } : item)));
        }
      }
    };
    clientRef.current = client;
    return () => {
      console.log('[useChat] 🔌 CLEANUP: Closing WebSocket for room:', room);
      client.close();
      clientRef.current = null;
    };
  }, [room, userId, wsUrl, restBase]);

  const send = async (
    content: string,
    encryptedData?: {
      encrypted_key?: string; // Backward compat
      encrypted_key_recipient?: string; // Double encryption: key for recipient
      encrypted_key_sender?: string; // Double encryption: key for sender
      iv: string;
    },
    originalPlaintext?: string
  ) => {
    const client_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: MessageOut = {
      id: client_id,
      room_id: room,
      sender_id: userId,
      message: encryptedData ? undefined : content, // Don't show plaintext if encrypted
      ciphertext: encryptedData ? content : null, // Use content as ciphertext if encrypted
      created_at: null,
      client_id,
      _status: 'sending',
      // 🔑 Double Encryption Model: store BOTH encrypted keys
      encrypted_key: encryptedData?.encrypted_key, // Backward compat
      encrypted_key_recipient: encryptedData?.encrypted_key_recipient,
      encrypted_key_sender: encryptedData?.encrypted_key_sender,
      iv: encryptedData?.iv,
      _plaintext: originalPlaintext || (encryptedData ? undefined : content), // 🔑 Store original plaintext for display
    };

    setMessages(prev => [...prev, optimistic]);
    try {
      console.log('[useChat] 🔁 Sending message to server with encrypted metadata:', {
        room_id: room,
        sender_id: userId?.substring(0, 8) + '...',
        has_encrypted_key: !!encryptedData?.encrypted_key,
        has_encrypted_key_recipient: !!encryptedData?.encrypted_key_recipient,
        has_encrypted_key_sender: !!encryptedData?.encrypted_key_sender,
        iv_length: encryptedData?.iv?.length,
      });

      await clientRef.current!.send({
        room_id: room,
        sender_id: userId,
        content,
        client_id,
        // 🔑 Send BOTH encrypted keys to backend (Double Encryption Model)
        encrypted_key: encryptedData?.encrypted_key,
        encrypted_key_recipient: encryptedData?.encrypted_key_recipient,
        encrypted_key_sender: encryptedData?.encrypted_key_sender,
        iv: encryptedData?.iv,
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setMessages(prev => prev.map(it => (it.id === client_id ? { ...it, _status: 'failed', _error: errMsg } : it)));
      throw e;
    }
  };

  const sendReaction = async (messageId: string, emoji: string, remove = false) => {
    if (!clientRef.current) throw new Error('Chat client not ready');

    // Optimistic update: gọi onReactionEvent ngay để update fetchedMessages
    if (onReactionEvent) {
      const optimisticData = {
        type: remove ? 'reaction_removed' : 'reaction',
        message_id: messageId,
        user_id: userId,
        emoji: emoji,
        reaction_id: `temp-${Date.now()}`,
      };
      console.log('[useChat] Calling onReactionEvent for optimistic update');
      onReactionEvent(optimisticData);
    }

    // Gửi qua WebSocket
    try {
      await clientRef.current.sendReaction(messageId, emoji, remove);
    } catch (e) {
      console.error('[useChat] sendReaction via WS failed:', e);
      // Rollback optimistic update bằng cách gọi lại onReactionEvent với action ngược lại
      if (onReactionEvent) {
        const rollbackData = {
          type: remove ? 'reaction' : 'reaction_removed',
          message_id: messageId,
          user_id: userId,
          emoji: emoji,
        };
        console.log('[useChat] Rolling back optimistic update');
        onReactionEvent(rollbackData);
      }
      throw e;
    }
  };

  return { messages, send, sendReaction, status, lastError };
}

export default useChat;
