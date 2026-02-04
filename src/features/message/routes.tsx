import { MessageListPage } from '@/features/message/pages/MessageListPage';
import { ConversationPage } from '@/features/message/pages/ConversationPage';

export { MessageListPage };
export { ConversationPage };

// Route components for App.tsx imports
export const MessageRoutes = {
  List: MessageListPage,
  Conversation: ConversationPage,
};

export default MessageRoutes;
