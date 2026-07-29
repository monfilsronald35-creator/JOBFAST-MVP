/**
 * Chat API — Enterprise client for all real-time messaging endpoints.
 * Supports: E2EE, AI features, voice/video, presence, moderation, search.
 * Backed by the primary axios instance (70 s timeout).
 */
import API from './axios';
import type {
  ChatMessage,
  Conversation,
  ApiResponse,
  PaginatedResponse,
  PresenceStatus,
} from '../types';

// ─── Core Chat API ────────────────────────────────────────────────────────────
export const chatApi = {
  /** End-to-end encrypt a message (delegates to backend key exchange) */
  e2eeEncrypt: async ({
    plainText,
    recipientPublicKey,
  }: {
    plainText: string;
    recipientPublicKey: string;
  }): Promise<string> => {
    const res = await API.post<ApiResponse<{ cipherText: string }>>('/chat/e2ee/encrypt', {
      plainText,
      recipientPublicKey,
    });
    return res.data.data.cipherText;
  },

  /** Decrypt a received E2EE message */
  e2eeDecrypt: async ({
    cipherText,
    senderId,
    conversationId,
  }: {
    cipherText: string;
    senderId: string;
    conversationId: string;
  }): Promise<string> => {
    const res = await API.post<ApiResponse<{ plainText: string }>>('/chat/e2ee/decrypt', {
      cipherText,
      senderId,
      conversationId,
    });
    return res.data.data.plainText;
  },
};

// ─── Conversation API ─────────────────────────────────────────────────────────
export const conversationApi = {
  list: async (params?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResponse<Conversation>> => {
    const res = await API.get<ApiResponse<PaginatedResponse<Conversation>>>('/conversations', {
      params,
    });
    return res.data.data;
  },

  get: async (conversationId: string): Promise<Conversation> => {
    const res = await API.get<ApiResponse<Conversation>>(`/conversations/${conversationId}`);
    return res.data.data;
  },

  create: async (participantIds: readonly string[]): Promise<Conversation> => {
    const res = await API.post<ApiResponse<Conversation>>('/conversations', { participantIds });
    return res.data.data;
  },

  archive: async (conversationId: string): Promise<void> => {
    await API.patch(`/conversations/${conversationId}/archive`);
  },

  muteNotifications: async (conversationId: string, until?: Date): Promise<void> => {
    await API.patch(`/conversations/${conversationId}/mute`, { until: until?.toISOString() });
  },

  pin: async (conversationId: string): Promise<void> => {
    await API.patch(`/conversations/${conversationId}/pin`);
  },
};

// ─── Message API ──────────────────────────────────────────────────────────────
export const messageApi = {
  list: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<{ messages: readonly ChatMessage[]; cursor?: string; hasMore: boolean }> => {
    const res = await API.get<
      ApiResponse<{ messages: readonly ChatMessage[]; cursor?: string; hasMore: boolean }>
    >(`/conversations/${conversationId}/messages`, { params });
    return res.data.data;
  },

  send: async (payload: {
    conversationId: string;
    content: string;
    type: ChatMessage['type'];
    clientId: string;
    replyTo?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ChatMessage> => {
    const res = await API.post<ApiResponse<ChatMessage>>(
      `/conversations/${payload.conversationId}/messages`,
      payload,
    );
    return res.data.data;
  },

  edit: async (messageId: string, content: string): Promise<ChatMessage> => {
    const res = await API.patch<ApiResponse<ChatMessage>>(`/messages/${messageId}`, { content });
    return res.data.data;
  },

  delete: async (messageId: string, forEveryone = false): Promise<void> => {
    await API.delete(`/messages/${messageId}`, { params: { forEveryone } });
  },

  react: async (messageId: string, emoji: string): Promise<void> => {
    await API.post(`/messages/${messageId}/reactions`, { emoji });
  },

  removeReaction: async (messageId: string, emoji: string): Promise<void> => {
    await API.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  },

  markRead: async (messageIds: readonly string[]): Promise<void> => {
    await API.patch('/messages/read', { messageIds });
  },

  forward: async (messageId: string, toConversationIds: readonly string[]): Promise<void> => {
    await API.post(`/messages/${messageId}/forward`, { toConversationIds });
  },

  pin: async (messageId: string): Promise<void> => {
    await API.patch(`/messages/${messageId}/pin`);
  },

  report: async (messageId: string, reason: string): Promise<void> => {
    await API.post(`/messages/${messageId}/report`, { reason });
  },
};

// ─── Attachment API ───────────────────────────────────────────────────────────
export const attachmentApi = {
  upload: async (
    file: File,
    conversationId: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ url: string; type: string; size: number; name: string }> => {
    const form = new FormData();
    form.append('file', file);
    form.append('conversationId', conversationId);

    const res = await API.post<ApiResponse<{ url: string; type: string; size: number; name: string }>>(
      '/chat/attachments',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total && onProgress) {
            onProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      },
    );
    return res.data.data;
  },

  getSignedUrl: async (attachmentId: string): Promise<string> => {
    const res = await API.get<ApiResponse<{ url: string }>>(`/chat/attachments/${attachmentId}/url`);
    return res.data.data.url;
  },
};

// ─── Presence API ─────────────────────────────────────────────────────────────
export const presenceApi = {
  setStatus: async (status: PresenceStatus): Promise<void> => {
    await API.patch('/presence/status', { status });
  },

  getStatuses: async (userIds: readonly string[]): Promise<Record<string, PresenceStatus>> => {
    const res = await API.post<ApiResponse<Record<string, PresenceStatus>>>('/presence/batch', {
      userIds,
    });
    return res.data.data;
  },

  heartbeat: async (): Promise<void> => {
    await API.post('/presence/heartbeat').catch(() => {});
  },
};

// ─── Moderation API ───────────────────────────────────────────────────────────
export const moderationApi = {
  checkContent: async (
    content: string,
    conversationId: string,
  ): Promise<{ safe: boolean; flags: readonly string[] }> => {
    const res = await API.post<ApiResponse<{ safe: boolean; flags: readonly string[] }>>(
      '/chat/moderation/check',
      { content, conversationId },
    );
    return res.data.data;
  },

  reportConversation: async (conversationId: string, reason: string): Promise<void> => {
    await API.post(`/conversations/${conversationId}/report`, { reason });
  },

  blockUser: async (userId: string): Promise<void> => {
    await API.post(`/users/${userId}/block`);
  },

  unblockUser: async (userId: string): Promise<void> => {
    await API.delete(`/users/${userId}/block`);
  },
};

// ─── AI Chat API ──────────────────────────────────────────────────────────────
export const aiApi = {
  summarizeConversation: async ({
    conversationId,
    maxLength,
  }: {
    conversationId: string;
    maxLength?: number;
  }): Promise<{ summary: string }> => {
    const res = await API.post<ApiResponse<{ summary: string }>>('/chat/ai/summarize', {
      conversationId,
      maxLength,
    });
    return res.data.data;
  },

  translateConversation: async ({
    conversationId,
    targetLanguage,
  }: {
    conversationId: string;
    targetLanguage: string;
  }): Promise<{ translations: Record<string, string> }> => {
    const res = await API.post<ApiResponse<{ translations: Record<string, string> }>>(
      '/chat/ai/translate',
      { conversationId, targetLanguage },
    );
    return res.data.data;
  },

  rewriteMessage: async ({
    messageId,
    tone,
  }: {
    messageId: string;
    tone: 'formal' | 'casual' | 'professional';
  }): Promise<{ rewritten: string }> => {
    const res = await API.post<ApiResponse<{ rewritten: string }>>('/chat/ai/rewrite', {
      messageId,
      tone,
    });
    return res.data.data;
  },

  transcribeVoice: async ({
    audioUrl,
    language,
  }: {
    audioUrl: string;
    language?: string;
  }): Promise<{ transcript: string; confidence: number }> => {
    const res = await API.post<ApiResponse<{ transcript: string; confidence: number }>>(
      '/chat/ai/transcribe',
      { audioUrl, language },
    );
    return res.data.data;
  },

  scheduleMeeting: async ({
    conversationId,
    proposedTimes,
  }: {
    conversationId: string;
    proposedTimes: readonly string[];
  }): Promise<{ meetingUrl: string; confirmedTime?: string }> => {
    const res = await API.post<ApiResponse<{ meetingUrl: string; confirmedTime?: string }>>(
      '/chat/ai/schedule-meeting',
      { conversationId, proposedTimes },
    );
    return res.data.data;
  },

  extractAddress: async ({ messageId }: { messageId: string }): Promise<{ address?: string }> => {
    const res = await API.post<ApiResponse<{ address?: string }>>('/chat/ai/extract/address', {
      messageId,
    });
    return res.data.data;
  },

  extractPhone: async ({ messageId }: { messageId: string }): Promise<{ phone?: string }> => {
    const res = await API.post<ApiResponse<{ phone?: string }>>('/chat/ai/extract/phone', {
      messageId,
    });
    return res.data.data;
  },

  extractResume: async ({ messageId }: { messageId: string }): Promise<Record<string, unknown>> => {
    const res = await API.post<ApiResponse<Record<string, unknown>>>('/chat/ai/extract/resume', {
      messageId,
    });
    return res.data.data;
  },

  extractInvoice: async ({
    messageId,
  }: {
    messageId: string;
  }): Promise<Record<string, unknown>> => {
    const res = await API.post<ApiResponse<Record<string, unknown>>>('/chat/ai/extract/invoice', {
      messageId,
    });
    return res.data.data;
  },

  suggestReply: async ({
    conversationId,
    context,
  }: {
    conversationId: string;
    context?: string;
  }): Promise<{ suggestions: readonly string[] }> => {
    const res = await API.post<ApiResponse<{ suggestions: readonly string[] }>>(
      '/chat/ai/suggest-reply',
      { conversationId, context },
    );
    return res.data.data;
  },
};

// ─── Voice API ────────────────────────────────────────────────────────────────
export const voiceApi = {
  initiateCall: async (conversationId: string): Promise<{ callId: string; token: string }> => {
    const res = await API.post<ApiResponse<{ callId: string; token: string }>>('/voice/initiate', {
      conversationId,
    });
    return res.data.data;
  },

  endCall: async (callId: string): Promise<void> => {
    await API.post(`/voice/${callId}/end`);
  },

  uploadVoiceMessage: async (
    blob: Blob,
    conversationId: string,
  ): Promise<{ url: string; duration: number }> => {
    const form = new FormData();
    form.append('audio', blob, 'voice.webm');
    form.append('conversationId', conversationId);
    const res = await API.post<ApiResponse<{ url: string; duration: number }>>('/voice/messages', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
};

// ─── Video API ────────────────────────────────────────────────────────────────
export const videoApi = {
  initiateCall: async (conversationId: string): Promise<{ roomUrl: string; token: string }> => {
    const res = await API.post<ApiResponse<{ roomUrl: string; token: string }>>('/video/initiate', {
      conversationId,
    });
    return res.data.data;
  },

  endCall: async (roomUrl: string): Promise<void> => {
    await API.post('/video/end', { roomUrl });
  },
};

// ─── Search API ───────────────────────────────────────────────────────────────
export const searchApi = {
  searchMessages: async (params: {
    query: string;
    conversationId?: string;
    scope?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ results: readonly ChatMessage[]; hasMore: boolean; cursor?: string }> => {
    const res = await API.get<
      ApiResponse<{ results: readonly ChatMessage[]; hasMore: boolean; cursor?: string }>
    >('/chat/search', { params });
    return res.data.data;
  },
};

// ─── Notification (in-chat) API ───────────────────────────────────────────────
export const notificationApi = {
  mutePush: async (conversationId: string, durationMs: number): Promise<void> => {
    await API.post(`/conversations/${conversationId}/notifications/mute`, { durationMs });
  },

  unmutePush: async (conversationId: string): Promise<void> => {
    await API.delete(`/conversations/${conversationId}/notifications/mute`);
  },
};