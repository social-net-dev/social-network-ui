import messageApiClient from '@/lib/messageApiClient';

import type {
  IRoom,
  IRoomUser,
  ICreateRoom,
  IMessage,
  IPostMessageRequest,
  IPostMessageResponse,
  IUploadFileRequest,
  IDeleteMessageParams,
  IReactionRequest,
  IRemoveReactionParams,
  IPinMessageParams,
  ISearchRoomParams,
  IMarkReadParams,
  IAddMemberRequest,
  ISetRoleRequest,
  IRoomDetails,
  IDeleteRoomParams,
  IDisplayNameRequest,
  IDisplayNameResponse,
  IPublicKeyRequest,
  IPublicKeyResponse,
} from '../types/message.types';

// Placeholder API service for messages. Replace axios calls with real endpoints.
export async function fetchConversations() {
  return [
    { id: 'c1', title: 'Alice', lastMessage: 'Xin chào' },
    { id: 'c2', title: 'Team Project', lastMessage: 'Meeting 3pm' },
  ];
}

export async function fetchConversationMessages() {
  return [
    { id: 'm1', author: 'Alice', text: 'Hello' },
    { id: 'm2', author: 'You', text: 'Hi' },
  ];
}

// NOTE: All functions below now use messageApiClient (port 8001) instead of main api (port 8000)

// Fetch rooms for a given user. Backend expected to return IRoomUser[]
export const fetchRoomsForUser = (userId: string) => {
  return messageApiClient.get<IRoomUser[]>(`/api/users/${encodeURIComponent(userId)}/rooms`);
};

export const callCreateRoom = (payload: ICreateRoom) => {
  return messageApiClient.post<IRoom>(`/api/rooms/`, payload);
};

export const callFetchMessagesRoom = (roomId: string) => {
  return messageApiClient.get<IMessage[]>(`/api/rooms/${encodeURIComponent(roomId)}/messages`);
};

// POST /api/rooms/{room_id}/messages
export const callPostMessage = (roomId: string, payload: IPostMessageRequest) => {
  return messageApiClient.post<IPostMessageResponse>(`/api/rooms/${encodeURIComponent(roomId)}/messages`, payload);
};

// POST /api/rooms/{room_id}/upload
export const callUploadFile = (roomId: string, params: IUploadFileRequest) => {
  const formData = new FormData();
  // Append each file with 'files' key (backend expects files array)
  params.files.forEach(file => {
    formData.append('files', file);
  });
  // Include optional text content when sending files
  if ((params as any).content) {
    formData.append('content', (params as any).content);
  }
  const queryParams = new URLSearchParams();
  if (params.sender_id) queryParams.set('sender_id', params.sender_id);
  if ((params as any).client_id) queryParams.set('client_id', (params as any).client_id);

  return messageApiClient.post<string>(`/api/rooms/${encodeURIComponent(roomId)}/upload?${queryParams.toString()}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// DELETE /api/messages/{message_id}
export const callDeleteMessage = (params: IDeleteMessageParams) => {
  const queryParams = new URLSearchParams();
  if (params.user_id) queryParams.set('user_id', params.user_id);

  return messageApiClient.delete<string>(`/api/messages/${encodeURIComponent(params.message_id)}`);
};

// POST /api/messages/{message_id}/reactions
export const callAddReaction = (messageId: string, payload: IReactionRequest) => {
  return messageApiClient.post<string>(`/api/messages/${encodeURIComponent(messageId)}/reactions`, payload);
};

// DELETE /api/messages/{message_id}/reactions
export const callRemoveReaction = (params: IRemoveReactionParams) => {
  const queryParams = new URLSearchParams({
    user_id: params.user_id,
    emoji: params.emoji,
  });

  return messageApiClient.delete<string>(`/api/messages/${encodeURIComponent(params.message_id)}/reactions?${queryParams.toString()}`);
};

// POST /api/messages/{message_id}/pin
export const callPinMessage = (params: IPinMessageParams) => {
  const queryParams = new URLSearchParams();
  if (params.pin !== undefined) queryParams.set('pin', String(params.pin));
  return messageApiClient.post<string>(`/api/messages/${encodeURIComponent(params.message_id)}/pin?${queryParams.toString()}`);
};

// POST /api/messages/{message_id}/unpin
export const callUnpinMessage = (messageId: string) => {
  return messageApiClient.post<string>(`/api/messages/${encodeURIComponent(messageId)}/unpin`);
};

// GET /api/rooms/{room_id}/pinned
export const callGetPinnedMessages = (roomId: string) => {
  return messageApiClient.get<string>(`/api/rooms/${encodeURIComponent(roomId)}/pinned`);
};

// GET /api/messages/{message_id}/readers
export const callGetMessageReaders = (messageId: string) => {
  return messageApiClient.get<string>(`/api/messages/${encodeURIComponent(messageId)}/readers`);
};

// GET /api/rooms/{room_id}/search
export const callSearchRoom = (params: ISearchRoomParams) => {
  const queryParams = new URLSearchParams({ q: params.q });
  if (params.limit) queryParams.set('limit', String(params.limit));

  return messageApiClient.get<string>(`/api/rooms/${encodeURIComponent(params.room_id)}/search?${queryParams.toString()}`);
};

// POST /api/rooms/{room_id}/read
export const callMarkRoomRead = (params: IMarkReadParams) => {
  const queryParams = new URLSearchParams({ user_id: params.user_id });

  return messageApiClient.post<string>(`/api/rooms/${encodeURIComponent(params.room_id)}/read?${queryParams.toString()}`);
};

// POST /api/rooms/{room_id}/members
export const callAddMember = (roomId: string, payload: IAddMemberRequest) => {
  return messageApiClient.post<string>(`/api/rooms/${encodeURIComponent(roomId)}/members`, payload);
};

// DELETE /api/rooms/{room_id}/members/{user_id}
export const callRemoveMember = (roomId: string, userId: string) => {
  return messageApiClient.delete<string>(`/api/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}`);
};

// POST /api/rooms/{room_id}/members/{user_id}/role
export const callSetMemberRole = (roomId: string, userId: string, payload: ISetRoleRequest) => {
  return messageApiClient.post<string>(`/api/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}/role`, payload);
};

// GET /api/rooms/{room_id}
export const callGetRoom = (roomId: string) => {
  return messageApiClient.get<IRoomDetails>(`/api/rooms/${encodeURIComponent(roomId)}`);
};

// DELETE /api/rooms/{room_id}
export const callDeleteRoom = (params: IDeleteRoomParams) => {
  const queryParams = new URLSearchParams();
  if (params.hard !== undefined) queryParams.set('hard', String(params.hard));
  if (params.user_id) queryParams.set('user_id', params.user_id);

  return messageApiClient.delete<string>(`/api/rooms/${encodeURIComponent(params.room_id)}?${queryParams.toString()}`);
};

// POST /api/rooms/{room_id}/members/{user_id}/display_name
export const callSetMemberDisplayName = (roomId: string, userId: string, payload: IDisplayNameRequest) => {
  return messageApiClient.post<IDisplayNameResponse>(`/api/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}/display_name`, payload);
};

// GET /api/users/{user_id}/public_key
export const callGetUserPublicKey = (userId: string) => {
  return messageApiClient.get<IPublicKeyResponse>(`/api/users/${encodeURIComponent(userId)}/public_key`);
};

// POST /api/users/public_key (set current user's public key)
export const callSetPublicKey = (payload: IPublicKeyRequest) => {
  return messageApiClient.post<IPublicKeyResponse>('/api/users/public_key', payload);
};

// PUT /api/users/public_key (update/overwrite current user's public key)
export const callUpdatePublicKey = (payload: IPublicKeyRequest) => {
  return messageApiClient.put<IPublicKeyResponse>('/api/users/public_key', payload);
};

// GET /api/rooms/{room_id}/members/public_keys (get all member public keys in a room)
export const callGetRoomMemberPublicKeys = (roomId: string) => {
  return messageApiClient.get<{ members: Array<{ user_id: string; public_key: string }> }>(`/api/rooms/${encodeURIComponent(roomId)}/members/public_keys`);
};
