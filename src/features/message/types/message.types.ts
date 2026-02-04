export interface ICreateRoom {
  name: string;
  type: string;
  member_ids: string[];
  creator_id: string;
}

export interface IRoom {
  id: string;
  type: string;
  name: string;
  created_at: string;
}

export interface ILastMessage {
  id: string;
  sender_id: string;
  created_at: string;
  snippet: string;
}

export interface IRoomUser {
  room_id: string;
  role: string | null;
  name: string;
  last_message: ILastMessage | null;
  unread: number;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
}

export interface IMessage {
  id: string;
  room_id: string;
  sender_id: string;
  ciphertext: string;
  created_at: string;
  // backend may return single url or an array under 'attachment_urls'
  attachment_url?: string | null;
  attachment_urls?: string[] | null;
  pinned?: boolean;
  reactions?: IReaction[];
}

export type MessageIn = {
  room_id: string;
  sender_id: string;
  content: string;
  client_id?: string;
};

export type MessageOut = {
  id: string;
  room_id: string;
  sender_id: string;
  message?: string;
  ciphertext?: string | null;
  created_at?: string | null;
  client_id?: string | null;
  _status?: 'sending' | 'sent' | 'failed';
  _error?: string | null;
};

export interface IReaction {
  id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// extend MessageOut shape for REST responses that include attachments/reactions/pinned
export type MessageFull = MessageOut & {
  attachment_url?: string | null;
  attachment_urls?: string[] | null;
  pinned?: boolean;
  reactions?: IReaction[];
};

export type ServerAck = {
  type: 'ack';
  status: 'ok' | 'error';
  server_id?: string;
  client_id?: string;
  reason?: string;
  created_at?: string;
};

// API Request/Response types
export interface IPostMessageRequest {
  room_id: string;
  sender_id: string;
  content: string;
}

export interface IPostMessageResponse {
  id: string;
  room_id: string;
  sender_id: string;
  ciphertext: string;
  created_at: string;
}

export interface IUploadFileRequest {
  room_id: string;
  sender_id?: string | null;
  files: File[];
  client_id?: string | null;
  content?: string | null;
}

export interface IDeleteMessageParams {
  message_id: string;
  user_id?: string | null;
}

export interface IReactionRequest {
  emoji: string;
  user_id: string;
}

export interface IRemoveReactionParams {
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface IPinMessageParams {
  message_id: string;
  pin?: boolean;
}

export interface ISearchRoomParams {
  room_id: string;
  q: string;
  limit?: number;
}

export interface IMarkReadParams {
  room_id: string;
  user_id: string;
}

export interface IAddMemberRequest {
  user_id: string;
}

export interface ISetRoleRequest {
  role: string;
}

export interface IRoomDetails {
  id: string;
  type: string;
  name: string;
  created_at: string;
}

export interface IDeleteRoomParams {
  room_id: string;
  hard?: boolean;
  user_id?: string | null;
}
