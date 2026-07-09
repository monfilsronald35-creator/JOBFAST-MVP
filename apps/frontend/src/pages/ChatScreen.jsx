import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Mic, MicOff, Send, Phone, Video, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEMO_CHATS = [
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
];

function ChatList({ onSelect, selected }) {
  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-base font-bold text-white">Mesaj yo</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {DEMO_CHATS.map(chat => (
          <button
            key={chat.id}
            type="button"
            onClick={() => onSelect(chat)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/50 text-left transition ${
              selected?.id === chat.id ? "bg-amber-500/10" : "hover:bg-slate-800/40"
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-11 h-11 rounded-full border-2 border-slate-700 object-cover"
              />
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
        ))}
      </div>
    </div>
  );
}

function ChatWindow({ chat, currentUser, onBack }) {
  const [messages, setMessages] = useState([
    { id: 1, from: chat.id, text: "Bonjou! Mwen wè ou ap chèche yon " + chat.role + "?", time: "16:00" },
    { id: 2, from: "me", text: "Wi, mwen bezwen yon travay.", time: "16:01" },
    { id: 3, from: chat.id, text: chat.lastMessage, time: chat.time },
  ]);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages(prev => [...prev, { id: Date.now(), from: "me", text: input.trim(), time }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        from: chat.id,
        text: "OK, mwen resevwa mesaj ou a. Map rele ou talè.",
        time: `${now.getHours()}:${String(now.getMinutes() + 1).padStart(2, "0")}`,
      }]);
    }, 1500);
  }, [input, chat.id]);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        const now = new Date();
        const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
        setMessages(prev => [...prev, {
          id: Date.now(),
          from: "me",
          type: "audio",
          audioUrl: URL.createObjectURL(blob),
          time,
        }]);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      alert("Pèmèt mikwofòn pou voye mesaj vwa.");
    }
  }, [recording]);

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-3 bg-[#0f172a] border-b border-slate-800 shrink-0">
        <button type="button" onClick={onBack} className="p-1.5 text-slate-400 hover:text-white transition md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={chat.avatar} alt={chat.name} className="w-9 h-9 rounded-full border border-slate-600 object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{chat.name}</p>
          <p className="text-[10px] text-amber-400">{chat.role} · {chat.online ? "Online" : "Offline"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="p-2 text-slate-400 hover:text-amber-400 transition">
            <Phone className="w-4 h-4" />
          </button>
          <button type="button" className="p-2 text-slate-400 hover:text-amber-400 transition">
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => {
          const isMe = msg.from === "me";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <img src={chat.avatar} alt="" className="w-7 h-7 rounded-full mr-2 self-end object-cover shrink-0" />
              )}
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                {msg.type === "audio" ? (
                  <div className={`rounded-2xl px-3 py-2 ${isMe ? "bg-amber-500 rounded-br-sm" : "bg-slate-800 rounded-bl-sm"}`}>
                    <audio src={msg.audioUrl} controls className="h-8 max-w-[180px]" />
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
                <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-[#0f172a] shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 ${
              recording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-slate-800 text-slate-400 hover:text-amber-400"
            }`}
            aria-label={recording ? "Kanpe anrejistreman" : "Voye mesaj vwa"}
          >
            {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={recording ? "Ap anrejistre..." : "Ekri yon mesaj..."}
            disabled={recording}
            className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-full px-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/50 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || recording}
            className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center disabled:opacity-40 active:scale-95 transition shrink-0"
            aria-label="Voye"
          >
            <Send className="w-4 h-4 text-slate-950" />
          </button>
        </div>
        {recording && (
          <p className="text-center text-xs text-red-400 mt-1.5 animate-pulse">
            🔴 Ap anrejistre... klike ankò pou kanpe
          </p>
        )}
      </div>
    </div>
  );
}

export default function ChatScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="h-[calc(100vh-7rem)] flex overflow-hidden">
      {/* Sidebar list — always visible on desktop, hidden on mobile when chat open */}
      <div className={`${selectedChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-slate-800 shrink-0`}>
        <ChatList onSelect={setSelectedChat} selected={selectedChat} />
      </div>

      {/* Chat window */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          <ChatWindow
            chat={selectedChat}
            currentUser={user}
            onBack={() => setSelectedChat(null)}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-slate-500 text-sm flex-col gap-2">
          <span className="text-4xl">💬</span>
          <p className="font-medium">Chwazi yon konvèsasyon</p>
        </div>
      )}
    </div>
  );
}
