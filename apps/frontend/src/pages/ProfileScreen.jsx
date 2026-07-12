import React, { useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import WorkerContent, { WORKER_TABS } from "./worker/WorkerDashboard";
import {
  Camera, Edit3, Save, X, Star, Shield, Briefcase,
  Bell, History, LogOut, ChevronRight, MapPin,
  Play, MessageCircle, DollarSign, Eye,
} from "lucide-react";

const BG    = "#050B18";
const CARD  = "#0d1526";
const GOLD  = "#FACC15";
const BORDER = "#1F2937";

// ── Country code map ─────────────────────────────────────────────────────────
const COUNTRY_CODE_MAP = {
  ht:"ht",ayiti:"ht",haiti:"ht","haïti":"ht","haití":"ht",
  do:"do","repiblik dominikèn":"do","dominican republic":"do","rep. dominicana":"do","rép. dominicaine":"do","republica dominicana":"do",
  us:"us",etazini:"us","united states":"us","estados unidos":"us",
  ca:"ca",kanada:"ca",canada:"ca",
  fr:"fr",frans:"fr",france:"fr",francia:"fr",
  mx:"mx",meksik:"mx",mexico:"mx","méxico":"mx",
  br:"br",brezil:"br",brazil:"br",brasil:"br",
  es:"es",espay:"es",spain:"es","españa":"es",
  gb:"gb","wayòm ini":"gb","united kingdom":"gb","reino unido":"gb",
  pt:"pt","pòtigal":"pt",portugal:"pt",
};
function resolveCountryCode(raw) {
  if (!raw) return null;
  return COUNTRY_CODE_MAP[raw.toLowerCase().trim()] || null;
}

export const ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  EDIT_PROFILE: "/edit-profile",
  SETTINGS: "/settings",
  JOB_HISTORY: "/job-history",
  NOTIFICATIONS: "/notifications",
  LOGIN: "/login",
  CHAT: "/chat",
};

function trustScore(user) {
  let score = 40;
  if (user?.profileMetadata?.profilePhoto) score += 20;
  if (user?.profileMetadata?.bio)           score += 15;
  if (user?.phone)                           score += 15;
  if (user?.verified)                        score += 10;
  return Math.min(score, 100);
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ icon, value, label, color = "text-amber-400" }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1">
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <span className="text-lg font-black">{value}</span>
      </div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

function TrustBar({ score, t }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? GOLD : "#f97316";
  const msg   = score < 60 ? t("profile.trustLow","Verifye kont ou pou monte nivo")
              : score < 80 ? t("profile.trustMid","Bon nivo — ajoute plis enfòmasyon")
              :               t("profile.trustHigh","Ekselan! Ou gen konfyans maksimòm");
  return (
    <div className="p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4" style={{ color }} />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t("profile.trustLevel","Nivo Konfyans")}
          </span>
        </div>
        <span className="text-sm font-black" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-1.5">{msg}</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

function ProfileScreen() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const { user, login: updateSession, logout } = useAuth();
  const fileRef   = useRef(null);
  const videoRef  = useRef(null);

  const [activeTab,  setActiveTab]  = useState("main");
  const [editing,    setEditing]    = useState(false);
  const [editName,   setEditName]   = useState(user?.name || "");
  const [editBio,    setEditBio]    = useState(user?.profileMetadata?.bio || "");
  const [editPhoto,  setEditPhoto]  = useState(user?.profileMetadata?.profilePhoto || "");
  const [editRate,   setEditRate]   = useState(user?.profileMetadata?.hourlyRate || "");
  const [editVideo,  setEditVideo]  = useState(user?.profileMetadata?.promoVideo || "");
  const [saving,     setSaving]     = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const avatarSrc = useMemo(() =>
    editPhoto || user?.profileMetadata?.profilePhoto ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "user")}`,
    [editPhoto, user]
  );

  // ── Photo picker ──────────────────────────────────────────────
  const handlePhotoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Video picker ──────────────────────────────────────────────
  const handleVideoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditVideo(url);
  }, []);

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const updated = {
      ...user,
      name: editName.trim(),
      profileMetadata: {
        ...(user?.profileMetadata || {}),
        bio:         editBio.trim(),
        profilePhoto: editPhoto || user?.profileMetadata?.profilePhoto || "",
        hourlyRate:  editRate.trim(),
        promoVideo:  editVideo,
      },
    };
    try {
      await API.patch("/users/profile", {
        name:        updated.name,
        bio:         updated.profileMetadata.bio,
        profilePhoto: updated.profileMetadata.profilePhoto,
        hourlyRate:  updated.profileMetadata.hourlyRate,
      });
    } catch {}
    updateSession(updated);
    setSaving(false);
    setEditing(false);
  }, [editName, editBio, editPhoto, editRate, editVideo, user, updateSession]);

  const handleCancel = useCallback(() => {
    setEditName(user?.name || "");
    setEditBio(user?.profileMetadata?.bio || "");
    setEditPhoto(user?.profileMetadata?.profilePhoto || "");
    setEditRate(user?.profileMetadata?.hourlyRate || "");
    setEditVideo(user?.profileMetadata?.promoVideo || "");
    setEditing(false);
  }, [user]);

  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400" style={{ background: BG }}>
        {t("profile.loading","Ap chaje...")}
      </div>
    );
  }

  const countryCode    = resolveCountryCode(user.location?.country || "");
  const countryDisplay = countryCode ? t(`country.${countryCode}`, "") : "";
  const locationLabel  = user.location?.city
    ? [user.location.city, countryDisplay].filter(Boolean).join(", ")
    : countryDisplay;

  const rating    = user.stats?.rating ?? 5.0;
  const jobsDone  = user.stats?.totalJobs ?? 0;
  const walletBal = user.walletBalance ?? 0;
  const trust     = trustScore(user);
  const bio       = editing ? editBio : (user?.profileMetadata?.bio || "");
  const promoVideo = editing ? editVideo : (user?.profileMetadata?.promoVideo || "");
  const hourlyRate = editing ? editRate : (user?.profileMetadata?.hourlyRate || "");
  const skills     = user?.stats?.skills || user?.skills || [];

  const inputCls = "w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/50";

  return (
    <div className="w-full flex flex-col min-h-screen pb-28 text-slate-100" style={{ background: BG }}>

      {/* ── EDIT TOOLBAR (sticky top) ─────────────────────────── */}
      {editing && (
        <div className="sticky top-14 z-30 flex items-center justify-between px-4 py-2 border-b"
          style={{ background: BG, borderColor: BORDER }}>
          <span className="text-xs font-bold text-amber-400">✏️ Mòd Edisyon</span>
          <div className="flex gap-2">
            <button type="button" onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
              <X className="w-3.5 h-3.5" /> Anile
            </button>
            <button type="button" onClick={handleSave}
              disabled={saving || !editName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black disabled:opacity-50"
              style={{ background: GOLD, color: "#0a0f1a" }}>
              <Save className="w-3.5 h-3.5" />
              {saving ? "Ap sove..." : "Sove"}
            </button>
          </div>
        </div>
      )}

      {/* ── VIDEO HERO ────────────────────────────────────────── */}
      <div className="relative w-full" style={{ aspectRatio: "16/9", background: "#0a0f1a", maxHeight: 260 }}>
        {promoVideo ? (
          <>
            <video
              ref={videoRef}
              src={promoVideo}
              className="w-full h-full object-cover"
              playsInline
              poster={avatarSrc}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => setVideoPlaying(false)}
              controls={videoPlaying}
            />
            {!videoPlaying && (
              <button type="button"
                onClick={() => videoRef.current?.play()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px]">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: `${GOLD}22`, border: `2px solid ${GOLD}` }}>
                  <Play className="w-7 h-7 fill-current" style={{ color: GOLD, marginLeft: 3 }} />
                </div>
                <span className="text-xs font-bold text-white/80">Videyo Pwomosyonèl</span>
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3"
            style={{ background: "linear-gradient(135deg, #0d1526 0%, #111827 60%, #1a1f35 100%)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: `${GOLD}15`, border: `1.5px dashed ${GOLD}50` }}>
              <Play className="w-7 h-7" style={{ color: `${GOLD}80`, marginLeft: 3 }} />
            </div>
            <p className="text-xs text-slate-500 text-center px-8">Ajoute yon videyo pwomosyonèl (30 sek)</p>
            {editing && (
              <button type="button"
                onClick={() => document.getElementById('jf-video-input')?.click()}
                className="text-[11px] font-bold px-4 py-1.5 rounded-xl border"
                style={{ color: GOLD, borderColor: `${GOLD}40`, background: `${GOLD}10` }}>
                + Chwazi Videyo
              </button>
            )}
          </div>
        )}

        {/* Edit video overlay */}
        {editing && (
          <button type="button"
            onClick={() => document.getElementById('jf-video-input')?.click()}
            className="absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/60 border border-white/20 text-white backdrop-blur-sm">
            ✏️ {promoVideo ? "Chanje" : "Ajoute"} Videyo
          </button>
        )}
        <input id="jf-video-input" type="file" accept="video/*" className="hidden"
          onChange={handleVideoSelect} />
      </div>

      {/* ── PROFILE HERO CARD (overlaps video bottom) ─────────── */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="rounded-3xl border p-5" style={{ background: CARD, borderColor: BORDER }}>

          <div className="flex items-end gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img src={editing ? (editPhoto || avatarSrc) : avatarSrc}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 shadow-2xl"
                style={{ borderColor: BG }} />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2"
                style={{ borderColor: CARD }} />
              {editing && (
                <button type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={handlePhotoSelect} />
            </div>

            {/* Name + title */}
            <div className="flex-1 min-w-0 pb-1">
              {editing ? (
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  maxLength={50} placeholder="Non ou..."
                  className={`${inputCls} text-base font-bold mb-1`} />
              ) : (
                <h2 className="text-xl font-black text-white leading-tight truncate">{user.name}</h2>
              )}
              <p className="text-xs font-black uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
                {user.profession || user.role || "Pwofesyonèl"}
              </p>
              {locationLabel && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="text-[11px] text-slate-500">{locationLabel}</span>
                </div>
              )}
              {user.verified && (
                <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] font-bold text-emerald-400">
                  ✓ Verifye
                </span>
              )}
            </div>

            {/* Edit button (non-editing mode) */}
            {!editing && (
              <button type="button" onClick={() => setEditing(true)}
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{ background: `${GOLD}15`, borderColor: `${GOLD}40` }}>
                <Edit3 className="w-4 h-4" style={{ color: GOLD }} />
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-b mb-4" style={{ borderColor: BORDER }}>
            <StatPill
              icon={<Star className="w-4 h-4 fill-current" />}
              value={Number(rating).toFixed(1)}
              label={t("profile.rating","Nòt")}
              color="text-amber-400"
            />
            <div className="border-l border-r" style={{ borderColor: BORDER }}>
              <StatPill
                icon={<Briefcase className="w-4 h-4" />}
                value={jobsDone}
                label={t("profile.jobsDone","Travay")}
                color="text-emerald-400"
              />
            </div>
            <StatPill
              icon={<Shield className="w-4 h-4" />}
              value={`${trust}%`}
              label="Konfyans"
              color="text-blue-400"
            />
          </div>

          {/* Hourly rate */}
          {editing ? (
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 shrink-0 text-slate-500" />
              <input value={editRate}
                onChange={e => setEditRate(e.target.value)}
                placeholder="Pri pa èd (egzanp: 25 USD/è)"
                className={inputCls} />
            </div>
          ) : hourlyRate ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30` }}>
              <DollarSign className="w-4 h-4" style={{ color: GOLD }} />
              <span className="text-sm font-black" style={{ color: GOLD }}>{hourlyRate}</span>
            </div>
          ) : editing ? null : (
            <button type="button" onClick={() => setEditing(true)}
              className="w-full text-[11px] text-slate-600 py-2 border border-dashed rounded-xl"
              style={{ borderColor: BORDER }}>
              + Ajoute pri ou (egzanp: $25/è)
            </button>
          )}
        </div>
      </div>

      {/* ── TABS (worker role) ────────────────────────────────── */}
      {user?.role === "worker" && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pt-3 pb-1" style={{ scrollbarWidth:"none" }}>
          <button type="button" onClick={() => setActiveTab("main")}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "main"
                ? "text-slate-950 font-black" : "bg-slate-800 text-slate-400"
            }`}
            style={activeTab === "main" ? { background: GOLD } : {}}>
            ⚙️ {t("profile.settingsTab","Pwofil")}
          </button>
          {WORKER_TABS.filter(wt => wt.id !== "overview").map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? "text-slate-950 font-black" : "bg-slate-800 text-slate-400"
              }`}
              style={activeTab === tab.id ? { background: GOLD } : {}}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── TAB CONTENT ──────────────────────────────────────── */}
      {activeTab !== "main" && user?.role === "worker" ? (
        <div className="px-4 pt-3">
          <WorkerContent tab={activeTab} user={user} jobs={[]} />
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">

          {/* Trust bar */}
          <TrustBar score={trust} t={t} />

          {/* Bio */}
          <div className="rounded-2xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
              {t("profile.bioSection","Bio")}
            </h3>
            {editing ? (
              <>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
                  maxLength={300} rows={4} placeholder="Dekri eksperyans ou, sèvis ou ofri..."
                  className={`${inputCls} resize-none leading-relaxed`} />
                <p className="text-[10px] text-slate-600 text-right mt-1">{editBio.length}/300</p>
              </>
            ) : bio ? (
              <p className="text-sm leading-relaxed text-slate-300">{bio}</p>
            ) : (
              <button type="button" onClick={() => setEditing(true)}
                className="w-full text-sm text-slate-600 italic text-left">
                {t("profile.bioEmpty","Klike ✏️ pou ajoute bio ou...")}
              </button>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="rounded-2xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                {t("profile.skillsSection","Konpetans")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="px-3 py-1.5 text-xs font-bold rounded-xl border"
                    style={{ background:"#1a1f35", borderColor: BORDER, color:"#94a3b8" }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Wallet */}
          <div className="rounded-2xl border p-4" style={{ background: CARD, borderColor: "#16a34a30" }}>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
              {t("profile.walletTitle","Bous")}
            </h3>
            <button type="button" onClick={() => navigate("/wallet")}
              className="w-full flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500">{t("profile.walletBalance","Balans disponib")}</p>
                <p className="text-2xl font-black text-green-400 mt-0.5">
                  ${Number(walletBal).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">💵</span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </button>
          </div>

          {/* Action links */}
          <div className="space-y-2">
            {[
              { icon:<Eye className="w-4 h-4"/>,   label:"Wè pwofil piblik ou",     fn:() => navigate(`/u/${user._id || user.id || ""}`) },
              { icon:<Bell className="w-4 h-4"/>,  label:t("profile.notifications","Notifikasyon"), fn:() => navigate(ROUTES.NOTIFICATIONS) },
              { icon:<History className="w-4 h-4"/>,label:t("profile.jobHistory","Istwa Travay"),  fn:() => navigate(ROUTES.JOB_HISTORY) },
            ].map(item => (
              <button key={item.label} type="button" onClick={item.fn}
                className="flex w-full items-center justify-between rounded-xl border p-4 transition active:scale-[0.99]"
                style={{ background: CARD, borderColor: BORDER }}>
                <div className="flex items-center gap-3 text-slate-400">
                  {item.icon}
                  <span className="text-sm font-bold text-slate-100">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}

            <button type="button" onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-xl border p-4 transition active:scale-[0.99]"
              style={{ background:"#1a0a0a", borderColor:"#991b1b40" }}>
              <div className="flex items-center gap-3 text-red-400">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-bold">{t("profile.logout","Dekonekte")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-900" />
            </button>
          </div>

        </div>
      )}

      {/* ── FLOATING ACTION BUTTON — Mesaj ───────────────────── */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.CHAT)}
        className="fixed right-4 bottom-24 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-2xl font-black text-sm transition-all active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${GOLD}, #f59e0b)`,
          color: "#0a0f1a",
          boxShadow: `0 8px 32px ${GOLD}40`,
        }}
      >
        <MessageCircle className="w-5 h-5" />
        Mesaj
      </button>

    </div>
  );
}

export default React.memo(ProfileScreen);
