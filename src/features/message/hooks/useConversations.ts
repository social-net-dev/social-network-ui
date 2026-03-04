import type { Conversation } from '../types/message.types';

// Rooms are managed by useRoomManager. This hook is kept for backward compatibility.
export function useConversations() {
  const conversations: Conversation[] = [];
  return { conversations };
}

export default useConversations;
