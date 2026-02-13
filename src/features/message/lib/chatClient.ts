import type { MessageIn, MessageOut, ServerAck } from '../types/message.types';

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

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
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
          console.debug('ChatClient: message received', data);
          if (data.type === 'ack') {
            // ACK cho reaction cũng đi qua onReaction nếu có action
            if (data.action === 'reaction_added' || data.action === 'reaction_removed') {
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
              encrypted_key: data.encrypted_key ?? undefined,
              iv: data.iv ?? undefined,
              // backend now returns attachments array with metadata
              attachments: data.attachments ?? null,
              // legacy fallback
              attachment_url: data.attachment_url ?? null,
              attachment_urls: data.attachment_urls ?? null,
              pinned: data.pinned ?? false,
              reactions: data.reactions ?? [],
            } as MessageOut;
            this.onMessage(out);
          } else if (data.type === 'reaction' || data.type === 'reaction_removed') {
            // broadcast reaction event to hook
            if (this.onReaction) {
              this.onReaction(data);
            } else {
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return;
      } catch (e) {
        console.error('[ChatClient] sendReaction failed:', e);
        throw e;
      }
    } else {
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
        // 🔑 Include E2EE fields if present
        if (message.encrypted_key) {
          payload.encrypted_key = message.encrypted_key;
        }
        if (message.iv) {
          payload.iv = message.iv;
        }
        try {
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

    // 🔑 Include E2EE fields if present
    if (message.encrypted_key) {
      body.encrypted_key = message.encrypted_key;
    }
    if (message.iv) {
      body.iv = message.iv;
    }

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
