// src/pages/ChatScreen.tsx
import React, {
  useEffect, useMemo, useRef, useState, useCallback, memo, Suspense, lazy, useDeferredValue,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Mic, Send, Phone, Video, ArrowLeft,
  WifiOff, RefreshCcw, X, Search, Plus, Image, FileText, Play, Pause, Download,
  MoreVertical, Smile, Camera, Lock, Shield, MessageSquareMore, Pin, Trash2, Reply,
  Forward, Copy, Edit3, Flag, Ban, Paperclip, Upload, RotateCcw, Sparkles, Languages,
  WandSparkles, Bot, FileSearch, CalendarDays, MapPin, PhoneCall, Share2, Volume2,
  VolumeX, Globe, Megaphone, Users, Building2, ShieldAlert, Bell, BellOff, Repeat,
  Hash, FileAudio2, BadgeCheck, CircleDashed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  useQuery, useQueryClient, useInfiniteQuery, useMutation, InfiniteData,
} from "@tanstack/react-query";
import {
  chatApi,
  conversationApi,
  messageApi,
  attachmentApi,
  presenceApi,
  moderationApi,
  aiApi,
  voiceApi,
  videoApi,
  searchApi,
  notificationApi,
} from "../api/chat";
import { useChatSocket } from "../hooks/useChatSocket";
import { VirtualizedMessageList } from "../components/VirtualizedMessageList";
import { enqueueOffline, getOfflineQueue, removeOfflineItem } from "../lib/indexedDb";

const AttachmentPicker = lazy(() => import("../components/AttachmentPicker"));
const VoiceRecorder    = lazy(() => import("../components/VoiceRecorder"));

// ---- CONSTANTS (as const for literal inference) ----------------------------

const MSG_STATUS = {
  QUEUED:          "queued",
  ENCRYPTING:      "encrypting",
  COMPRESSING:     "compressing",
  UPLOADING:       "uploading",
  SERVER_ACCEPTED: "server_accepted",
  SENT:            "sent",
  FAILED:          "failed",
} as const;

const PRESENCE = {
  ONLINE:    "online",
  AWAY:      "away",
  BUSY:      "busy",
  IN_MEETING:"in_meeting",
  DRIVING:   "driving",
  DND:       "dnd",
  INVISIBLE: "invisible",
  VACATION:  "vacation",
  OFFLINE:   "offline",
} as const;

const SEARCH_SCOPE = {
  ALL:        "all",
  MESSAGES:   "messages",
  ATTACHMENTS:"attachments",
  LINKS:      "links",
  USERS:      "users",
  FILES:      "files",
  VOICE:      "voice",
  SUMMARIES:  "summaries",
} as const;

const SOCKET_EVENTS = {
  MESSAGE_NEW:       "message:new",
  MESSAGE_EDIT:      "message:edit",
  MESSAGE_DELETE:    "message:delete",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_READ:      "message:read",
  MESSAGE_REACTION:  "message:reaction",
  TYPING_START:      "typing:start",
  TYPING_STOP:       "typing:stop",
  PRESENCE_UPDATE:   "presence:update",
  MESSAGE_VERSION:   "message:version",
  AI_MODERATION:     "ai:moderation",
  PING:              "ping",
  PONG:              "pong",
} as const;

// ---- TYPES -----------------------------------------------------------------

type MsgStatus    = typeof MSG_STATUS[keyof typeof MSG_STATUS];
type PresenceVal  = typeof PRESENCE[keyof typeof PRESENCE];
type SearchScope  = typeof SEARCH_SCOPE[keyof typeof SEARCH_SCOPE];
type SocketEvent  = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

interface DeliveryRecord {
  deviceId: string;
  status: string;
}

interface MessageReaction {
  emoji: string;
  userId: string;
}

interface MessageVersion {
  text: string;
  ts: string;
}

interface MessageData {
  _id: string;
  clientId?: string;
  senderId: string;
  conversationId: string;
  type: string;
  ciphertext?: string | null;
  plainText?: string;
  text: string;
  media?: unknown;
  replyTo?: string | null;
  status: MsgStatus;
  deliveries: DeliveryRecord[];
  reactions: MessageReaction[];
  versions: MessageVersion[];
  moderation?: unknown;
  createdAt: string;
  serverTimestamp: number;
  sequence: number;
}

interface PageData {
  messages: MessageData[];
  nextCursor?: string | null;
}

interface ConversationData {
  id: string;
  name: string;
  avatar: string;
  lastMessage?: string;
  time?: string;
  participantId: string;
  publicKey?: string;
  unread?: number;
}

interface PresenceData {
  status: PresenceVal;
}

interface SendPayload {
  clientId: string;
  senderId: string | undefined;
  receiverId: string;
  conversationId: string | undefined;
  messageType: string;
  ciphertext?: string | null;
  text: string;
  media?: unknown;
  replyTo?: MessageData | null;
  versions?: unknown[];
  serverTimestamp: number;
  sequence: number;
}

interface UploadProgressMap {
  [uploadId: string]: number;
}

interface AIActionParams {
  conversationId: string | undefined;
  messageId?: string;
  text?: string;
}

interface AIAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  api: (p: AIActionParams) => Promise<unknown>;
}

// ---- AI ACTIONS ------------------------------------------------------------

const AI_ACTIONS: Record<string, AIAction> = {
  summarize:      { label: "Summarize Conversation", icon: Bot,         api: (p) => aiApi.summarizeConversation(p) },
  translate:      { label: "Translate",              icon: Languages,   api: (p) => aiApi.translateConversation(p) },
  rewrite:        { label: "Rewrite",                icon: WandSparkles,api: (p) => aiApi.rewriteMessage(p) },
  voiceToText:    { label: "Voice to Text",          icon: Mic,         api: (p) => aiApi.transcribeVoice(p) },
  scheduleMeeting:{ label: "Schedule Meeting",       icon: CalendarDays,api: (p) => aiApi.scheduleMeeting(p) },
  extractAddress: { label: "Extract Address",        icon: MapPin,      api: (p) => aiApi.extractAddress(p) },
  extractPhone:   { label: "Extract Phone",          icon: PhoneCall,   api: (p) => aiApi.extractPhone(p) },
  extractResume:  { label: "Extract Resume",         icon: FileSearch,  api: (p) => aiApi.extractResume(p) },
  extractInvoice: { label: "Extract Invoice",        icon: FileText,    api: (p) => aiApi.extractInvoice(p) },
};

// ---- HELPERS ---------------------------------------------------------------

const cls = (...p: (string | false | null | undefined)[]): string =>
  p.filter(Boolean).join(" ");

function generateClientId(): string {
  return typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ---- CUSTOM HOOKS ----------------------------------------------------------

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useDraft(conversationId: string | undefined): [string, (v: string) => void] {
  const key = `chat-draft:${conversationId}`;
  const [draft, setDraft] = useState("");
  useEffect(() => {
    try { setDraft(localStorage.getItem(key) ?? ""); } catch {}
  }, [key]);
  const save = useCallback((value: string) => {
    setDraft(value);
    try { localStorage.setItem(key, value); } catch {}
  }, [key]);
  return [draft, save];
}

function useCrypto() {
  const encrypt = useCallback(
    async ({ plainText, recipientPublicKey }: { plainText: string; recipientPublicKey?: string }): Promise<string> => {
      return (chatApi as unknown as { e2eeEncrypt?: (p: { plainText: string; recipientPublicKey?: string }) => Promise<string> })
        .e2eeEncrypt?.({ plainText, recipientPublicKey }) ?? plainText;
    },
    [],
  );
  const decrypt = useCallback(
    async ({ cipherText, senderId, conversationId }: { cipherText: string; senderId: string; conversationId?: string }): Promise<string> => {
      return (chatApi as unknown as { e2eeDecrypt?: (p: { cipherText: string; senderId: string; conversationId?: string }) => Promise<string> })
        .e2eeDecrypt?.({ cipherText, senderId, conversationId }) ?? cipherText;
    },
    [],
  );
  return { encrypt, decrypt };
}

interface RateLimiterState {
  count: number;
  ts: number;
  cooldownUntil: number;
}

function useRateLimiter({ limit = 10, windowMs = 5000 }: { limit?: number; windowMs?: number }) {
  const state = useRef<RateLimiterState>({ count: 0, ts: 0, cooldownUntil: 0 });
  const hit = useCallback((): { allowed: boolean; cooldown?: boolean } => {
    const now = Date.now();
    if (state.current.cooldownUntil > now) return { allowed: false, cooldown: true };
    if (now - state.current.ts > windowMs) {
      state.current.ts    = now;
      state.current.count = 0;
    }
    state.current.count += 1;
    if (state.current.count > limit) {
      state.current.cooldownUntil = now + windowMs;
      return { allowed: false, cooldown: true };
    }
    return { allowed: true };
  }, [limit, windowMs]);
  return { hit };
}

function normalizePages(data: InfiniteData<PageData> | undefined): MessageData[] {
  return (data?.pages ?? []).flatMap((p) => p.messages ?? []);
}

function updateMessageById(
  old: InfiniteData<PageData> | undefined,
  id: string,
  patch: Partial<MessageData>,
): InfiniteData<PageData> | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) =>
        m._id === id || m.clientId === id ? { ...m, ...patch } : m,
      ),
    })),
  };
}

function computeDeliveryState(deliveries: DeliveryRecord[] = []): string {
  const byDevice: Record<string, DeliveryRecord> = {};
  for (const d of deliveries) byDevice[d.deviceId] = d;
  const statuses = Object.values(byDevice).map((d) => d.status);
  if (statuses.includes("read"))             return "read";
  if (statuses.includes("delivered"))        return "delivered";
  if (statuses.includes("server_accepted"))  return "server_accepted";
  return "sent";
}

function useMessagesQuery(conversationId: string | undefined) {
  return useInfiniteQuery<PageData, Error, InfiniteData<PageData>, ["messages", string | undefined], string | null>({
    queryKey:       ["messages", conversationId],
    queryFn:        ({ pageParam = null }) => messageApi.getMessages(conversationId, { before: pageParam, limit: 30 }),
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    initialPageParam: null,
    enabled:        !!conversationId,
    staleTime:      30 * 1000,
    gcTime:         15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

function useSendMessageMutation(conversationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<{ offline?: boolean; clientId?: string; message?: MessageData }, Error, SendPayload, { previous: InfiniteData<PageData> | undefined }>({
    mutationFn: async (payload) => {
      if (!navigator.onLine) {
        await enqueueOffline({ id: payload.clientId, conversationId, payload, ts: Date.now() });
        return { offline: true, clientId: payload.clientId };
      }
      return messageApi.sendMessage(payload);
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = qc.getQueryData<InfiniteData<PageData>>(["messages", conversationId]);
      qc.setQueryData<InfiniteData<PageData>>(["messages", conversationId], (old) => {
        if (!old) return old;
        const optimistic: MessageData = {
          _id:             payload.clientId,
          clientId:        payload.clientId,
          senderId:        payload.senderId ?? "",
          conversationId:  conversationId ?? "",
          type:            payload.messageType,
          ciphertext:      payload.ciphertext ?? null,
          text:            payload.text ?? "",
          media:           payload.media ?? null,
          replyTo:         (payload.replyTo as MessageData | null)?._id ?? null,
          status:          MSG_STATUS.QUEUED,
          deliveries:      [],
          versions:        [],
          reactions:       [],
          createdAt:       new Date().toISOString(),
          serverTimestamp: Date.now(),
          sequence:        Date.now(),
        };
        return {
          ...old,
          pages: old.pages.map((page, idx) =>
            idx === old.pages.length - 1
              ? { ...page, messages: [...page.messages, optimistic] }
              : page,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.previous) qc.setQueryData(["messages", conversationId], ctx.previous);
    },
    onSuccess: (data, payload) => {
      if (data?.offline) return;
      if (!data?.message) return;
      qc.setQueryData<InfiniteData<PageData>>(
        ["messages", conversationId],
        (old) => updateMessageById(old, payload.clientId, {
          _id:             data.message!._id,
          status:          data.message!.status ?? MSG_STATUS.SENT,
          serverTimestamp: data.message!.serverTimestamp,
          sequence:        data.message!.sequence,
          deliveries:      data.message!.deliveries ?? [],
        }),
      );
    },
  });
}

interface ChatRealtimeHandlers {
  onReconnect?: () => void;
  onEvent?: (evt: Record<string, unknown>) => void;
}

function useChatRealtime(
  conversationId: string | undefined,
  { onReconnect, onEvent }: ChatRealtimeHandlers,
): React.MutableRefObject<WebSocket | null> {
  const wsRef       = useRef<WebSocket | null>(null);
  const retryRef    = useRef<number>(0);
  const retryTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef    = useRef<boolean>(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (retryTimer.current !== null) clearTimeout(retryTimer.current);
      try { wsRef.current?.close(); } catch {}
    };
  }, []);

  const connect = useCallback(() => {
    if (!conversationId || !aliveRef.current) return;
    const wsBase = import.meta.env.VITE_WS_URL as string;
    const socket = new WebSocket(`${wsBase}/chat/${conversationId}`);
    wsRef.current = socket;

    socket.onopen = () => {
      retryRef.current = 0;
      socket.send(JSON.stringify({ type: "conversation:join", conversationId }));
      socket.send(JSON.stringify({ type: "presence:heartbeat", conversationId }));
      onReconnect?.();
    };

    socket.onmessage = (event: MessageEvent<string>) => {
      try { onEvent?.(JSON.parse(event.data) as Record<string, unknown>); } catch {}
    };

    socket.onclose = () => {
      if (!aliveRef.current) return;
      const delay =
        Math.min(30000, 1000 * (2 ** retryRef.current)) +
        Math.floor(Math.random() * 250);
      retryRef.current += 1;
      retryTimer.current = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      try { socket.close(); } catch {}
    };
  }, [conversationId, onEvent, onReconnect]);

  useEffect(() => {
    connect();
    return () => {
      if (retryTimer.current !== null) clearTimeout(retryTimer.current);
      try { wsRef.current?.close(); } catch {}
    };
  }, [connect]);

  return wsRef;
}

// ---- MAIN COMPONENT --------------------------------------------------------

export default function ChatScreen() {
  const { t }              = useTranslation();
  const { user }           = useAuth();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate           = useNavigate();
  const qc                 = useQueryClient();

  const userRecord = user as Record<string, unknown> | null;
  const userId =
    (userRecord?.["_id"] as string | undefined) ??
    (userRecord?.["id"]  as string | undefined) ??
    "";

  const { encrypt, decrypt } = useCrypto();
  const rateLimiter = useRateLimiter({ limit: 10, windowMs: 5000 });

  const [search,        setSearch]        = useState("");
  const [scope,         setScope]         = useState<SearchScope>(SEARCH_SCOPE.ALL);
  const debouncedSearch  = useDebouncedValue(search, 300);
  const deferredSearch   = useDeferredValue(debouncedSearch);

  const [composer,      setComposer]      = useState("");
  const [draft,         saveDraft]        = useDraft(conversationId);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActive = useRef<boolean>(false);
  const lastReadIdRef= useRef<string | null>(null);

  const [uploadProgress,  setUploadProgress]  = useState<UploadProgressMap>({});
  const [replyTo,          setReplyTo]         = useState<MessageData | null>(null);
  const [selectedMessage,  setSelectedMessage] = useState<MessageData | null>(null);
  const [presenceState,    setPresenceState]   = useState<PresenceVal>(PRESENCE.ONLINE);
  const [searchResults,    setSearchResults]   = useState<unknown[]>([]);
  const [pushEnabled,      setPushEnabled]     = useState(false);

  // ---- QUERIES & MUTATIONS -------------------------------------------------

  const conversationsQuery = useQuery({
    queryKey:         ["conversations", deferredSearch],
    queryFn:          () => conversationApi.list({ search: deferredSearch, limit: 20 }),
    staleTime:        60 * 1000,
    gcTime:           10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const currentConversation = useMemo((): ConversationData | null => {
    const list = (conversationsQuery.data as { conversations?: ConversationData[] } | undefined)?.conversations ?? [];
    return list.find((c) => String(c.id) === String(conversationId)) ?? null;
  }, [conversationsQuery.data, conversationId]);

  const messagesQuery  = useMessagesQuery(conversationId);
  const sendMutation   = useSendMessageMutation(conversationId);
  const rawMessages    = useMemo(() => normalizePages(messagesQuery.data), [messagesQuery.data]);
  const allMessages    = useMemo(() => rawMessages, [rawMessages]);

  const markRead = useCallback((messageId: string) => {
    if (!conversationId || !messageId) return;
    if (lastReadIdRef.current === messageId) return;
    lastReadIdRef.current = messageId;
    presenceApi.markRead(conversationId, { lastMessageId: messageId }).catch(() => {});
  }, [conversationId]);

  // ---- REALTIME SOCKET -----------------------------------------------------

  const socketRef = useChatRealtime(conversationId, {
    onReconnect: () => {
      qc.invalidateQueries({ queryKey: ["messages",  conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["presence",  conversationId] });
    },
    onEvent: (evt) => {
      const type = evt["type"] as string;

      if (type === SOCKET_EVENTS.MESSAGE_NEW) {
        const msg = evt["message"] as MessageData;
        qc.setQueryData<InfiniteData<PageData>>(["messages", conversationId], (old) => {
          if (!old) return old;
          const exists = normalizePages(old).some(
            (m) => m._id === msg._id || m.clientId === msg.clientId,
          );
          if (exists) return old;
          return {
            ...old,
            pages: old.pages.map((page, idx) =>
              idx === old.pages.length - 1
                ? { ...page, messages: [...page.messages, msg] }
                : page,
            ),
          };
        });
      }

      if (
        type === SOCKET_EVENTS.MESSAGE_DELIVERED ||
        type === SOCKET_EVENTS.MESSAGE_READ
      ) {
        const deliveries = (evt["deliveries"] as DeliveryRecord[] | undefined) ?? [];
        qc.setQueryData<InfiniteData<PageData>>(
          ["messages", conversationId],
          (old) => updateMessageById(old, evt["messageId"] as string, {
            deliveries,
            status: computeDeliveryState(deliveries) as MsgStatus,
          }),
        );
      }

      if (type === SOCKET_EVENTS.MESSAGE_REACTION) {
        qc.setQueryData<InfiniteData<PageData>>(
          ["messages", conversationId],
          (old) => updateMessageById(old, evt["messageId"] as string, {
            reactions: (evt["reactions"] as MessageReaction[] | undefined) ?? [],
          }),
        );
      }

      if (type === SOCKET_EVENTS.MESSAGE_EDIT) {
        qc.setQueryData<InfiniteData<PageData>>(
          ["messages", conversationId],
          (old) => updateMessageById(old, evt["messageId"] as string, evt["patch"] as Partial<MessageData>),
        );
      }

      if (type === SOCKET_EVENTS.MESSAGE_VERSION) {
        qc.setQueryData<InfiniteData<PageData>>(
          ["messages", conversationId],
          (old) => updateMessageById(old, evt["messageId"] as string, {
            versions: (evt["versions"] as MessageVersion[] | undefined) ?? [],
          }),
        );
      }

      if (type === SOCKET_EVENTS.PRESENCE_UPDATE) {
        const presence = evt["presence"] as PresenceData | undefined;
        setPresenceState((presence?.status ?? PRESENCE.OFFLINE) as PresenceVal);
        qc.setQueryData(["presence", conversationId], presence);
      }

      if (type === SOCKET_EVENTS.AI_MODERATION) {
        qc.setQueryData<InfiniteData<PageData>>(
          ["messages", conversationId],
          (old) => updateMessageById(old, evt["messageId"] as string, {
            moderation: evt["moderation"],
          }),
        );
      }
    },
  });

  // ---- EFFECTS -------------------------------------------------------------

  useEffect(() => {
    setComposer(draft || "");
  }, [draft]);

  useEffect(() => {
    qc.setQueryData(
      ["messages", conversationId],
      (old: InfiniteData<PageData> | undefined) => old ?? messagesQuery.data ?? undefined,
    );
  }, [rawMessages, conversationId, messagesQuery.data, qc]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const decrypted = await Promise.all(
        rawMessages.map(async (m) => {
          if (!m.ciphertext) return m;
          const plainText = await decrypt({
            cipherText: m.ciphertext,
            senderId: m.senderId,
            conversationId,
          });
          return { ...m, plainText };
        }),
      );
      if (mounted) {
        qc.setQueryData(["messages-decrypted", conversationId], decrypted);
      }
    })();
    return () => { mounted = false; };
  }, [rawMessages, decrypt, conversationId, qc]);

  const decryptedMessages: MessageData[] =
    (qc.getQueryData<MessageData[]>(["messages-decrypted", conversationId])) ?? rawMessages;

  // ---- HANDLERS ------------------------------------------------------------

  const onTyping = useCallback((value: string) => {
    setComposer(value);
    saveDraft(value);

    if (!typingActive.current && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "typing:start", conversationId }));
      typingActive.current = true;
    }

    if (typingTimer.current !== null) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "typing:stop", conversationId }));
      }
      typingActive.current = false;
    }, 5000);
  }, [conversationId, saveDraft, socketRef]);

  const runAIAction = useCallback(async (key: string) => {
    const action = AI_ACTIONS[key];
    if (!action) return;
    return action.api({
      conversationId,
      messageId: selectedMessage?._id,
      text: selectedMessage?.plainText ?? selectedMessage?.text ?? "",
    });
  }, [conversationId, selectedMessage]);

  const sendText = useCallback(async () => {
    const text = composer.trim();
    if (!text || !conversationId || !currentConversation) return;

    const limiter = rateLimiter.hit();
    if (!limiter.allowed) return;

    const modApi = moderationApi as unknown as {
      moderateText?: (p: { text: string; conversationId?: string; senderId?: string }) => Promise<{ action: string }>;
    };

    const clientModeration = await modApi.moderateText?.({ text }).catch(() => ({ action: "allow" }));
    if (clientModeration?.action === "block") {
      qc.setQueryData(["chat-notice", conversationId], {
        type: "blocked_by_ai",
        moderation: clientModeration,
      });
      return;
    }

    const encrypted = await encrypt({
      plainText: text,
      recipientPublicKey: currentConversation.publicKey,
    });
    const clientId = generateClientId();
    setComposer("");
    saveDraft("");

    await sendMutation.mutateAsync({
      clientId,
      senderId:        userId,
      receiverId:      currentConversation.participantId,
      conversationId,
      messageType:     "text",
      ciphertext:      encrypted,
      text:            "",
      replyTo,
      versions:        [],
      serverTimestamp: Date.now(),
      sequence:        Date.now(),
    });

    await modApi
      .moderateText?.({ text, conversationId, senderId: userId })
      .catch(() => ({}));

    setReplyTo(null);
  }, [
    composer, conversationId, currentConversation, encrypt, qc,
    rateLimiter, replyTo, saveDraft, sendMutation, userId,
  ]);

  const handleUpload = useCallback(async (file: File) => {
    if (!conversationId || !currentConversation) return;
    const uploadId = generateClientId();
    setUploadProgress((prev) => ({ ...prev, [uploadId]: 1 }));

    try {
      const prep      = await attachmentApi.prepare(file, { conversationId }) as { checksum?: string } | null;
      const checksum  = prep?.checksum ?? null;

      const uploaded  = await (attachmentApi.uploadChunked as (
        file: File,
        opts: { checksum: string | null; onProgress: (e: { loaded: number; total?: number }) => void },
      ) => Promise<{ type?: string }>)(file, {
        checksum,
        onProgress: (e) => {
          if (e.total) {
            setUploadProgress((prev) => ({
              ...prev,
              [uploadId]: Math.round((e.loaded / e.total!) * 100),
            }));
          }
        },
      });

      await sendMutation.mutateAsync({
        clientId:        uploadId,
        senderId:        userId,
        receiverId:      currentConversation.participantId,
        conversationId,
        messageType:     uploaded.type ?? "document",
        media:           uploaded,
        text:            "",
        serverTimestamp: Date.now(),
        sequence:        Date.now(),
      });

      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[uploadId];
        return next;
      });
    } catch {
      setUploadProgress((prev) => ({ ...prev, [uploadId]: -1 }));
      await enqueueOffline({ id: uploadId, fileName: file.name, ts: Date.now() });
    }
  }, [conversationId, currentConversation, sendMutation, userId]);

  const loadPrevious = useCallback(() => {
    if (messagesQuery.hasNextPage) void messagesQuery.fetchNextPage();
  }, [messagesQuery]);

  const handleSearch = useCallback(async () => {
    const result = await (searchApi.search as (p: { q: string; scope: SearchScope; conversationId?: string }) => Promise<{ items?: unknown[] }>)({
      q:     search,
      scope,
      conversationId,
    }).catch(() => ({ items: [] as unknown[] }));
    setSearchResults(result.items ?? []);
  }, [search, scope, conversationId]);

  useEffect(() => {
    if (deferredSearch?.trim()) void handleSearch();
    else setSearchResults([]);
  }, [deferredSearch, handleSearch]);

  useEffect(() => {
    const heartbeat = setInterval(() => {
      presenceApi.heartbeat({ conversationId, status: presenceState }).catch(() => {});
    }, 30000);
    return () => clearInterval(heartbeat);
  }, [conversationId, presenceState]);

  useEffect(() => {
    const bg = () => {
      if (document.hidden) {
        (notificationApi as unknown as { setBadge?: (p: { count: number }) => Promise<void> })
          .setBadge?.({ count: 1 }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", bg);
    return () => document.removeEventListener("visibilitychange", bg);
  }, []);

  const filePreview = useMemo(() => searchResults, [searchResults]);

  // ---- RENDER --------------------------------------------------------------

  if (!currentConversation) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  const conversations: ConversationData[] =
    (conversationsQuery.data as { conversations?: ConversationData[] } | undefined)?.conversations ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-white grid lg:grid-cols-[360px_1fr_320px]">
      {/* LEFT — conversation list */}
      <aside className="border-r border-white/10 min-h-screen">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-black text-lg">Messages</h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/5 pl-10 pr-3 py-2 text-sm outline-none border border-white/10"
              placeholder="Search anything"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.values(SEARCH_SCOPE).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cls("px-3 py-1 rounded-full text-xs", scope === s ? "bg-amber-400 text-slate-950" : "bg-white/5")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(100vh-110px)]">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/chat/${c.id}`)}
              className={cls(
                "w-full p-4 text-left border-b border-white/10",
                String(currentConversation.id) === String(c.id) ? "bg-white/5" : "",
              )}
            >
              <div className="flex items-center gap-3">
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="h-11 w-11 rounded-full object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold truncate">{c.name}</p>
                    <span className="text-[10px] text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{c.lastMessage}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* CENTER — messages */}
      <section className="flex flex-col min-h-screen">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-slate-950/95 backdrop-blur">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white/5">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <img
              src={currentConversation.avatar}
              className="h-10 w-10 rounded-full object-cover"
              alt={currentConversation.name}
              loading="lazy"
            />
            <div>
              <p className="font-bold">{currentConversation.name}</p>
              <p className="text-xs text-emerald-400">
                {presenceState} · E2EE plaintext only on device
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="p-2 rounded-lg bg-white/5"><Phone className="h-4 w-4" /></button>
            <button type="button" className="p-2 rounded-lg bg-white/5"><Video className="h-4 w-4" /></button>
            <button type="button" className="p-2 rounded-lg bg-white/5"><MoreVertical className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <VirtualizedMessageList
            messages={decryptedMessages}
            currentUserId={userId}
            loadPrevious={loadPrevious}
            onVisibleLastMessage={(id: string) => markRead(id)}
            onReply={(m: MessageData) => setReplyTo(m)}
            onSelectMessage={(m: MessageData) => setSelectedMessage(m)}
          />
        </div>

        <footer className="border-t border-white/10 p-3 bg-slate-950/95">
          <div className="flex items-end gap-2">
            <button type="button" className="p-2 rounded-xl bg-white/5"><Plus className="h-4 w-4" /></button>
            <button type="button" className="p-2 rounded-xl bg-white/5"><Camera className="h-4 w-4" /></button>
            <button type="button" className="p-2 rounded-xl bg-white/5"><Paperclip className="h-4 w-4" /></button>
            <input
              value={composer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTyping(e.target.value)}
              placeholder="Type a message"
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => void sendText()}
              className="p-3 rounded-2xl bg-amber-400 text-slate-950"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{typingActive.current ? "typing..." : "ready"}</span>
            <span>Push / badge / background sync / APNS / FCM / Web Push</span>
          </div>
        </footer>
      </section>

      {/* RIGHT — AI assistant */}
      <aside className="border-l border-white/10 hidden xl:flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-black">AI Assistant</h3>
        </div>
        <div className="p-4 grid gap-2">
          {Object.entries(AI_ACTIONS).map(([key, a]) => (
            <button
              key={key}
              type="button"
              onClick={() => void runAIAction(key)}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm"
            >
              <a.icon className="h-4 w-4" /> {a.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 grid gap-2">
          <button type="button" className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
            <Building2 className="h-4 w-4" /> Enterprise Broadcast
          </button>
          <button type="button" className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
            <ShieldAlert className="h-4 w-4" /> Audit Logs
          </button>
          <button type="button" className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm">
            <Bell className="h-4 w-4" /> Notifications
          </button>
        </div>
      </aside>
    </main>
  );
}