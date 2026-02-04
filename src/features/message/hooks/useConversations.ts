import { useState, useEffect } from 'react';
import type { Conversation } from '../types/message.types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // TODO: replace with real API call
    setConversations([
      { id: 'c1', title: 'Alice', lastMessage: 'Xin chào' },
      { id: 'c2', title: 'Team Project', lastMessage: 'Meeting 3pm' },
    ]);
  }, []);

  return { conversations };
}

export default useConversations;
