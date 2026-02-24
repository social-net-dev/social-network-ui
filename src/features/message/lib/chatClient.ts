import type { MessageIn, MessageOut, ServerAck } from '../types/message.types';
import { getMessageApiUrl, getApiBaseUrl } from '@/lib/config';
import { appendAuthToken } from '@/lib/utils/api';

type ChatClientOpts = {
  wsUrl: string;
  restBase: string;
  room: string;
  userId: string;
};

export class ChatClient {
  private ws: WebSocket | null = null;
  private opts: ChatClientOpts;
  private pending: MessageIn[] = [];
  private backoff = 1000;
  private connecting = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;
  public onMessage: (m: MessageOut) => void = () => {};
  public onAck: (ack: ServerAck) => void = () => {};
  public onDelete: (id: string) => void = () => {};
  public onError: (err: unknown) => void = () => {};
  public onStatus: (s: 'connecting' | 'open' | 'closed' | 'error') => void = () => {};
  public onReaction: (data: any) => void = () => {};
  public onRead: (data: any) => void = () => {};

  constructor(opts: ChatClientOpts) {
    this.opts = opts;
    this.connect();
  }

  // expose opts for callers to detect same client
  getOpts() {
    return { ...this.opts } as ChatClientOpts;
  }

  private url() {
    const { wsUrl, room, userId } = this.opts;

    if (!userId) {
      throw new Error('ChatClient: user_id is required');
    }
    const params = new URLSearchParams();
    params.set('user_id', String(userId));
    if (room) params.set('room_id', String(room));
    return `${wsUrl}?${params.toString()}`;
  }

  connect() {
    // avoid creating multiple concurrent connections
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connecting) return;
    this.connecting = true;
    try {
      try {
        this.onStatus('connecting');
      } catch {}

      const wsUrl = this.url();
      console.log('======================== WebSocket Connection Attempt ========================');
      console.log('[ChatClient] 🔌 Connecting to:', wsUrl);
      console.log('[ChatClient] 📋 Connection params:', {
        user_id: this.opts.userId.substring(0, 8) + '...',
        room_id: this.opts.room,
        wsUrl: this.opts.wsUrl,
      });
      console.log('==============================================================================');

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[ChatClient] ✅ WebSocket connected successfully:', wsUrl);
        this.connecting = false;
        if (this.retryTimer) {
          clearTimeout(this.retryTimer);
          this.retryTimer = null;
        }
        try {
          this.onStatus('open');
        } catch {}
        this.backoff = 1000;
        while (this.pending.length && this.ws && this.ws.readyState === WebSocket.OPEN) {
          const m = this.pending.shift()!;
          this._sendViaWS(m).catch(() => {});
        }
      };
      this.ws.onmessage = ev => {
        try {
          const data = JSON.parse(ev.data);
          console.log('\\n\ud83d\udce1 ==================== WebSocket Message Received ====================');
          console.log('\ud83d\udce8 [ChatClient] RAW WebSocket Message:', {
            type: data.type,
            id: data.id,
            room_id: data.room_id,
            sender_id: data.sender_id?.substring(0, 8) + '...',
            current_connection_room: this.opts.room,
            is_correct_room: data.room_id === this.opts.room || data.type !== 'message',
            has_encrypted_key: !!data.encrypted_key,
            has_iv: !!data.iv,
            encrypted_key_preview: data.encrypted_key?.substring(0, 30) + '...',
            iv_preview: data.iv?.substring(0, 20) + '...',
            ciphertext_preview: data.ciphertext?.substring(0, 30) + '...',
          });
          console.log('======================================================================\\n');
          console.debug('ChatClient: message received', data);
          try {
            // Expose last incoming payload for debugging in console (temporary)
            (window as any).__lastWSIncomingMessage = data;
          } catch (_) {}
          const resolveAttachmentUrl = (url: string | null | undefined): string | null => {
            if (!url) return null;
            try {
              const apiBase = new URL(getApiBaseUrl());
              const msgBase = new URL(getMessageApiUrl());

              // Absolute URL
              if (url.startsWith('http')) {
                try {
                  const u = new URL(url);
                  if (u.origin === apiBase.origin && (u.pathname.startsWith('/files') || u.pathname.startsWith('/media') || u.pathname.startsWith('/api/media'))) {
                    const swapped = url.replace(apiBase.origin, msgBase.origin);
                    try {
                      const swappedUrl = new URL(swapped);
                      if (swappedUrl.origin === msgBase.origin) {
                        const separator = swapped.includes('?') ? '&' : '?';
                        const token = localStorage.getItem('auth_token')?.replace(/"/g, '');
                        return token ? `${swapped}${separator}access_token=${encodeURIComponent(token)}` : swapped;
                      }
                    } catch (e) {
                      return swapped;
                    }
                    return swapped;
                  }
                } catch (e) {
                  return url;
                }
                return url;
              }

              // Relative paths → prefix with message service base and append auth token
              const msgBaseStr = getMessageApiUrl().replace(/\/$/, '');
              const full = `${msgBaseStr}${url.startsWith('/') ? '' : '/'}${url}`;
              return appendAuthToken(full);
            } catch (e) {
              return url;
            }
          };

          if (data.type === 'ack') {
            // ACK cho reaction cũng đi qua onReaction nếu có action
            if (data.action === 'reaction_added' || data.action === 'reaction_removed') {
              console.log('[ChatClient] Reaction ACK received:', data);
              if (this.onReaction) {
                this.onReaction(data);
              }
            } else {
              this.onAck(data as ServerAck);
            }
          } else if (data.type === 'message') {
            // include possible attachment fields so FE can render images from WS broadcasts
            const out: any = {
              id: data.id ?? data.server_id ?? data.client_id,
              room_id: data.room_id ?? this.opts.room,
              sender_id: data.sender_id,
              message: data.message,
              ciphertext: data.ciphertext ?? null,
              created_at: data.created_at ?? new Date().toISOString(),
              client_id: data.client_id ?? undefined,
              _status: 'sent',
              // 🔑 E2EE fields - CRITICAL for realtime decryption
              // Double encryption support: return both recipient/sender encrypted keys
              encrypted_key_recipient: data.encrypted_key_recipient ?? data.encrypted_key ?? undefined,
              encrypted_key_sender: data.encrypted_key_sender ?? undefined,
              // Backward compat alias
              encrypted_key: data.encrypted_key ?? data.encrypted_key_recipient ?? undefined,
              iv: data.iv ?? undefined,
              // backend now returns attachments array with metadata
              // Normalize attachment URLs so realtime messages use message service host
              attachments:
                (data.attachments ?? null)
                  ? (data.attachments as any[]).map(a => {
                      const url = resolveAttachmentUrl(a.url);
                      const filename = a.filename ?? (a.url ? String(a.url).split('/').pop() : undefined);
                      const is_image = a.is_image === undefined ? /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(String(filename ?? a.url ?? '')) || (a.mime && String(a.mime).startsWith('image/')) : !!a.is_image;
                      return { ...a, url, filename, is_image };
                    })
                  : null,
              // legacy fallback
              attachment_url: resolveAttachmentUrl(data.attachment_url ?? null),
              attachment_urls: data.attachment_urls ? (data.attachment_urls as string[]).map((u: string) => resolveAttachmentUrl(u)) : null,
              pinned: data.pinned ?? false,
              reactions: data.reactions ?? [],
            } as MessageOut;
            console.log('[ChatClient] 📥 Message mapped from WebSocket:', {
              id: out.id,
              has_encrypted_key_recipient: !!out.encrypted_key_recipient,
              has_encrypted_key_sender: !!out.encrypted_key_sender,
              has_encrypted_key: !!out.encrypted_key,
              encrypted_key_recipient_length: out.encrypted_key_recipient?.length,
              encrypted_key_sender_length: out.encrypted_key_sender?.length,
              iv_length: out.iv?.length,
            });
            this.onMessage(out);
          } else if (data.type === 'reaction' || data.type === 'reaction_removed') {
            // broadcast reaction event to hook
            console.log('[ChatClient] Reaction broadcast event detected:', data);
            if (this.onReaction) {
              this.onReaction(data);
            } else {
              console.warn('[ChatClient] onReaction handler not set!');
            }
          } else if (data.type === 'message_deleted') {
            console.log('[ChatClient] Message deleted event received via WS:', data);
            try {
              // Support both shapes: { id } and { message_id }
              const deletedId = data.id ?? data.message_id ?? null;
              if (deletedId) {
                this.onDelete(deletedId);
              } else {
                console.warn('[ChatClient] message_deleted event missing id/message_id field', data);
              }
            } catch (e) {
              console.error('[ChatClient] onDelete handler error', e);
            }
          } else if (data.type === 'read') {
            if (this.onRead) {
              this.onRead(data);
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      };
      this.ws.onclose = ev => {
        console.log('======================== WebSocket Closed ========================');
        console.error('[ChatClient] ❌ WebSocket closed:', {
          code: ev.code,
          code_meaning:
            ev.code === 1006
              ? 'ABNORMAL CLOSURE (backend rejected or crashed)'
              : ev.code === 1000
                ? 'NORMAL CLOSURE'
                : ev.code === 1001
                  ? 'GOING AWAY'
                  : ev.code === 1002
                    ? 'PROTOCOL ERROR'
                    : ev.code === 1003
                      ? 'UNSUPPORTED DATA'
                      : ev.code === 1005
                        ? 'NO STATUS RECEIVED'
                        : ev.code === 1011
                          ? 'SERVER ERROR'
                          : 'UNKNOWN',
          reason: ev.reason || '(no reason)',
          wasClean: ev.wasClean,
          url: this.url(),
        });

        if (ev.code === 1006) {
          console.error('[ChatClient] 🔍 Error 1006 Diagnosis:');
          console.error('  - Backend WebSocket server may not be running on port 8001');
          console.error('  - Backend may be rejecting authentication');
          console.error('  - Room ID may not exist');
          console.error('  - Check backend logs for connection errors');
        }
        console.log('==================================================================');

        try {
          this.onStatus('closed');
        } catch {}
        try {
          if (!this.manualClose) {
            if (!ev.wasClean || ev.code !== 1000) {
              this.onError(new Error(`WebSocket closed abnormally: code=${ev.code} reason=${ev.reason || '(no reason)'}`));
            }
          }
        } catch {}
        this.ws = null;
        this.connecting = false;
        if (!this.manualClose) this.retryConnect();
      };
      this.ws.onerror = err => {
        console.error('ChatClient: websocket error', err, {
          readyState: this.ws?.readyState,
          url: this.url(),
        });
        try {
          this.onError(new Error(`WebSocket error readyState=${this.ws?.readyState} url=${this.url()}`));
        } catch {}
        try {
          this.onStatus('error');
        } catch {}
        // let onclose handle
      };
    } catch (e) {
      console.error('ChatClient: connect failed', e);
      try {
        this.onStatus('error');
      } catch {}
      try {
        this.onError(e);
      } catch {}
      this.ws = null;
      this.connecting = false;
      this.retryConnect();
    }
  }

  private retryConnect() {
    console.debug(`ChatClient: reconnecting in ${this.backoff}ms`);
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.manualClose) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.backoff = Math.min(this.backoff * 1.5, 30_000);
      this.connect();
    }, this.backoff);
  }

  async sendReaction(messageId: string, emoji: string, remove = false) {
    const payload = {
      action: 'reaction',
      message_id: messageId,
      emoji,
      remove,
    };
    console.log('[ChatClient] Sending reaction:', payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return;
      } catch (e) {
        console.error('[ChatClient] sendReaction failed:', e);
        throw e;
      }
    } else {
      console.warn('[ChatClient] WebSocket not open, cannot send reaction');
      throw new Error('WebSocket not connected');
    }
  }

  async send(msg: MessageIn) {
    const withId = { ...msg, client_id: msg.client_id ?? this._genClientId() };
    if (!withId.room_id) {
      throw new Error('ChatClient: cannot send without room_id');
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        console.debug('ChatClient: send via WS', withId);
        await this._sendViaWS(withId);
        return;
      } catch {
        // fallback to REST
      }
    }
    console.debug('ChatClient: WS not open, queueing and attempting REST', withId);
    this.pending.push(withId);
    try {
      return await this._sendViaREST(withId);
    } catch (e) {
      console.error('ChatClient: REST send failed', e, {
        url: this.opts.restBase,
        message: withId,
      });
      try {
        this.onError(e);
      } catch {}
      throw e;
    }
  }

  private _sendViaWS(message: MessageIn) {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          return reject(new Error('WS not open'));
        }
        const payload: any = {
          action: 'message',
          room_id: message.room_id,
          message: message.content,
          client_id: message.client_id,
        };
        // 🔑 Include E2EE fields if present (Double Encryption Model)
        // Send BOTH encrypted keys so backend stores both
        if ((message as any).encrypted_key_recipient) {
          payload.encrypted_key_recipient = (message as any).encrypted_key_recipient;
        }
        if ((message as any).encrypted_key_sender) {
          payload.encrypted_key_sender = (message as any).encrypted_key_sender;
        }
        // Backward compat: if only encrypted_key (old format), send it
        if ((message as any).encrypted_key && !(message as any).encrypted_key_recipient) {
          payload.encrypted_key = (message as any).encrypted_key;
        }
        if ((message as any).iv) {
          payload.iv = (message as any).iv;
        }
        try {
          console.log('\n📤 ==================== Sending Message via WS ====================');
          console.log('[ChatClient] 📤 Sending via WS:', {
            action: payload.action,
            room_id: payload.room_id,
            has_encrypted_key_recipient: !!payload.encrypted_key_recipient,
            has_encrypted_key_sender: !!payload.encrypted_key_sender,
            has_encrypted_key: !!payload.encrypted_key,
            has_iv: !!payload.iv,
            encrypted_key_recipient_length: payload.encrypted_key_recipient?.length,
            encrypted_key_sender_length: payload.encrypted_key_sender?.length,
            encrypted_key_length: payload.encrypted_key?.length,
            iv_length: payload.iv?.length,
            client_id: payload.client_id?.substring(0, 8) + '...',
          });
          try {
            // Expose last outgoing payload for debugging in console (temporary)
            (window as any).__lastWSOutgoingPayload = payload;
          } catch (_) {}
          console.log('==================================================================\\n');
          this.ws.send(JSON.stringify(payload));
          resolve();
        } catch (e) {
          console.error('ChatClient: ws.send threw', e, { payload });
          reject(e);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  private async _sendViaREST(message: MessageIn) {
    const { restBase } = this.opts;

    const url = `${restBase}/api/rooms/${encodeURIComponent(message.room_id)}/messages`;

    const body: any = {
      room_id: message.room_id,
      sender_id: message.sender_id,
      content: message.content,
      client_id: message.client_id,
    };

    // 🔑 Include E2EE fields if present (Double Encryption Model)
    // Send BOTH encrypted keys so backend stores both
    if (message.encrypted_key_recipient) {
      body.encrypted_key_recipient = message.encrypted_key_recipient;
    }
    if (message.encrypted_key_sender) {
      body.encrypted_key_sender = message.encrypted_key_sender;
    }
    // Backward compat: if only encrypted_key (old format), send it
    if (message.encrypted_key && !message.encrypted_key_recipient) {
      body.encrypted_key = message.encrypted_key;
    }
    if (message.iv) {
      body.iv = message.iv;
    }

    console.log('[ChatClient] 📤 Sending via REST:', {
      url,
      has_encrypted_key_recipient: !!body.encrypted_key_recipient,
      has_encrypted_key_sender: !!body.encrypted_key_sender,
      has_encrypted_key: !!body.encrypted_key,
      has_iv: !!body.iv,
      encrypted_key_recipient_length: body.encrypted_key_recipient?.length,
      encrypted_key_sender_length: body.encrypted_key_sender?.length,
      iv_length: body.iv?.length,
    });

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      throw new Error(`REST request failed: ${String(networkErr)}`);
    }
    let json: any = null;
    const text = await res.text();
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      json = { text };
    }
    if (!res.ok) {
      const err = new Error(`REST persist failed: ${res.status} ${res.statusText} - ${text}`);
      // attach details
      (err as any).status = res.status;
      (err as any).body = json;
      throw err;
    }
    this.onAck({
      type: 'ack',
      status: 'ok',
      server_id: json?.id,
      client_id: message.client_id,
      created_at: json.created_at,
    });
    return json;
  }

  private _genClientId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }
  close() {
    try {
      this.manualClose = true;
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
      this.connecting = false;
      this.ws?.close();
    } catch {}
    this.ws = null;
  }
}

export default ChatClient;
