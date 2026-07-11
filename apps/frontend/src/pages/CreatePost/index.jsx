import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { X, Camera, Video, Megaphone, Image, Upload, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { addPost } from "../../services/social";
import API from "../../api/axios";

const BG     = "#050B18";
const CARD   = "#111827";
const BORDER = "#1F2937";
const GOLD   = "#FACC15";

const POST_TYPES = [
  {
    id: "photo",
    icon: "📷",
    label: "Photo",
    sublabel: "Pataje foto travay ou",
    accent: "#10b981",
  },
  {
    id: "video",
    icon: "🎥",
    label: "Vidéo",
    sublabel: "30 – 60 segonn",
    accent: "#6366f1",
  },
  {
    id: "promotion",
    icon: "📢",
    label: "Pwomosyon",
    sublabel: "Reklame sèvis ou",
    accent: GOLD,
  },
];

export default function CreatePostScreen() {
  const navigate      = useNavigate();
  const { t }         = useTranslation();
  const { user }      = useAuth();
  const fileInputRef  = useRef(null);
  const videoInputRef = useRef(null);

  const [step,     setStep]     = useState("choose"); // choose | compose
  const [postType, setPostType] = useState(null);
  const [caption,  setCaption]  = useState("");
  const [media,    setMedia]    = useState(null);   // { url, type }
  const [posting,  setPosting]  = useState(false);
  const [done,     setDone]     = useState(false);

  function handleTypeSelect(type) {
    setPostType(type);
    setStep("compose");
    if (type === "photo") fileInputRef.current?.click();
    if (type === "video") videoInputRef.current?.click();
  }

  function handleFileChange(e, mediaType) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMedia({ url, type: mediaType, file });
  }

  async function handlePost() {
    setPosting(true);
    const myId = String(user?._id || user?.id || '');
    const postData = {
      id: `post_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      userId: myId,
      userName: user?.name || '',
      userAvatar: user?.profileMetadata?.profilePhoto || '',
      type: postType,
      mediaUrl: media?.url || '',
      caption: caption.trim(),
      audience: 'public',
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Persist to localStorage immediately
    addPost(postData);

    // Background sync to API
    API.post('/posts', { type: postType, mediaUrl: media?.url || '', caption: caption.trim(), audience: 'public' })
      .catch(() => {});

    await new Promise(r => setTimeout(r, 800));
    setPosting(false);
    setDone(true);
    setTimeout(() => navigate("/dashboard"), 1500);
  }

  const accent = POST_TYPES.find(p => p.id === postType)?.accent || GOLD;

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: BG }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ background: `${accent}20`, border: `2px solid ${accent}` }}>
          ✅
        </div>
        <p className="text-lg font-black text-white">Post pibliye!</p>
        <p className="text-xs text-slate-400">Ap retounen nan akeyi…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: BORDER }}>
        <button type="button" onClick={() => step === "compose" ? setStep("choose") : navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: CARD }}>
          <X className="w-4 h-4 text-slate-400" />
        </button>
        <h1 className="text-sm font-black text-white">
          {step === "choose" ? "Sa ou vle pataje?" : POST_TYPES.find(p => p.id === postType)?.label}
        </h1>
        <div className="w-9" />
      </div>

      {/* STEP 1 — choose type */}
      {step === "choose" && (
        <div className="flex-1 px-4 py-6 flex flex-col gap-3">
          <p className="text-xs text-slate-400 mb-2">Chwazi kalite post ou vle kreye:</p>
          {POST_TYPES.map(pt => (
            <button key={pt.id} type="button"
              onClick={() => handleTypeSelect(pt.id)}
              className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-[0.98]"
              style={{ background: CARD, borderColor: BORDER }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: `${pt.accent}18`, border: `1px solid ${pt.accent}30` }}>
                {pt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white">{pt.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{pt.sublabel}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* STEP 2 — compose */}
      {step === "compose" && (
        <div className="flex-1 px-4 py-5 flex flex-col gap-4">

          {/* Media preview */}
          {postType === "photo" && (
            <div>
              {media ? (
                <div className="relative rounded-2xl overflow-hidden aspect-square"
                  style={{ border: `1px solid ${BORDER}` }}>
                  <img src={media.url} alt="preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setMedia(null)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed"
                  style={{ borderColor: BORDER, background: CARD }}>
                  <Image className="w-10 h-10 text-slate-600" />
                  <span className="text-xs text-slate-500">Tape pou chwazi foto</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFileChange(e, "image")} />
            </div>
          )}

          {postType === "video" && (
            <div>
              {media ? (
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${BORDER}` }}>
                  <video src={media.url} className="w-full rounded-2xl" controls />
                  <button type="button" onClick={() => setMedia(null)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => videoInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 border-dashed"
                  style={{ borderColor: BORDER, background: CARD }}>
                  <Video className="w-10 h-10 text-slate-600" />
                  <span className="text-xs text-slate-500">Tape pou chwazi vidéo (30–60 sek)</span>
                </button>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                onChange={e => handleFileChange(e, "video")} />
            </div>
          )}

          {postType === "promotion" && (
            <div className="h-28 rounded-2xl flex items-center justify-center"
              style={{ background: `${GOLD}12`, border: `1px dashed ${GOLD}40` }}>
              <div className="text-center">
                <span className="text-3xl">📢</span>
                <p className="text-xs text-amber-400 mt-1 font-bold">Pwomosyon Tèks</p>
              </div>
            </div>
          )}

          {/* Caption */}
          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder={
                postType === "promotion"
                  ? "Dekri pwomosyon ou an… Pri, sèvis, kote…"
                  : "Ekri yon kaptèn…"
              }
              rows={4}
              maxLength={500}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
            />
            <p className="text-[10px] text-slate-600 text-right mt-1">{caption.length}/500</p>
          </div>

          {/* Audience */}
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <span className="text-lg">🌍</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Piblik</p>
              <p className="text-[10px] text-slate-500">Tout moun ka wè sa</p>
            </div>
          </div>

          {/* Publish button */}
          <button type="button"
            onClick={handlePost}
            disabled={posting || (postType !== "promotion" && !media && !caption.trim())}
            className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: accent, color: postType === "promotion" ? "#0f172a" : "white" }}>
            {posting ? "Ap pibliye…" : `${POST_TYPES.find(p => p.id === postType)?.icon} Pibliye`}
          </button>
        </div>
      )}
    </div>
  );
}
