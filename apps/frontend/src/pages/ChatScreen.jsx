/**
 * ChatScreen.jsx — Enterprise Edition v2.0
 *
 * Reuses:
 *   API       — ../api/axios (JWT interceptor, 65s timeout, retry 503/504)
 *   socket    — useAuth() socket.io instance (already connected on login)
 *   i18n      — react-i18next, ht/en/fr/es, keys under "chat.*"
 *   lucide-react — existing icon set
 *
 * Feature flags: flip one constant when the backend route/event is ready.
 * No migration required — runtime behavior unchanged until a flag is true.
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo, memo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Mic, MicOff, Send, Phone, Video, ArrowLeft,
  Check, CheckCheck, Clock, AlertCircle, WifiOff, RefreshCcw, X, Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const MAX_TEXT_LENGTH      = 2000;
const MAX_VOICE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Message lifecycle states. */
const MSG_STATUS = Object.freeze({
  SENDING:   "sending",
  SENT:      "sent",
  DELIVERED: "delivered",
  READ:      "read",
  FAILED:    "failed",
});

/** Message content types. Extensible for image/document/video/system. */
const MSG_TYPE = Object.freeze({
  TEXT:  "text",
  AUDIO: "audio",
});

/**
 * Feature flags — each gate an integration point.
 * Flip to true when the corresponding backend capability ships.
 * Flipping a flag never changes the visible UI contract, only which path runs.
 */
const FEATURE_FLAGS = Object.freeze({
  SOCKET_MESSAGING: false, // socket message:receive / conversation:join
  SEND_VIA_API:     true,  // POST /api/v1/messages
  TYPING_INDICATOR: false, // typing:start / typing:stop socket events
  READ_RECEIPTS:    true,  // PATCH /messages/:conversationId/read
  ONLINE_PRESENCE:  false, // presence:update socket event
  ATTACHMENTS:      false, // upload service for audio/image/document blobs
  REACTIONS:        false, // reaction API
  PAGINATION:       true,  // cursor-based GET /messages/:conversationId
});

/** Socket event names — single source of truth to prevent string drift. */
const SOCKET_EVENTS = Object.freeze({
  CONVERSATION_JOIN:  "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  MESSAGE_RECEIVE:    "message:receive",
  MESSAGE_DELIVERED:  "message:delivered",
  MESSAGE_READ_ACK:   "message:read_ack",
  TYPING_START:       "typing:start",
  TYPING_STOP:        "typing:stop",
  PRESENCE_UPDATE:    "presence:update",
});

// ═══════════════════════════════════════════════════════════════════════════
// DEMO DATA — isolated, replaced by ChatService.getConversations when ready
// ═══════════════════════════════════════════════════════════════════════════

const DEMO_CHATS = Object.freeze([
  {
    id: "demo1",
    name: "Jean Baptiste",
    role: "Albani",
    city: "Port-au-Prince",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean",
    lastMessage: "Oui, mwen disponib demen maten",
    time: "18:45",
    unread: 2,
    online: true,
  },
  {
    id: "demo2",
    name: "Marie Claire",
    role: "Plonbye",
    city: "Pétionville",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
    lastMessage: "Konbyen sa koute?",
    time: "17:30",
    unread: 0,
    online: false,
  },
  {
    id: "demo3",
    name: "Pierre Louis",
    role: "Elektrisite",
    city: "Delmas",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre",
    lastMessage: "OK mèsi, map rele ou",
    time: "16:00",
    unread: 1,
    online: true,
  },
]);

// ═══════════════════════════════════════════════════════════════════════════
// PURE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function generateClientId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Strips HTML tags and limits length — prevents XSS when rendering text. */
function sanitizeText(str) {
  return String(str ?? "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Returns a symmetric, deterministic ID for any two participant IDs. */
function buildConversationId(idA, idB) {
  return [String(idA ?? ""), String(idB ?? "")].sort().join("_");
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAT SERVICE — isolated integration points
// Replace the internals (not the signatures) when backend routes ship.
// ═══════════════════════════════════════════════════════════════════════════

const ChatService = {
  /**
   * Fetch user's conversation list.
   * Production: GET /api/v1/messages/conversations
   */
  async getConversations(_userId, { signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API) {
      const res = await API.get("/messages/conversations", { signal });
      return res.data;
    }
    return { conversations: [...DEMO_CHATS] };
  },

  /**
   * Fetch messages for one conversation — cursor-based pagination ready.
   * Production: GET /api/v1/messages/:conversationId?cursor=&limit=30
   */
  async getMessages(_conversationId, { _cursor, _limit = 30, signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API) {
      const res = await API.get(`/messages/${_conversationId}`, {
        params: { cursor: _cursor, limit: _limit },
        signal,
      });
      return res.data;
    }
    return { messages: [], nextCursor: null };
  },

  /**
   * Persist a message.
   * Payload mirrors MessageSchema: senderId, receiverId, conversationId, message, type, clientId.
   * clientId enables idempotency — backend deduplicates on this key.
   * Production: POST /api/v1/messages
   */
  async sendMessage(payload, { signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API) {
      const res = await API.post("/messages", payload, { signal });
      return res.data;
    }
    return { message: { ...payload, _id: payload.clientId, createdAt: new Date().toISOString() } };
  },

  /**
   * Mark conversation as read.
   * Production: PATCH /api/v1/messages/:conversationId/read
   */
  async markConversationRead(_conversationId, { signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API && FEATURE_FLAGS.READ_RECEIPTS) {
      await API.patch(`/messages/${_conversationId}/read`, {}, { signal });
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useConversations
// Loads the conversation list. Retries on error. Falls back to demo data.
// ═══════════════════════════════════════════════════════════════════════════

function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [retryCount,    setRetryCount]    = useState(0);
  const mountedRef = useRef(true);
  const abortRef   = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const data = await ChatService.getConversations(userId, { signal: abortRef.current.signal });
      if (!mountedRef.current) return;
      setConversations(data.conversations ?? []);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setError(err);
      setConversations([...DEMO_CHATS]); // MVP fallback
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load, retryCount]);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  return { conversations, loading, error, retry };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useMessages
// Manages message list for the active conversation.
// Optimistic sends with rollback. ObjectURL lifecycle management.
// ═══════════════════════════════════════════════════════════════════════════

function useMessages(chat, currentUser, socket) {
  const buildInitialMessages = useCallback((c) => {
    if (!c) return [];
    return [
      {
        clientId: "init-1", _id: "init-1",
        from: c.id, type: MSG_TYPE.TEXT,
        text: `Bonjou! Mwen wè ou ap chèche yon ${c.role}?`,
        audioUrl: null, audioDuration: null,
        time: "16:00", createdAt: new Date(),
        status: MSG_STATUS.READ,
      },
      {
        clientId: "init-2", _id: "init-2",
        from: "me", type: MSG_TYPE.TEXT,
        text: "Wi, mwen bezwen yon travay.",
        audioUrl: null, audioDuration: null,
        time: "16:01", createdAt: new Date(),
        status: MSG_STATUS.READ,
      },
      {
        clientId: "init-3", _id: "init-3",
        from: c.id, type: MSG_TYPE.TEXT,
        text: c.lastMessage,
        audioUrl: null, audioDuration: null,
        time: c.time, createdAt: new Date(),
        status: MSG_STATUS.READ,
      },
    ];
  }, []);

  const [messages, setMessages] = useState(() => buildInitialMessages(chat));
  const messagesRef = useRef(messages);
  const abortRef    = useRef(null);
  const mountedRef  = useRef(true);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Revoke audio ObjectURLs on conversation change to prevent memory leaks
  useEffect(() => {
    const prev = messagesRef.current;
    setMessages(buildInitialMessages(chat));
    return () => {
      prev.forEach(m => {
        if (m.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(m.audioUrl);
      });
    };
  }, [chat?.id, buildInitialMessages]);

  // Unmount: revoke all remaining ObjectURLs + abort in-flight requests
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      messagesRef.current.forEach(m => {
        if (m.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(m.audioUrl);
      });
    };
  }, []);

  // ── Socket: real-time incoming messages (gated) ───────────────────────
  useEffect(() => {
    if (!FEATURE_FLAGS.SOCKET_MESSAGING || !socket || !chat) return;
    const expectedConvId = buildConversationId(currentUser?._id, chat.id);

    const onIncoming = (raw) => {
      if (!raw || typeof raw !== "object") return; // never trust incoming data
      if (raw.conversationId !== expectedConvId) return;
      if (!mountedRef.current) return;
      setMessages(prev => {
        const isDuplicate = prev.some(m => m.clientId === raw.clientId || (raw._id && m._id === raw._id));
        if (isDuplicate) return prev;
        return [...prev, {
          clientId:    raw.clientId ?? raw._id ?? generateClientId(),
          _id:         raw._id ?? null,
          from:        raw.senderId,
          type:        raw.type === MSG_TYPE.AUDIO ? MSG_TYPE.AUDIO : MSG_TYPE.TEXT,
          text:        sanitizeText(raw.message ?? ""),
          audioUrl:    typeof raw.audioUrl === "string" ? raw.audioUrl : null,
          audioDuration: typeof raw.audioDuration === "number" ? raw.audioDuration : null,
          time:        formatTime(raw.createdAt ? new Date(raw.createdAt) : new Date()),
          createdAt:   raw.createdAt ? new Date(raw.createdAt) : new Date(),
          status:      MSG_STATUS.READ,
        }];
      });
    };

    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, onIncoming);
    return () => { socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, onIncoming); };
  }, [socket, chat?.id, currentUser?._id]);

  // ── Send text (optimistic + rollback on failure) ──────────────────────
  const sendTextMessage = useCallback(async (text) => {
    if (!chat || !currentUser) return;
    const sanitized = sanitizeText(text);
    if (!sanitized) return;

    const clientId = generateClientId();
    const now      = new Date();
    const optimistic = {
      clientId, _id: null,
      from: "me", type: MSG_TYPE.TEXT,
      text: sanitized, audioUrl: null, audioDuration: null,
      time: formatTime(now), createdAt: now,
      status: MSG_STATUS.SENDING,
    };
    setMessages(prev => [...prev, optimistic]);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const payload = {
        clientId,
        conversationId: buildConversationId(currentUser._id ?? currentUser.id, chat.id),
        senderId:   currentUser._id ?? currentUser.id,
        receiverId: chat.id,
        type:       "chat",
        message:    sanitized,
      };
      await ChatService.sendMessage(payload, { signal: abortRef.current.signal });
      if (!mountedRef.current) return;
      setMessages(prev => prev.map(m =>
        m.clientId === clientId ? { ...m, status: MSG_STATUS.SENT } : m
      ));

      // MVP auto-reply — removed automatically when SEND_VIA_API + socket are enabled
      if (!FEATURE_FLAGS.SEND_VIA_API) {
        setTimeout(() => {
          if (!mountedRef.current) return;
          setMessages(prev => [...prev, {
            clientId: generateClientId(), _id: null,
            from: chat.id, type: MSG_TYPE.TEXT,
            text: "OK, mwen resevwa mesaj ou a. Map rele ou talè.",
            audioUrl: null, audioDuration: null,
            time: formatTime(new Date()), createdAt: new Date(),
            status: MSG_STATUS.READ,
          }]);
        }, 1500);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      // Rollback: mark failed so user can retry
      setMessages(prev => prev.map(m =>
        m.clientId === clientId ? { ...m, status: MSG_STATUS.FAILED } : m
      ));
    }
  }, [chat, currentUser]);

  // ── Send audio (immediate ObjectURL, upload deferred behind ATTACHMENTS flag) ─
  const sendAudioMessage = useCallback((blob, duration) => {
    if (!chat || !currentUser) return;
    if (blob.size > MAX_VOICE_SIZE_BYTES) return;

    const audioUrl = URL.createObjectURL(blob);
    setMessages(prev => [...prev, {
      clientId: generateClientId(), _id: null,
      from: "me", type: MSG_TYPE.AUDIO,
      text: null, audioUrl, audioDuration: duration,
      time: formatTime(new Date()), createdAt: new Date(),
      status: MSG_STATUS.SENT, // MVP: local playback, no upload yet
    }]);
    // TODO: when FEATURE_FLAGS.ATTACHMENTS — upload blob, replace audioUrl with remote URL
  }, [chat, currentUser]);

  // ── Retry a failed text message ───────────────────────────────────────
  const retryMessage = useCallback((clientId) => {
    const msg = messagesRef.current.find(m => m.clientId === clientId);
    if (!msg || msg.type !== MSG_TYPE.TEXT || !msg.text) return;
    setMessages(prev => prev.filter(m => m.clientId !== clientId));
    sendTextMessage(msg.text);
  }, [sendTextMessage]);

  return { messages, sendTextMessage, sendAudioMessage, retryMessage };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useVoiceRecorder
// Full lifecycle: permission denial, unsupported browser, cancellation, cleanup.
// ═══════════════════════════════════════════════════════════════════════════

function useVoiceRecorder({ onComplete, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration,    setDuration]    = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const timerRef         = useRef(null);
  const cancelledRef     = useRef(false);
  const durationRef      = useRef(0);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) { onError("unsupported"); return; }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current    = stream;
      chunksRef.current    = [];
      cancelledRef.current = false;

      // Pick best supported MIME type
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find(
        t => MediaRecorder.isTypeSupported(t)
      ) ?? "";

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const d = durationRef.current;
        stopTracks();
        if (cancelledRef.current) { chunksRef.current = []; return; }
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        chunksRef.current = [];
        if (blob.size > MAX_VOICE_SIZE_BYTES) { onError("too_large"); return; }
        onComplete(blob, d);
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      durationRef.current = 0;
      setDuration(0);
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      stopTracks();
      clearInterval(timerRef.current);
      const code =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError" ? "permission_denied" :
        err.name === "NotFoundError" ? "not_found" : "unknown";
      onError(code);
    }
  }, [onComplete, onError, stopTracks]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    clearInterval(timerRef.current);
    timerRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setDuration(0);
    durationRef.current = 0;
  }, []);

  // Cleanup on unmount — stop everything, discard chunks
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearInterval(timerRef.current);
      try { mediaRecorderRef.current?.stop(); } catch {}
      stopTracks();
      chunksRef.current = [];
    };
  }, [stopTracks]);

  return { isRecording, duration, startRecording, stopRecording, cancelRecording };
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const MessageStatusIcon = memo(function MessageStatusIcon({ status }) {
  if (status === MSG_STATUS.SENDING)   return <Clock      className="w-3 h-3 text-slate-400" aria-hidden="true" />;
  if (status === MSG_STATUS.FAILED)    return <AlertCircle className="w-3 h-3 text-red-400"  aria-hidden="true" />;
  if (status === MSG_STATUS.SENT)      return <Check      className="w-3 h-3 text-slate-400" aria-hidden="true" />;
  if (status === MSG_STATUS.DELIVERED) return <CheckCheck  className="w-3 h-3 text-slate-400" aria-hidden="true" />;
  if (status === MSG_STATUS.READ)      return <CheckCheck  className="w-3 h-3 text-amber-400" aria-hidden="true" />;
  return null;
});

const MessageBubble = memo(function MessageBubble({ msg, peerAvatar, peerName, onRetry, t }) {
  const isMe = msg.from === "me";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
        <img
          src={peerAvatar}
          alt={peerName}
          className="w-7 h-7 rounded-full mr-2 self-end object-cover shrink-0 border border-slate-700"
        />
      )}
      <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {msg.type === MSG_TYPE.AUDIO ? (
          <div className={`rounded-2xl px-3 py-2.5 ${isMe ? "bg-amber-500 rounded-br-sm" : "bg-slate-800 rounded-bl-sm"}`}>
            <audio
              src={msg.audioUrl}
              controls
              className="h-8 max-w-[200px]"
              aria-label={`${t("chat.voiceMessage")} ${msg.time}`}
            />
            {msg.audioDuration != null && (
              <p className="text-[9px] mt-0.5 text-center opacity-70">
                {formatDuration(msg.audioDuration)}
              </p>
            )}
          </div>
        ) : (
          <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isMe
              ? "bg-amber-500 text-slate-950 rounded-br-sm font-medium"
              : "bg-slate-800 text-slate-100 rounded-bl-sm"
          }`}>
            {msg.text}
          </div>
        )}

        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[9px] text-slate-500">{msg.time}</span>
          {isMe && <MessageStatusIcon status={msg.status} />}
          {isMe && msg.status === MSG_STATUS.FAILED && (
            <button
              type="button"
              onClick={() => onRetry(msg.clientId)}
              aria-label={t("chat.retryLabel")}
              className="ml-1 text-[9px] text-red-400 underline hover:text-red-300 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
            >
              {t("chat.retryLabel")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

const TypingIndicator = memo(function TypingIndicator() {
  // Rendered only when FEATURE_FLAGS.TYPING_INDICATOR is true (gated at call site)
  return (
    <div className="flex justify-start" aria-label="...">
      <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-3 py-2.5">
        <div className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

const ConversationSkeleton = memo(function ConversationSkeleton() {
  return (
    <div aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/50 animate-pulse">
          <div className="w-11 h-11 rounded-full bg-slate-800/80 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded-full bg-slate-800/80" />
            <div className="h-2.5 w-20 rounded-full bg-slate-800/60" />
            <div className="h-2.5 w-40 rounded-full bg-slate-800/40" />
          </div>
        </div>
      ))}
    </div>
  );
});

const ConversationItem = memo(function ConversationItem({ chat, isSelected, onClick, t }) {
  return (
    <button
      type="button"
      onClick={() => onClick(chat)}
      aria-pressed={isSelected}
      aria-label={[
        chat.name,
        chat.role,
        chat.city,
        chat.unread > 0 ? t("chat.unreadCount", { count: chat.unread }) : "",
      ].filter(Boolean).join(" — ")}
      className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/50 text-left transition
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400
        ${isSelected ? "bg-amber-500/10" : "hover:bg-slate-800/40"}`}
    >
      <div className="relative shrink-0">
        <img
          src={chat.avatar}
          alt={chat.name}
          className="w-11 h-11 rounded-full border-2 border-slate-700 object-cover"
        />
        {chat.online && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f172a]"
            aria-label={t("chat.online")}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white truncate">{chat.name}</p>
          <span className="text-[10px] text-slate-500 shrink-0 ml-2">{chat.time}</span>
        </div>
        <p className="text-[11px] text-amber-400/80 font-semibold">{chat.role} · {chat.city}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{chat.lastMessage}</p>
      </div>
      {chat.unread > 0 && (
        <span
          aria-hidden="true"
          className="w-5 h-5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shrink-0"
        >
          {chat.unread}
        </span>
      )}
    </button>
  );
});

// ── ConversationList ────────────────────────────────────────────────────────

const ConversationList = memo(function ConversationList({
  conversations, selected, loading, error, onSelect, onRetry, t,
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  return (
    <div className="flex flex-col h-full bg-[#0f172a]" role="region" aria-label={t("chat.title")}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h2 className="text-base font-bold text-white mb-3">{t("chat.title")}</h2>
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("chat.searchPlaceholder")}
            aria-label={t("chat.searchPlaceholder")}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Efase"
              className="absolute right-2 text-slate-500 hover:text-white transition focus-visible:outline-none"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" role="list" aria-label={t("chat.title")}>
        {loading ? (
          <ConversationSkeleton />
        ) : error ? (
          <div role="alert" className="p-6 text-center">
            <WifiOff className="w-8 h-8 text-slate-600 mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-slate-500 mb-3">{t("chat.errorLoad")}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              <RefreshCcw className="w-3 h-3" aria-hidden="true" />
              {t("chat.retryLabel")}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div role="status" className="py-12 text-center px-4">
            <p className="text-sm font-bold text-slate-500 mb-1">
              {query ? t("chat.emptyMessages") : t("chat.noConvYet")}
            </p>
            <p className="text-xs text-slate-600">
              {query ? t("chat.emptyMessagesSub") : t("chat.noConvYetSub")}
            </p>
          </div>
        ) : (
          filtered.map(chat => (
            <div key={chat.id} role="listitem">
              <ConversationItem
                chat={chat}
                isSelected={selected?.id === chat.id}
                onClick={onSelect}
                t={t}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
});

// ── ChatHeader ──────────────────────────────────────────────────────────────

const ChatHeader = memo(function ChatHeader({ chat, onBack, t }) {
  return (
    <div className="h-14 flex items-center gap-3 px-3 bg-[#0f172a] border-b border-slate-800 shrink-0">
      <button
        type="button"
        onClick={onBack}
        aria-label={t("chat.backLabel")}
        className="p-1.5 text-slate-400 hover:text-white transition md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      <div className="relative">
        <img src={chat.avatar} alt={chat.name} className="w-9 h-9 rounded-full border border-slate-600 object-cover" />
        {chat.online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f172a]" aria-label={t("chat.online")} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">{chat.name}</p>
        <p className="text-[10px] text-amber-400">
          {chat.role} · {chat.online ? t("chat.online") : t("chat.offline")}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t("chat.callLabel")}
          className="p-2 text-slate-400 hover:text-amber-400 transition rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Phone className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t("chat.videoLabel")}
          className="p-2 text-slate-400 hover:text-amber-400 transition rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Video className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

// ── ChatInput ────────────────────────────────────────────────────────────────

const ChatInput = memo(function ChatInput({
  input, onInputChange, onSend, onKeyDown, voiceRecorder, t,
}) {
  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = voiceRecorder;

  return (
    <div className="p-3 border-t border-slate-800 bg-[#0f172a] shrink-0">
      <div className="flex items-center gap-2">
        {/* Mic: toggle start/stop recording */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? t("chat.stopRecordLabel") : t("chat.recordLabel")}
          aria-pressed={isRecording}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : "bg-slate-800 text-slate-400 hover:text-amber-400"
          }`}
        >
          {isRecording ? <MicOff className="w-4 h-4" aria-hidden="true" /> : <Mic className="w-4 h-4" aria-hidden="true" />}
        </button>

        {/* Text input — disabled while recording */}
        <input
          value={isRecording ? "" : input}
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={isRecording ? t("chat.inputRecording") : t("chat.inputPlaceholder")}
          disabled={isRecording}
          aria-label={t("chat.inputPlaceholder")}
          aria-disabled={isRecording}
          className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 disabled:opacity-50"
        />

        {/* Cancel recording button */}
        {isRecording && (
          <button
            type="button"
            onClick={cancelRecording}
            aria-label={t("chat.cancelRecording")}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-700 text-slate-400 hover:text-white transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        {/* Send button */}
        {!isRecording && (
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim()}
            aria-label={t("chat.sendLabel")}
            className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center disabled:opacity-40 active:scale-95 transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Send className="w-4 h-4 text-slate-950" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <p
          className="text-center text-xs text-red-400 mt-1.5 animate-pulse"
          role="status"
          aria-live="polite"
        >
          🔴 {t("chat.inputRecording")} {formatDuration(duration)} — {t("chat.recordingHint")}
        </p>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// CHAT WINDOW
// ═══════════════════════════════════════════════════════════════════════════

function ChatWindow({ chat, currentUser, onBack, socket }) {
  const { t }        = useTranslation();
  const [input, setInput]           = useState("");
  const [voiceError, setVoiceError] = useState(null);
  const bottomRef = useRef(null);

  const { messages, sendTextMessage, sendAudioMessage, retryMessage } =
    useMessages(chat, currentUser, socket);

  // ── Voice recorder ────────────────────────────────────────────────────
  const handleVoiceComplete = useCallback((blob, duration) => {
    sendAudioMessage(blob, duration);
  }, [sendAudioMessage]);

  const handleVoiceError = useCallback((code) => {
    const keys = {
      permission_denied: "chat.errorMic",
      unsupported:       "chat.errorMicUnsupported",
      not_found:         "chat.errorMicNotFound",
      too_large:         "chat.errorVoiceTooLarge",
    };
    setVoiceError(keys[code] ?? "chat.errorSend");
    setTimeout(() => setVoiceError(null), 4000);
  }, []);

  const voiceRecorder = useVoiceRecorder({ onComplete: handleVoiceComplete, onError: handleVoiceError });

  // ── Scroll to bottom on new message ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Socket: join/leave conversation room (gated) ──────────────────────
  useEffect(() => {
    if (!FEATURE_FLAGS.SOCKET_MESSAGING || !socket || !currentUser?._id) return;
    const convId = buildConversationId(currentUser._id ?? currentUser.id, chat.id);
    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: convId });
    return () => { socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId: convId }); };
  }, [socket, chat.id, currentUser?._id]);

  const handleSend = useCallback(() => {
    sendTextMessage(input);
    setInput("");
  }, [input, sendTextMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") voiceRecorder.cancelRecording();
  }, [handleSend, voiceRecorder]);

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      <ChatHeader chat={chat} onBack={onBack} t={t} />

      {/* Voice/mic error banner */}
      {voiceError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-3 mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {t(voiceError)}
        </div>
      )}

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        role="log"
        aria-label={t("chat.messageList")}
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map(msg => (
          <MessageBubble
            key={msg.clientId}
            msg={msg}
            peerAvatar={chat.avatar}
            peerName={chat.name}
            onRetry={retryMessage}
            t={t}
          />
        ))}
        {FEATURE_FLAGS.TYPING_INDICATOR && <TypingIndicator />}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      <ChatInput
        input={input}
        onInputChange={e => setInput(e.target.value)}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        voiceRecorder={voiceRecorder}
        t={t}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: ChatScreen
// Routes: /chat  and  /chat/:id  (AppRoutes.jsx)
// ═══════════════════════════════════════════════════════════════════════════

export default function ChatScreen() {
  const { user, socket }   = useAuth();
  const navigate            = useNavigate();
  const { id: urlChatId }  = useParams();
  const { t }               = useTranslation();

  const userId = user?._id ?? user?.id;

  const { conversations, loading, error, retry } = useConversations(userId);
  const [selectedChat, setSelectedChat] = useState(null);

  // Auto-select conversation when navigated to /chat/:id
  useEffect(() => {
    if (!urlChatId || !conversations.length) return;
    const match = conversations.find(c => c.id === urlChatId);
    if (match && selectedChat?.id !== match.id) setSelectedChat(match);
  }, [urlChatId, conversations, selectedChat?.id]);

  const handleSelect = useCallback((chat) => {
    setSelectedChat(chat);
    navigate(`/chat/${chat.id}`, { replace: true });
  }, [navigate]);

  const handleBack = useCallback(() => {
    setSelectedChat(null);
    navigate("/chat", { replace: true });
  }, [navigate]);

  return (
    <div
      className="h-[calc(100vh-7rem)] flex overflow-hidden"
      role="main"
      aria-label={t("chat.title")}
    >
      {/* ── Conversation list ─────────────────────────────────────────────── */}
      <div
        className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-slate-800 shrink-0`}
      >
        <ConversationList
          conversations={conversations}
          selected={selectedChat}
          loading={loading}
          error={error}
          onSelect={handleSelect}
          onRetry={retry}
          t={t}
        />
      </div>

      {/* ── Chat window ───────────────────────────────────────────────────── */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow
            chat={selectedChat}
            currentUser={user}
            onBack={handleBack}
            socket={socket}
          />
        </div>
      ) : (
        <div
          role="status"
          className="hidden md:flex flex-1 items-center justify-center flex-col gap-3 text-slate-500"
        >
          <span className="text-5xl" aria-hidden="true">💬</span>
          <p className="text-sm font-bold">{t("chat.noConversation")}</p>
          <p className="text-xs text-slate-600">{t("chat.noConversationSub")}</p>
        </div>
      )}
    </div>
  );
}
