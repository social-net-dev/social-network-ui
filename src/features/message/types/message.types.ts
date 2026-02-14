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
  // E2EE fields - REQUIRED for decryption
  encrypted_key?: string; // For recipient (backward compat: may also be named encrypted_key_recipient)
  encrypted_key_recipient?: string; // Double encryption: key for recipient
  encrypted_key_sender?: string; // Double encryption: key for sender (to decrypt own messages after reload)
  iv?: string;
}

export type MessageIn = {
  room_id: string;
  sender_id: string;
  content: string;
  client_id?: string;
  // E2EE fields - Double encryption model
  encrypted_key?: string; // Backward compat or alias for encrypted_key_recipient
  encrypted_key_recipient?: string; // Key encrypted with recipient's public key
  encrypted_key_sender?: string; // Key encrypted with sender's public key (for sender to decrypt own messages)
  iv?: string;
};

export type MessageOut = {
  id: string;
  room_id: string;
  sender_id: string;
  message?: string;
  ciphertext?: string | null;
  created_at?: string | null;
  client_id?: string | null;
  _status?: 'sending' | 'sent' | 'failed' | 'delivered' | 'read';
  _error?: string | null;
  // Double encryption model
  // Backward compat or alias for encrypted_key_recipient
  encrypted_key_recipient?: string; // Key encrypted with recipient's public key
  encrypted_key_sender?: string; // Key encrypted with sender's public key (for sender to decrypt own messages)
  // E2EE fields
  encrypted_key?: string;
  iv?: string;
  // 🔑 Store original plaintext for displaying own encrypted messages
  _plaintext?: string;
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
  // E2EE fields
  encrypted_key?: string;
  iv?: string;
}

export interface IPostMessageResponse {
  id: string;
  room_id: string;
  sender_id: string;
  ciphertext: string;
  created_at: string;
  // E2EE fields
  encrypted_key?: string;
  iv?: string;
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
  hard?: boolean;
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

// E2EE types
export interface IEncryptedMessage {
  ciphertext: string;
  encryptedKey: string;
  iv: string;
}

// Display name types
export interface IDisplayNameRequest {
  display_name: string;
}

export interface IDisplayNameResponse {
  room_id: string;
  user_id: string;
  display_name: string;
}

// Public key management types
export interface IPublicKeyRequest {
  user_id: string;
  public_key: string;
}

export interface IPublicKeyResponse {
  user_id: string;
  public_key: string;
  updated_at?: string;
}
