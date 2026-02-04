import type { MessageOut } from '../types/message.types';

/**
 * Deduplicate and merge messages from multiple sources (WebSocket + REST)
 * Priority: WebSocket messages > REST messages
 */
export const deduplicateMessages = (wsMessages: MessageOut[], fetchedMessages: MessageOut[]): MessageOut[] => {
  // Put realtime `messages` first so WS broadcasts take precedence over REST/fetched entries
  const merged: MessageOut[] = [...wsMessages, ...fetchedMessages];
  const out: MessageOut[] = [];

  for (const m of merged) {
    // skip if exact server id already included
    if (m.id && out.find(x => x.id === m.id)) continue;

    // skip if client_id already included
    if (m.client_id && out.find(x => x.client_id === m.client_id)) continue;

    // heuristic: if there's an existing message from same sender with matching attachments filenames
    // and timestamps are very close, treat as duplicate and prefer server message (with id)
    const aFiles = (m as any).attachments ? (m as any).attachments.map((x: any) => (x.filename || '').toLowerCase()) : [];
    let isDuplicate = false;

    for (const ex of out) {
      // match by id
      if (m.id && ex.id === m.id) {
        isDuplicate = true;
        break;
      }

      // match by client_id
      if (m.client_id && ex.client_id === m.client_id) {
        isDuplicate = true;
        break;
      }

      // if neither have ids, compare sender + attachment filenames and created_at proximity
      const exFiles = (ex as any).attachments ? (ex as any).attachments.map((x: any) => (x.filename || '').toLowerCase()) : [];

      if (m.sender_id === ex.sender_id && aFiles.length > 0 && exFiles.length > 0) {
        const common = aFiles.filter((f: string) => exFiles.includes(f));
        if (common.length > 0) {
          const ta = m.created_at ? Date.parse(m.created_at) : Date.now();
          const tb = ex.created_at ? Date.parse(ex.created_at) : Date.now();

          if (Math.abs(ta - tb) < 5000) {
            // prefer server message (one that has id) over optimistic
            if (m.id && !ex.id) {
              // replace ex with m
              const idx = out.indexOf(ex);
              if (idx !== -1) out.splice(idx, 1, m);
              isDuplicate = true;
              break;
            }
            isDuplicate = true;
            break;
          }
        }
      }
    }

    if (!isDuplicate) out.push(m);
  }

  // Sort by created_at
  out.sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : Infinity;
    const tb = b.created_at ? Date.parse(b.created_at) : Infinity;
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

  return fetchedMessages.filter(m => {
    if (removed) return true; // already removed one optimistic

    // only consider optimistic pending messages
    if ((m as any)._status !== 'sending') return true;
    if (m.sender_id !== newMessage.sender_id) return true;

    // time window: 60s
    const createdTs = m.created_at ? Date.parse(m.created_at) : now;
    if (Math.abs(now - createdTs) > 60_000) return true;

    const a = (m as any).attachments ?? [];
    const b = (newMessage as any).attachments ?? [];
    if (!Array.isArray(a) || !Array.isArray(b)) return true;
    if (a.length !== b.length) return true;

    // check filename overlap
    const filenamesA = a.map((x: any) => (x.filename || '').toLowerCase());
    const filenamesB = b.map((x: any) => (x.filename || '').toLowerCase());
    const common = filenamesA.filter((f: string) => filenamesB.includes(f));

    if (common.length === 0) return true;

    // consider this a match -> remove optimistic
    removed = true;
    return false;
  });
};
