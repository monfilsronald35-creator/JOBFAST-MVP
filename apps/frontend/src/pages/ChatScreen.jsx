/**
 * ChatScreen.jsx — Ultra-Pro v3.0
 * Features: text, voice (waveform), image, video, document attachments.
 * Architecture: feature-flagged service layer, optimistic sends, socket relay.
 */

import React, {
  useState, useRef, useEffect, useCallback, useMemo, memo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Mic, MicOff, Send, Phone, Video, ArrowLeft,
  Check, CheckCheck, Clock, AlertCircle, WifiOff, RefreshCcw,
  X, Search, Plus, Image, FileText, Play, Pause, Download,
  MoreVertical, Smile, Camera,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const MAX_TEXT_LENGTH       = 2000;
const MAX_VOICE_SIZE_BYTES  = 10 * 1024 * 1024;   // 10 MB
const MAX_FILE_SIZE_BYTES   = 25 * 1024 * 1024;   // 25 MB
const ACCEPTED_IMAGE_TYPES  = "image/*";
const ACCEPTED_VIDEO_TYPES  = "video/*";
const ACCEPTED_MEDIA_TYPES  = "image/*,video/*";
const ACCEPTED_DOC_TYPES    = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip";

const MSG_STATUS = Object.freeze({
  SENDING:   "sending",
  SENT:      "sent",
  DELIVERED: "delivered",
  READ:      "read",
  FAILED:    "failed",
});

const MSG_TYPE = Object.freeze({
  TEXT:     "text",
  AUDIO:    "audio",
  IMAGE:    "image",
  VIDEO:    "video",
  DOCUMENT: "document",
});

const FEATURE_FLAGS = Object.freeze({
  SOCKET_MESSAGING: false,
  SEND_VIA_API:     true,
  TYPING_INDICATOR: false,
  READ_RECEIPTS:    true,
  ONLINE_PRESENCE:  false,
  ATTACHMENTS:      true,    // local ObjectURL previews enabled
  REACTIONS:        false,
  PAGINATION:       true,
});

const SOCKET_EVENTS = Object.freeze({
  CONVERSATION_JOIN:  "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  MESSAGE_RECEIVE:    "message:receive",
  TYPING_START:       "typing:start",
  TYPING_STOP:        "typing:stop",
});

const QUICK_REACTIONS = ["👍","❤️","😂","😮","🙏"];

// ══════════════════════════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════════════════════════

const DEMO_CHATS = Object.freeze([
  {
    id:"demo1", name:"Jean Baptiste", role:"Albani", city:"Port-au-Prince",
    avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Jean",
    lastMessage:"Oui, mwen disponib demen maten", time:"18:45", unread:2, online:true,
  },
  {
    id:"demo2", name:"Marie Claire", role:"Plonbye", city:"Pétionville",
    avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
    lastMessage:"Konbyen sa koute?", time:"17:30", unread:0, online:false,
  },
  {
    id:"demo3", name:"Pierre Louis", role:"Elektrisite", city:"Delmas",
    avatar:"https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre",
    lastMessage:"OK mèsi, map rele ou", time:"16:00", unread:1, online:true,
  },
]);

// ══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════════════

function generateClientId() {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function sanitizeText(str) {
  return String(str ?? "").replace(/<[^>]*>/g, "").trim().slice(0, MAX_TEXT_LENGTH);
}

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildConversationId(idA, idB) {
  return [String(idA ?? ""), String(idB ?? "")].sort().join("_");
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}

function fileTypeFromMime(mime = "") {
  if (mime.startsWith("image/")) return MSG_TYPE.IMAGE;
  if (mime.startsWith("video/")) return MSG_TYPE.VIDEO;
  return MSG_TYPE.DOCUMENT;
}

// Deterministic pseudo-waveform from a seed string
function buildWaveBars(seed, count = 28) {
  const n = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 1);
  return Array.from({ length: count }, (_, i) => {
    const v = Math.abs(Math.sin((n * (i + 1) * 7.3) % Math.PI));
    return 0.15 + v * 0.85;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT SERVICE
// ══════════════════════════════════════════════════════════════════════════════

const ChatService = {
  async getConversations(_userId, { signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API) {
      try {
        const res = await API.get("/messages/conversations", { signal });
        return res.data;
      } catch { return { conversations: [...DEMO_CHATS] }; }
    }
    return { conversations: [...DEMO_CHATS] };
  },

  async getMessages(_conversationId, { _cursor, _limit = 30, signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API) {
      try {
        const res = await API.get(`/messages/${_conversationId}`, {
          params: { cursor: _cursor, limit: _limit }, signal,
        });
        return res.data;
      } catch { return { messages: [], nextCursor: null }; }
    }
    return { messages: [], nextCursor: null };
  },

  async sendMessage(payload, { signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API) {
      try {
        const res = await API.post("/messages", payload, { signal });
        return res.data;
      } catch { throw new Error("send_failed"); }
    }
    return { message: { ...payload, _id: payload.clientId, createdAt: new Date().toISOString() } };
  },

  async markConversationRead(_conversationId, { signal } = {}) {
    if (FEATURE_FLAGS.SEND_VIA_API && FEATURE_FLAGS.READ_RECEIPTS) {
      try { await API.patch(`/messages/${_conversationId}/read`, {}, { signal }); } catch {}
    }
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// HOOK: useConversations
// ══════════════════════════════════════════════════════════════════════════════

function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [retryCount,    setRetryCount]    = useState(0);
  const abortRef  = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; abortRef.current?.abort(); };
  }, []);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null);
    try {
      const data = await ChatService.getConversations(userId, { signal: abortRef.current.signal });
      if (!mountedRef.current) return;
      setConversations(data.conversations ?? []);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setError(err); setConversations([...DEMO_CHATS]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load, retryCount]);
  const retry = useCallback(() => setRetryCount(c => c + 1), []);
  return { conversations, loading, error, retry };
}

// ══════════════════════════════════════════════════════════════════════════════
// HOOK: useMessages
// ══════════════════════════════════════════════════════════════════════════════

function useMessages(chat, currentUser, socket) {
  const buildInitialMessages = useCallback((c) => {
    if (!c) return [];
    return [
      {
        clientId:"init-1", _id:"init-1", from:c.id, type:MSG_TYPE.TEXT,
        text:`Bonjou! Mwen wè ou ap chèche yon ${c.role}?`,
        time:"16:00", createdAt:new Date(), status:MSG_STATUS.READ,
      },
      {
        clientId:"init-2", _id:"init-2", from:"me", type:MSG_TYPE.TEXT,
        text:"Wi, mwen bezwen yon travay.",
        time:"16:01", createdAt:new Date(), status:MSG_STATUS.READ,
      },
      {
        clientId:"init-3", _id:"init-3", from:c.id, type:MSG_TYPE.TEXT,
        text:c.lastMessage, time:c.time, createdAt:new Date(), status:MSG_STATUS.READ,
      },
    ];
  }, []);

  const [messages, setMessages] = useState(() => buildInitialMessages(chat));
  const messagesRef = useRef(messages);
  const abortRef    = useRef(null);
  const mountedRef  = useRef(true);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Revoke ObjectURLs on chat change
  useEffect(() => {
    const prev = messagesRef.current;
    setMessages(buildInitialMessages(chat));
    return () => {
      prev.forEach(m => {
        if (m.fileUrl?.startsWith("blob:"))  URL.revokeObjectURL(m.fileUrl);
        if (m.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(m.audioUrl);
      });
    };
  }, [chat?.id, buildInitialMessages]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      messagesRef.current.forEach(m => {
        if (m.fileUrl?.startsWith("blob:"))  URL.revokeObjectURL(m.fileUrl);
        if (m.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(m.audioUrl);
      });
    };
  }, []);

  // Socket: real-time incoming
  useEffect(() => {
    if (!FEATURE_FLAGS.SOCKET_MESSAGING || !socket || !chat) return;
    const expectedConvId = buildConversationId(currentUser?._id, chat.id);
    const onIncoming = (raw) => {
      if (!raw || typeof raw !== "object") return;
      if (raw.conversationId !== expectedConvId) return;
      if (!mountedRef.current) return;
      setMessages(prev => {
        if (prev.some(m => m.clientId === raw.clientId || (raw._id && m._id === raw._id))) return prev;
        return [...prev, {
          clientId:  raw.clientId ?? raw._id ?? generateClientId(),
          _id:       raw._id ?? null,
          from:      raw.senderId,
          type:      raw.type ?? MSG_TYPE.TEXT,
          text:      sanitizeText(raw.message ?? ""),
          audioUrl:  raw.audioUrl ?? null,
          audioDuration: raw.audioDuration ?? null,
          fileUrl:   raw.fileUrl ?? null,
          fileName:  raw.fileName ?? null,
          fileSize:  raw.fileSize ?? null,
          time:      formatTime(raw.createdAt ? new Date(raw.createdAt) : new Date()),
          createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
          status:    MSG_STATUS.READ,
          reactions: {},
        }];
      });
    };
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVE, onIncoming);
    return () => { socket.off(SOCKET_EVENTS.MESSAGE_RECEIVE, onIncoming); };
  }, [socket, chat?.id, currentUser?._id]);

  // Send text
  const sendTextMessage = useCallback(async (text) => {
    if (!chat || !currentUser) return;
    const sanitized = sanitizeText(text);
    if (!sanitized) return;
    const clientId  = generateClientId();
    const now       = new Date();
    const optimistic = {
      clientId, _id:null, from:"me", type:MSG_TYPE.TEXT, text:sanitized,
      time:formatTime(now), createdAt:now, status:MSG_STATUS.SENDING, reactions:{},
    };
    setMessages(prev => [...prev, optimistic]);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      await ChatService.sendMessage({
        clientId,
        conversationId: buildConversationId(currentUser._id ?? currentUser.id, chat.id),
        senderId:   currentUser._id ?? currentUser.id,
        receiverId: chat.id,
        type:       "chat",
        message:    sanitized,
      }, { signal: abortRef.current.signal });
      if (!mountedRef.current) return;
      setMessages(prev => prev.map(m => m.clientId === clientId ? { ...m, status:MSG_STATUS.SENT } : m));
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      setMessages(prev => prev.map(m => m.clientId === clientId ? { ...m, status:MSG_STATUS.FAILED } : m));
    }
  }, [chat, currentUser]);

  // Send audio
  const sendAudioMessage = useCallback((blob, duration) => {
    if (!chat || !currentUser) return;
    if (blob.size > MAX_VOICE_SIZE_BYTES) return;
    setMessages(prev => [...prev, {
      clientId:generateClientId(), _id:null, from:"me", type:MSG_TYPE.AUDIO,
      text:null, audioUrl:URL.createObjectURL(blob), audioDuration:duration,
      time:formatTime(new Date()), createdAt:new Date(), status:MSG_STATUS.SENT, reactions:{},
    }]);
  }, [chat, currentUser]);

  // Send file (image / video / document)
  const sendFileMessage = useCallback((file) => {
    if (!chat || !currentUser || !file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) return null;
    const type = fileTypeFromMime(file.type);
    const clientId = generateClientId();
    setMessages(prev => [...prev, {
      clientId, _id:null, from:"me", type,
      fileUrl:URL.createObjectURL(file),
      fileName:file.name,
      fileSize:file.size,
      fileMime:file.type,
      text:null,
      time:formatTime(new Date()), createdAt:new Date(),
      status:MSG_STATUS.SENT, reactions:{},
    }]);
    return clientId;
  }, [chat, currentUser]);

  // Retry failed
  const retryMessage = useCallback((clientId) => {
    const msg = messagesRef.current.find(m => m.clientId === clientId);
    if (!msg || msg.type !== MSG_TYPE.TEXT || !msg.text) return;
    setMessages(prev => prev.filter(m => m.clientId !== clientId));
    sendTextMessage(msg.text);
  }, [sendTextMessage]);

  // React to message
  const addReaction = useCallback((clientId, emoji) => {
    setMessages(prev => prev.map(m =>
      m.clientId === clientId
        ? { ...m, reactions: { ...(m.reactions || {}), [emoji]: ((m.reactions || {})[emoji] || 0) + 1 } }
        : m
    ));
  }, []);

  return { messages, sendTextMessage, sendAudioMessage, sendFileMessage, retryMessage, addReaction };
}

// ══════════════════════════════════════════════════════════════════════════════
// HOOK: useVoiceRecorder
// ══════════════════════════════════════════════════════════════════════════════

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
      streamRef.current = stream; chunksRef.current = []; cancelledRef.current = false;
      const mimeType = ["audio/webm;codecs=opus","audio/webm","audio/ogg"].find(
        t => MediaRecorder.isTypeSupported(t)
      ) ?? "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const d = durationRef.current; stopTracks();
        if (cancelledRef.current) { chunksRef.current = []; return; }
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        chunksRef.current = [];
        if (blob.size > MAX_VOICE_SIZE_BYTES) { onError("too_large"); return; }
        onComplete(blob, d);
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true); durationRef.current = 0; setDuration(0);
      timerRef.current = setInterval(() => { durationRef.current += 1; setDuration(d => d + 1); }, 1000);
    } catch (err) {
      stopTracks(); clearInterval(timerRef.current);
      const code =
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError" ? "permission_denied" :
        err.name === "NotFoundError" ? "not_found" : "unknown";
      onError(code);
    }
  }, [onComplete, onError, stopTracks]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current); timerRef.current = null;
    mediaRecorderRef.current?.stop(); mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    clearInterval(timerRef.current); timerRef.current = null;
    mediaRecorderRef.current?.stop(); mediaRecorderRef.current = null;
    setIsRecording(false); setDuration(0); durationRef.current = 0;
  }, []);

  useEffect(() => () => {
    cancelledRef.current = true;
    clearInterval(timerRef.current);
    try { mediaRecorderRef.current?.stop(); } catch {}
    stopTracks(); chunksRef.current = [];
  }, [stopTracks]);

  return { isRecording, duration, startRecording, stopRecording, cancelRecording };
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Status icon ──────────────────────────────────────────────────────────────
const MsgStatusIcon = memo(function MsgStatusIcon({ status }) {
  if (status === MSG_STATUS.SENDING)   return <Clock       className="w-3 h-3 text-slate-400" />;
  if (status === MSG_STATUS.FAILED)    return <AlertCircle className="w-3 h-3 text-red-400" />;
  if (status === MSG_STATUS.SENT)      return <Check       className="w-3 h-3 text-slate-400" />;
  if (status === MSG_STATUS.DELIVERED) return <CheckCheck  className="w-3 h-3 text-slate-400" />;
  if (status === MSG_STATUS.READ)      return <CheckCheck  className="w-3 h-3 text-amber-400" />;
  return null;
});

// ── Voice waveform bubble ────────────────────────────────────────────────────
const VoiceBubble = memo(function VoiceBubble({ msg, isMe }) {
  const [playing,     setPlaying]     = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const bars = useMemo(() => buildWaveBars(msg.clientId || "x"), [msg.clientId]);
  const activeColor  = isMe ? "#0a0f1a" : "#FACC15";
  const inactiveColor = isMe ? "rgba(10,15,26,0.35)" : "rgba(250,204,21,0.30)";

  const toggle = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  };

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 min-w-[200px] max-w-[260px]">
      <button type="button" onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition"
        style={{ background: isMe ? "rgba(0,0,0,0.25)" : "rgba(250,204,21,0.15)" }}>
        {playing
          ? <Pause className="w-4 h-4" style={{ color: activeColor }} />
          : <Play  className="w-4 h-4 ml-0.5" style={{ color: activeColor }} />
        }
      </button>

      <div className="flex items-center gap-[2px] flex-1 h-8">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-full transition-all"
            style={{
              height: `${h * 100}%`,
              background: progress > i / bars.length ? activeColor : inactiveColor,
              minWidth: 2,
            }}
          />
        ))}
      </div>

      <span className="text-[10px] font-bold shrink-0" style={{ color: activeColor }}>
        {playing ? formatDuration(currentTime) : formatDuration(msg.audioDuration || 0)}
      </span>

      <audio ref={audioRef} src={msg.audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          setCurrentTime(audioRef.current.currentTime);
          const dur = audioRef.current.duration;
          if (dur) setProgress(audioRef.current.currentTime / dur);
        }}
      />
    </div>
  );
});

// ── Image bubble ─────────────────────────────────────────────────────────────
const ImageBubble = memo(function ImageBubble({ msg, onPreview }) {
  return (
    <button type="button" onClick={() => onPreview(msg)}
      className="rounded-2xl overflow-hidden block max-w-[220px] w-full relative group">
      <img src={msg.fileUrl} alt={msg.fileName || "image"}
        className="w-full object-cover rounded-2xl" style={{ maxHeight: 200 }} />
      <div className="absolute inset-0 bg-black/0 group-active:bg-black/20 rounded-2xl transition" />
    </button>
  );
});

// ── Video bubble ─────────────────────────────────────────────────────────────
const VideoBubble = memo(function VideoBubble({ msg, onPreview }) {
  return (
    <button type="button" onClick={() => onPreview(msg)}
      className="relative rounded-2xl overflow-hidden block max-w-[220px] w-full">
      <video src={msg.fileUrl} muted playsInline preload="metadata"
        className="w-full object-cover rounded-2xl" style={{ maxHeight: 200 }} />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-5 h-5 text-white ml-0.5" />
        </div>
      </div>
    </button>
  );
});

// ── Document bubble ──────────────────────────────────────────────────────────
const DocumentBubble = memo(function DocumentBubble({ msg, isMe }) {
  const ext = (msg.fileName || "").split(".").pop().toUpperCase() || "DOC";
  const extColor = ext === "PDF" ? "#ef4444" : ext.startsWith("XL") ? "#22c55e" : "#3b82f6";
  return (
    <a href={msg.fileUrl} download={msg.fileName}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl min-w-[180px] max-w-[240px] transition active:scale-[0.98]"
      style={{ background: isMe ? "rgba(0,0,0,0.20)" : "#1e293b" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black"
        style={{ background: `${extColor}20`, color: extColor }}>
        {ext.slice(0,4)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: isMe ? "#0a0f1a" : "#f1f5f9" }}>
          {msg.fileName || "Fichye"}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: isMe ? "rgba(0,0,0,0.55)" : "#64748b" }}>
          {formatBytes(msg.fileSize)}
        </p>
      </div>
      <Download className="w-4 h-4 shrink-0" style={{ color: isMe ? "#0a0f1a" : "#64748b" }} />
    </a>
  );
});

// ── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = memo(function Lightbox({ item, onClose }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <p className="text-xs text-slate-400 truncate max-w-xs">{item.fileName || ""}</p>
        <div className="flex gap-3">
          {item.fileUrl && (
            <a href={item.fileUrl} download={item.fileName}
              className="text-slate-400 hover:text-white transition" onClick={e => e.stopPropagation()}>
              <Download className="w-5 h-5" />
            </a>
          )}
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {item.type === MSG_TYPE.VIDEO ? (
          <video src={item.fileUrl} controls autoPlay
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />
        ) : (
          <img src={item.fileUrl} alt={item.fileName || ""}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        )}
      </div>
    </div>
  );
});

// ── Reaction row ──────────────────────────────────────────────────────────────
const ReactionRow = memo(function ReactionRow({ reactions }) {
  if (!reactions || !Object.keys(reactions).length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(reactions).map(([emoji, count]) => (
        <span key={emoji}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold">
          {emoji} {count > 1 && <span className="text-slate-400">{count}</span>}
        </span>
      ))}
    </div>
  );
});

// ── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = memo(function MessageBubble({
  msg, peerAvatar, peerName, onRetry, onPreview, onReact, t,
}) {
  const isMe = msg.from === "me";
  const [showReact, setShowReact] = useState(false);

  const bubbleStyle = isMe
    ? { background: "linear-gradient(135deg, #FACC15, #f59e0b)", color:"#0a0f1a" }
    : { background: "#1e293b", color:"#f1f5f9" };

  const renderContent = () => {
    switch (msg.type) {
      case MSG_TYPE.AUDIO:
        return <VoiceBubble msg={msg} isMe={isMe} />;
      case MSG_TYPE.IMAGE:
        return <ImageBubble msg={msg} onPreview={onPreview} />;
      case MSG_TYPE.VIDEO:
        return <VideoBubble msg={msg} onPreview={onPreview} />;
      case MSG_TYPE.DOCUMENT:
        return <DocumentBubble msg={msg} isMe={isMe} />;
      default:
        return (
          <div className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
            style={{ ...bubbleStyle, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px" }}>
            {msg.text}
          </div>
        );
    }
  };

  const isMedia = msg.type === MSG_TYPE.IMAGE || msg.type === MSG_TYPE.VIDEO;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2 group`}>
      {!isMe && (
        <img src={peerAvatar} alt={peerName}
          className="w-7 h-7 rounded-full self-end object-cover shrink-0 border border-slate-700" />
      )}

      <div className={`max-w-[78%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        {/* Wrap media in the gradient container too */}
        {(msg.type === MSG_TYPE.AUDIO || isMedia || msg.type === MSG_TYPE.DOCUMENT) ? (
          <div className="rounded-2xl overflow-hidden"
            style={msg.type !== MSG_TYPE.DOCUMENT
              ? { ...bubbleStyle, padding: 0 }
              : {}}>
            {renderContent()}
          </div>
        ) : renderContent()}

        {/* Reactions */}
        <ReactionRow reactions={msg.reactions} />

        {/* Meta row */}
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[9px] text-slate-500">{msg.time}</span>
          {isMe && <MsgStatusIcon status={msg.status} />}
          {isMe && msg.status === MSG_STATUS.FAILED && (
            <button type="button" onClick={() => onRetry(msg.clientId)}
              className="ml-1 text-[9px] text-red-400 underline">
              {t("chat.retryLabel","Reesaye")}
            </button>
          )}
          {/* Quick-react button (appears on hover) */}
          <button type="button"
            onClick={() => setShowReact(v => !v)}
            className="ml-1 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition text-slate-500">
            <Smile className="w-3 h-3" />
          </button>
        </div>

        {/* Emoji picker */}
        {showReact && (
          <div className="flex gap-1 mt-1 px-1">
            {QUICK_REACTIONS.map(e => (
              <button key={e} type="button"
                onClick={() => { onReact(msg.clientId, e); setShowReact(false); }}
                className="text-base active:scale-125 transition">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-3 py-2.5">
        <div className="flex items-center gap-1">
          {[0,1,2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay:`${i*0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Skeleton ─────────────────────────────────────────────────────────────────
const ConversationSkeleton = memo(function ConversationSkeleton() {
  return (
    <div aria-busy="true">
      {Array.from({length:4}).map((_,i) => (
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

// ── Conversation item ─────────────────────────────────────────────────────────
const ConversationItem = memo(function ConversationItem({ chat, isSelected, onClick, t }) {
  return (
    <button type="button" onClick={() => onClick(chat)} aria-pressed={isSelected}
      className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/50 text-left transition
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400
        ${isSelected ? "bg-amber-500/10" : "hover:bg-slate-800/40"}`}>
      <div className="relative shrink-0">
        <img src={chat.avatar} alt={chat.name}
          className="w-11 h-11 rounded-full border-2 border-slate-700 object-cover" />
        {chat.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f172a]" />
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
        <span className="w-5 h-5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
          {chat.unread}
        </span>
      )}
    </button>
  );
});

// ── Conversation list ─────────────────────────────────────────────────────────
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
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h2 className="text-base font-bold text-white mb-3">{t("chat.title","Mesaj")}</h2>
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input type="search" value={query} onChange={e => setQuery(e.target.value)}
            placeholder={t("chat.searchPlaceholder","Chèche konvèsasyon...")}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus-visible:outline-none" />
          {query && (
            <button type="button" onClick={() => setQuery("")}
              className="absolute right-2 text-slate-500 hover:text-white transition">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? <ConversationSkeleton /> :
         error ? (
          <div className="p-6 text-center">
            <WifiOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 mb-3">{t("chat.errorLoad","Erè koneksyon")}</p>
            <button type="button" onClick={onRetry}
              className="inline-flex items-center gap-1 text-xs text-amber-400">
              <RefreshCcw className="w-3 h-3" />
              {t("chat.retryLabel","Reesaye")}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center px-4">
            <p className="text-sm font-bold text-slate-500 mb-1">
              {query ? "Pa jwenn rezilta" : t("chat.noConvYet","Pa gen konvèsasyon")}
            </p>
            <p className="text-xs text-slate-600">
              {query ? "Eseye yon lòt non" : "Kòmanse yon konvèsasyon ak yon pwofesyonèl"}
            </p>
          </div>
        ) : filtered.map(chat => (
          <ConversationItem key={chat.id} chat={chat} isSelected={selected?.id === chat.id}
            onClick={onSelect} t={t} />
        ))}
      </div>
    </div>
  );
});

// ── Chat header ───────────────────────────────────────────────────────────────
const ChatHeader = memo(function ChatHeader({ chat, onBack, onCall, t }) {
  return (
    <div className="h-14 flex items-center gap-3 px-3 shrink-0 border-b border-slate-800/60"
      style={{ background: "#0f172a" }}>
      <button type="button" onClick={onBack} aria-label="Retounen"
        className="p-1.5 text-slate-400 hover:text-white transition md:hidden rounded-lg">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="relative">
        <img src={chat.avatar} alt={chat.name}
          className="w-9 h-9 rounded-full border border-slate-600 object-cover" />
        {chat.online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f172a]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">{chat.name}</p>
        <p className="text-[10px] text-amber-400/80">
          {chat.role} · {chat.online ? "✓ Disponib" : "Oflayn"}
        </p>
      </div>
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={() => onCall?.("audio")}
          className="p-2 text-slate-400 hover:text-amber-400 transition rounded-lg">
          <Phone className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => onCall?.("video")}
          className="p-2 text-slate-400 hover:text-amber-400 transition rounded-lg">
          <Video className="w-4 h-4" />
        </button>
        <button type="button" className="p-2 text-slate-400 hover:text-white transition rounded-lg">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// ── Attachment menu ───────────────────────────────────────────────────────────
const AttachmentMenu = memo(function AttachmentMenu({ onSelect, onClose }) {
  const items = [
    { icon:<Camera className="w-5 h-5"/>, label:"Foto / Videyo", color:"#a855f7", accept:ACCEPTED_MEDIA_TYPES },
    { icon:<Image  className="w-5 h-5"/>, label:"Foto sèlman",   color:"#3b82f6", accept:ACCEPTED_IMAGE_TYPES },
    { icon:<FileText className="w-5 h-5"/>, label:"Dokiman",     color:"#f97316", accept:ACCEPTED_DOC_TYPES },
  ];
  return (
    <div className="absolute bottom-14 left-2 z-20 flex flex-col gap-1.5 p-2 rounded-2xl border shadow-2xl"
      style={{ background:"#0f172a", borderColor:"#1e293b", boxShadow:"0 20px 60px rgba(0,0,0,0.8)" }}>
      {items.map(item => (
        <button key={item.label} type="button"
          onClick={() => onSelect(item.accept)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 transition text-left">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${item.color}20`, color: item.color }}>
            {item.icon}
          </div>
          <span className="text-sm font-bold text-slate-200">{item.label}</span>
        </button>
      ))}
      <button type="button" onClick={onClose}
        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 transition text-left">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-slate-700">
          <X className="w-4 h-4 text-slate-400" />
        </div>
        <span className="text-sm text-slate-500">Fèmen</span>
      </button>
    </div>
  );
});

// ── Chat input ────────────────────────────────────────────────────────────────
const ChatInput = memo(function ChatInput({
  input, onInputChange, onSend, onKeyDown, voiceRecorder, onFileSelected, t,
}) {
  const { isRecording, duration, startRecording, stopRecording, cancelRecording } = voiceRecorder;
  const [showAttach, setShowAttach] = useState(false);
  const fileInputRef = useRef(null);
  const [fileAccept, setFileAccept] = useState("*");

  const handleAttachSelect = (accept) => {
    setFileAccept(accept);
    setShowAttach(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  return (
    <div className="relative p-3 border-t border-slate-800/60 shrink-0" style={{ background:"#0f172a" }}>
      {/* Attachment menu */}
      {showAttach && (
        <AttachmentMenu onSelect={handleAttachSelect} onClose={() => setShowAttach(false)} />
      )}

      {/* Recording bar */}
      {isRecording && (
        <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-xs text-red-400 font-bold flex-1">
            Anrejistreman... {formatDuration(duration)}
          </span>
          <button type="button" onClick={cancelRecording}
            className="text-slate-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* + Attachment */}
        {!isRecording && (
          <button type="button" onClick={() => setShowAttach(v => !v)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition
              ${showAttach ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-amber-400"}`}>
            <Plus className="w-5 h-5" />
          </button>
        )}

        {/* Text input */}
        <input value={isRecording ? "" : input} onChange={onInputChange} onKeyDown={onKeyDown}
          placeholder={isRecording ? "Ap anrejistre..." : "Ekri yon mesaj..."}
          disabled={isRecording}
          className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-full px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500/50 focus-visible:outline-none disabled:opacity-50 transition" />

        {/* Mic / Stop */}
        <button type="button"
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? "Kanpe anrejistreman" : "Anrejistre vwa"}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition
            ${isRecording
              ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40"
              : input.trim() ? "hidden" : "bg-slate-800 text-slate-400 hover:text-amber-400"
            }`}>
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send */}
        {!isRecording && input.trim() && (
          <button type="button" onClick={onSend}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition active:scale-90"
            style={{ background:"linear-gradient(135deg,#FACC15,#f59e0b)", boxShadow:"0 4px 20px rgba(250,204,21,0.4)" }}>
            <Send className="w-4 h-4 text-slate-950" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept={fileAccept} className="hidden"
        onChange={handleFileChange} />
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════════
// CHAT WINDOW
// ══════════════════════════════════════════════════════════════════════════════

function ChatWindow({ chat, currentUser, onBack, socket }) {
  const { t }           = useTranslation();
  const [input, setInput]           = useState("");
  const [voiceError, setVoiceError] = useState(null);
  const [callToast, setCallToast]   = useState("");
  const [lightbox, setLightbox]     = useState(null);
  const bottomRef = useRef(null);

  const { messages, sendTextMessage, sendAudioMessage, sendFileMessage, retryMessage, addReaction } =
    useMessages(chat, currentUser, socket);

  const handleCall = useCallback((type) => {
    setCallToast(type === "video" ? "📹 Apèl vidéyo — Coming soon" : "📞 Apèl vwa — Coming soon");
    setTimeout(() => setCallToast(""), 2500);
  }, []);

  const handleVoiceComplete = useCallback((blob, dur) => sendAudioMessage(blob, dur), [sendAudioMessage]);
  const handleVoiceError    = useCallback((code) => {
    const map = {
      permission_denied: "Aksè mikwofòn refize",
      unsupported:       "Navigatè w pa sipòte",
      not_found:         "Mikwofòn pa jwenn",
      too_large:         "Fichye twò gwo (max 10MB)",
    };
    setVoiceError(map[code] ?? "Erè anrejistreman");
    setTimeout(() => setVoiceError(null), 4000);
  }, []);

  const voiceRecorder = useVoiceRecorder({ onComplete: handleVoiceComplete, onError: handleVoiceError });

  const handleFileSelected = useCallback((file) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setVoiceError("Fichye twò gwo (max 25MB)");
      setTimeout(() => setVoiceError(null), 3000);
      return;
    }
    sendFileMessage(file);
  }, [sendFileMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  useEffect(() => {
    if (!FEATURE_FLAGS.SOCKET_MESSAGING || !socket || !currentUser?._id) return;
    const convId = buildConversationId(currentUser._id ?? currentUser.id, chat.id);
    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, { conversationId: convId });
    return () => { socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, { conversationId: convId }); };
  }, [socket, chat.id, currentUser?._id]);

  const handleSend = useCallback(() => {
    sendTextMessage(input); setInput("");
  }, [input, sendTextMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") voiceRecorder.cancelRecording();
  }, [handleSend, voiceRecorder]);

  return (
    <div className="flex flex-col h-full" style={{ background:"#020617" }}>
      <ChatHeader chat={chat} onBack={onBack} onCall={handleCall} t={t} />

      {/* Toasts */}
      {callToast && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 text-center shrink-0">
          {callToast}
        </div>
      )}
      {voiceError && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {voiceError}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.clientId}
            msg={msg}
            peerAvatar={chat.avatar}
            peerName={chat.name}
            onRetry={retryMessage}
            onPreview={setLightbox}
            onReact={addReaction}
            t={t}
          />
        ))}
        {FEATURE_FLAGS.TYPING_INDICATOR && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput
        input={input}
        onInputChange={e => setInput(e.target.value)}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        voiceRecorder={voiceRecorder}
        onFileSelected={handleFileSelected}
        t={t}
      />

      {/* Lightbox */}
      {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN: ChatScreen
// ══════════════════════════════════════════════════════════════════════════════

export default function ChatScreen() {
  const { user, socket }  = useAuth();
  const navigate          = useNavigate();
  const { id: urlChatId } = useParams();
  const { t }             = useTranslation();
  const userId            = user?._id ?? user?.id;

  const { conversations, loading, error, retry } = useConversations(userId);
  const [selectedChat, setSelectedChat]          = useState(null);

  useEffect(() => {
    if (!urlChatId || !conversations.length) return;
    const match = conversations.find(c => c.id === urlChatId);
    if (match && selectedChat?.id !== match.id) setSelectedChat(match);
  }, [urlChatId, conversations, selectedChat?.id]);

  const handleSelect = useCallback((chat) => {
    setSelectedChat(chat);
    navigate(`/chat/${chat.id}`, { replace:true });
  }, [navigate]);

  const handleBack = useCallback(() => {
    setSelectedChat(null);
    navigate("/chat", { replace:true });
  }, [navigate]);

  return (
    <div className="h-[calc(100vh-7rem)] flex overflow-hidden">
      {/* Conversation list */}
      <div className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-slate-800/60 shrink-0`}>
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

      {/* Chat window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatWindow chat={selectedChat} currentUser={user} onBack={handleBack} socket={socket} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4 text-slate-500">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background:"rgba(250,204,21,0.08)", border:"1.5px dashed rgba(250,204,21,0.2)" }}>
            <span className="text-4xl">💬</span>
          </div>
          <p className="text-sm font-bold text-slate-400">Chwazi yon konvèsasyon</p>
          <p className="text-xs text-slate-600">Pataje foto, videyo, dokiman ak mesaj vwa</p>
        </div>
      )}
    </div>
  );
}
