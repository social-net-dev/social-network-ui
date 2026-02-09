import api from '@/lib/api';

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

// Fetch rooms for a given user. Backend expected to return IRoomUser[]
export const fetchRoomsForUser = (userId: string) => {
  return api.get<IRoomUser[]>(`/api/users/${encodeURIComponent(userId)}/rooms`);
};

export const callCreateRoom = (payload: ICreateRoom) => {
  return api.post<IRoom>(`/api/rooms/`, payload);
};

export const callFetchMessagesRoom = (roomId: string) => {
  return api.get<IMessage[]>(`/api/rooms/${encodeURIComponent(roomId)}/messages`);
};

// POST /api/rooms/{room_id}/messages
export const callPostMessage = (roomId: string, payload: IPostMessageRequest) => {
  return api.post<IPostMessageResponse>(`/api/rooms/${encodeURIComponent(roomId)}/messages`, payload);
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

  return api.post<string>(`/api/rooms/${encodeURIComponent(roomId)}/upload?${queryParams.toString()}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// DELETE /api/messages/{message_id}
export const callDeleteMessage = (params: IDeleteMessageParams) => {
  const queryParams = new URLSearchParams();
  if (params.user_id) queryParams.set('user_id', params.user_id);

  return api.delete<string>(`/api/messages/${encodeURIComponent(params.message_id)}`);
};

// POST /api/messages/{message_id}/reactions
export const callAddReaction = (messageId: string, payload: IReactionRequest) => {
  return api.post<string>(`/api/messages/${encodeURIComponent(messageId)}/reactions`, payload);
};

// DELETE /api/messages/{message_id}/reactions
export const callRemoveReaction = (params: IRemoveReactionParams) => {
  const queryParams = new URLSearchParams({
    user_id: params.user_id,
    emoji: params.emoji,
  });

  return api.delete<string>(`/api/messages/${encodeURIComponent(params.message_id)}/reactions?${queryParams.toString()}`);
};

// POST /api/messages/{message_id}/pin
export const callPinMessage = (params: IPinMessageParams) => {
  const queryParams = new URLSearchParams();
  if (params.pin !== undefined) queryParams.set('pin', String(params.pin));
  return api.post<string>(`/api/messages/${encodeURIComponent(params.message_id)}/pin?${queryParams.toString()}`);
};

// POST /api/messages/{message_id}/unpin
export const callUnpinMessage = (messageId: string) => {
  return api.post<string>(`/api/messages/${encodeURIComponent(messageId)}/unpin`);
};

// GET /api/rooms/{room_id}/pinned
export const callGetPinnedMessages = (roomId: string) => {
  return api.get<string>(`/api/rooms/${encodeURIComponent(roomId)}/pinned`);
};

// GET /api/messages/{message_id}/readers
export const callGetMessageReaders = (messageId: string) => {
  return api.get<string>(`/api/messages/${encodeURIComponent(messageId)}/readers`);
};

// GET /api/rooms/{room_id}/search
export const callSearchRoom = (params: ISearchRoomParams) => {
  const queryParams = new URLSearchParams({ q: params.q });
  if (params.limit) queryParams.set('limit', String(params.limit));

  return api.get<string>(`/api/rooms/${encodeURIComponent(params.room_id)}/search?${queryParams.toString()}`);
};

// POST /api/rooms/{room_id}/read
export const callMarkRoomRead = (params: IMarkReadParams) => {
  const queryParams = new URLSearchParams({ user_id: params.user_id });

  return api.post<string>(`/api/rooms/${encodeURIComponent(params.room_id)}/read?${queryParams.toString()}`);
};

// POST /api/rooms/{room_id}/members
export const callAddMember = (roomId: string, payload: IAddMemberRequest) => {
  return api.post<string>(`/api/rooms/${encodeURIComponent(roomId)}/members`, payload);
};

// DELETE /api/rooms/{room_id}/members/{user_id}
export const callRemoveMember = (roomId: string, userId: string) => {
  return api.delete<string>(`/api/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}`);
};

// POST /api/rooms/{room_id}/members/{user_id}/role
export const callSetMemberRole = (roomId: string, userId: string, payload: ISetRoleRequest) => {
  return api.post<string>(`/api/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}/role`, payload);
};

// GET /api/rooms/{room_id}
export const callGetRoom = (roomId: string) => {
  return api.get<IRoomDetails>(`/api/rooms/${encodeURIComponent(roomId)}`);
};

// DELETE /api/rooms/{room_id}
export const callDeleteRoom = (params: IDeleteRoomParams) => {
  const queryParams = new URLSearchParams();
  if (params.hard !== undefined) queryParams.set('hard', String(params.hard));
  if (params.user_id) queryParams.set('user_id', params.user_id);

  return api.delete<string>(`/api/rooms/${encodeURIComponent(params.room_id)}?${queryParams.toString()}`);
};
