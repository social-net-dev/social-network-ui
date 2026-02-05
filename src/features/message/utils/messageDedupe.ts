import type { MessageOut } from '../types/message.types';

/**
 * Deduplicate and merge messages from multiple sources (WebSocket + REST)
 * Priority: WebSocket messages > REST messages
 */
export const deduplicateMessages = (wsMessages: MessageOut[], fetchedMessages: MessageOut[]): MessageOut[] => {
  // Put realtime `messages` first so WS broadcasts take precedence over REST/fetched entries
  const merged: MessageOut[] = [...wsMessages, ...fetchedMessages];

  // Helper: extract basenames from attachments/urls
  const extractBasenames = (m: any) => {
    const list: string[] = [];
    if (m.attachments && Array.isArray(m.attachments)) {
      for (const a of m.attachments) {
        const filename =
          String(a.filename || a.url || '')
            .split('/')
            .pop() || '';
        if (filename) list.push(filename.toLowerCase());
      }
    }
    if (m.attachment_urls && Array.isArray(m.attachment_urls)) {
      for (const u of m.attachment_urls) {
        const filename = String(u).split('/').pop() || '';
        if (filename) list.push(filename.toLowerCase());
      }
    }
    if (m.attachment_url) {
      const filename = String(m.attachment_url).split('/').pop() || '';
      if (filename) list.push(filename.toLowerCase());
    }
    return Array.from(new Set(list)).sort();
  };

  // Signature: sender + attachments basenames + first 40 chars of message text
  const signature = (m: MessageOut) => {
    const files = extractBasenames(m as any).join('|');
    const text = ((m as any).message || (m as any).ciphertext || '').toString().trim().slice(0, 40).replace(/\s+/g, ' ');
    return `${m.sender_id || ''}::${files}::${text}`;
  };

  const map = new Map<string, MessageOut>();
  const seenIds = new Set<string>();

  for (const m of merged) {
    // skip exact duplicate by server id
    if (m.id && seenIds.has(String(m.id))) continue;

    const sig = signature(m);
    const existing = map.get(sig);

    if (!existing) {
      map.set(sig, m);
      if (m.id) seenIds.add(String(m.id));
      continue;
    }

    // If both exist, decide which to keep: prefer one with server id, else prefer newer created_at
    const existingHasId = !!existing.id;
    const currentHasId = !!m.id;

    if (currentHasId && !existingHasId) {
      map.set(sig, m);
      if (m.id) seenIds.add(String(m.id));
      continue;
    }

    if (currentHasId && existingHasId) {
      // keep the one with later created_at
      const ta = m.created_at ? Date.parse(m.created_at) : 0;
      const tb = existing.created_at ? Date.parse(existing.created_at) : 0;
      if (ta > tb) {
        map.set(sig, m);
        seenIds.add(String(m.id));
      }
      continue;
    }

    // Neither have id: pick latest
    const ta = m.created_at ? Date.parse(m.created_at) : 0;
    const tb = existing.created_at ? Date.parse(existing.created_at) : 0;
    if (ta > tb) {
      map.set(sig, m);
    }
  }

  const out = Array.from(map.values());

  // Sort by created_at asc
  out.sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    if (ta === tb) {
      const ia = a.id ?? a.client_id ?? '';
      const ib = b.id ?? b.client_id ?? '';
      return ia < ib ? -1 : ia > ib ? 1 : 0;
    }
    return ta - tb;
  });

  return out;
};

/**
 * Filter optimistic messages from fetchedMessages to prevent duplicates
 */
export const filterOptimisticMessage = (fetchedMessages: MessageOut[], newMessage: MessageOut): MessageOut[] => {
  // If server echoes client_id, remove matching optimistic entry immediately
  if (newMessage.client_id) {
    return fetchedMessages.filter(m => m.client_id !== newMessage.client_id);
  }

  // Heuristic: if server didn't send client_id, try to match by attachments metadata
  const now = Date.now();
  let removed = false;

  const extractNames = (arr: any[]) =>
    (arr || [])
      .map((x: any) => {
        const filename = (x && (x.filename || x.url)) || '';
        return String(filename).split('/').pop()?.toLowerCase() || '';
      })
      .filter(Boolean);

  return fetchedMessages.filter(m => {
    if (removed) return true; // already removed one optimistic

    // only consider optimistic pending messages
    if ((m as any)._status !== 'sending') return true;
    if (m.sender_id !== newMessage.sender_id) return true;

    // time window: 2 minutes
    const createdTs = m.created_at ? Date.parse(m.created_at) : now;
    if (Math.abs(now - createdTs) > 120_000) return true;

    const a = (m as any).attachments ?? (m as any).attachment_urls ?? [];
    const b = (newMessage as any).attachments ?? (newMessage as any).attachment_urls ?? [];
    if (!Array.isArray(a) || !Array.isArray(b)) return true;
    if (a.length !== b.length) return true;

    // check filename overlap using extracted basenames
    const filenamesA = extractNames(a);
    const filenamesB = extractNames(b);
    const common = filenamesA.filter((f: string) => filenamesB.includes(f));

    if (common.length === 0) return true;

    // consider this a match -> remove optimistic
    removed = true;
    return false;
  });
};
