import { useEffect, useRef, useState } from 'react';
import ChatClient from '../lib/chatClient';
import type { MessageOut } from '../types/message.types';

export function useChat({ room, userId, wsUrl, restBase, onReactionEvent, onMessage: onMessageCallback }: { room: string; userId: string; wsUrl: string; restBase: string; onReactionEvent?: (data: any) => void; onMessage?: (msg: MessageOut) => void }) {
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [status, setStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  const clientRef = useRef<ChatClient | null>(null);

  useEffect(() => {
    // clear previous room messages when room/user changes to avoid cross-room leakage
    setMessages([]);
    const resolvedWs = wsUrl || import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'ws://localhost:8000/ws' : 'wss://api.example.com/ws');
    const resolvedRest = restBase || import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.example.com');
    console.debug('useChat: connecting', {
      room,
      userId,
      resolvedWs,
      resolvedRest,
    });
    const optsObj = { wsUrl: resolvedWs, restBase: resolvedRest, room, userId };
    // reuse existing client when options match to avoid duplicate sockets
    if (clientRef.current && typeof (clientRef.current as any).getOpts === 'function') {
      try {
        const existingOpts = (clientRef.current as any).getOpts();
        if (JSON.stringify(existingOpts) === JSON.stringify(optsObj)) {
          const existing = clientRef.current;
          existing.onStatus = s => {
            setStatus(s);
            if (s === 'open') setLastError(null);
          };
          existing.onError = e => setLastError(String(e));
          existing.onMessage = m => {
            setMessages(prev => {
              if (m.client_id) {
                const idx = prev.findIndex(x => x.client_id === m.client_id);
                if (idx !== -1) {
                  const copy = [...prev];
                  copy[idx] = { ...copy[idx], ...m, id: m.id, _status: 'sent' };
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
                prev.map(item =>
                  item.id === ack.client_id
                    ? {
                        ...item,
                        id: ack.server_id ?? item.id,
                        _status: 'sent',
                        created_at: ack.created_at ?? item.created_at,
                      }
                    : item
                )
              );
            } else if (ack.client_id && ack.status === 'error') {
              setMessages(prev => prev.map(item => (item.id === ack.client_id ? { ...item, _status: 'failed' } : item)));
            }
          };
          existing.onReaction = data => {
            console.log('[useChat] Reaction event received (reused client):', data);

            // Nếu là ACK, không cần xử lý gì (optimistic update đã hiện)
            if (data.type === 'ack' && (data.action === 'reaction_added' || data.action === 'reaction_removed')) {
              console.log('[useChat] Reaction ACK - keeping optimistic update');
              return;
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
          return () => {
            // detach handlers only
            existing.onMessage = () => {};
            existing.onAck = () => {};
            existing.onStatus = () => {};
            existing.onError = () => {};
            existing.onReaction = () => {};
          };
        }
      } catch {}
    }

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
            // merge into existing optimistic item
            copy[idx] = { ...copy[idx], ...m, id: m.id, _status: 'sent' };
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

      // Nếu là ACK, không cần xử lý gì (optimistic update đã hiện)
      if (data.type === 'ack' && (data.action === 'reaction_added' || data.action === 'reaction_removed')) {
        console.log('[useChat] Reaction ACK - keeping optimistic update');
        return;
      }

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
    client.onAck = ack => {
      if (ack.client_id) {
        if (ack.status === 'ok') {
          setMessages(prev =>
            prev.map(item =>
              item.client_id === ack.client_id
                ? {
                    ...item,
                    id: ack.server_id ?? item.id,
                    _status: 'sent',
                    created_at: ack.created_at ?? item.created_at,
                  }
                : item
            )
          );
        } else if (ack.status === 'error') {
          setMessages(prev => prev.map(item => (item.client_id === ack.client_id ? { ...item, _status: 'failed' } : item)));
        }
      }
    };
    clientRef.current = client;
    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [room, userId, wsUrl, restBase]);

  const send = async (content: string) => {
    const client_id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: MessageOut = {
      id: client_id,
      room_id: room,
      sender_id: userId,
      message: content,
      ciphertext: null,
      created_at: null,
      client_id,
      _status: 'sending',
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      await clientRef.current!.send({
        room_id: room,
        sender_id: userId,
        content,
        client_id,
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
