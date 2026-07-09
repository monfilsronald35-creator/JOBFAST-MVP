import React, { useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkerContent, { WORKER_TABS } from "./worker/WorkerDashboard";
import {
  Camera, Edit3, Save, X, Star, Shield, Briefcase,
  Bell, History, LogOut, ChevronRight, MapPin,
} from "lucide-react";

export const ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  EDIT_PROFILE: "/edit-profile",
  SETTINGS: "/settings",
  JOB_HISTORY: "/job-history",
  NOTIFICATIONS: "/notifications",
  LOGIN: "/login",
};

function trustScore(user) {
  let score = 40;
  if (user?.profileMetadata?.profilePhoto) score += 20;
  if (user?.profileMetadata?.bio)           score += 15;
  if (user?.phone)                           score += 15;
  if (user?.verified)                        score += 10;
  return Math.min(score, 100);
}

function ProfileScreen() {
  const navigate   = useNavigate();
  const { user, login: updateSession, logout } = useAuth();
  const fileRef    = useRef(null);

  // ── Edit state ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("main");
  const [editing,  setEditing]  = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editBio,  setEditBio]  = useState(user?.profileMetadata?.bio || user?.bio || "");
  const [editPhoto, setEditPhoto] = useState(user?.profileMetadata?.profilePhoto || "");
  const [saving,   setSaving]   = useState(false);

  const avatarSrc = useMemo(
    () => editPhoto
      || user?.profileMetadata?.profilePhoto
      || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "user")}`,
    [editPhoto, user]
  );

  // ── Photo picker ─────────────────────────────────────────────
  const handlePhotoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditPhoto(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!editName.trim()) return;
    setSaving(true);
    const updated = {
      ...user,
      name: editName.trim(),
      profileMetadata: {
        ...(user?.profileMetadata || {}),
        bio: editBio.trim(),
        profilePhoto: editPhoto || user?.profileMetadata?.profilePhoto || "",
      },
    };
    updateSession(updated);
    setSaving(false);
    setEditing(false);
  }, [editName, editBio, editPhoto, user, updateSession]);

  const handleCancel = useCallback(() => {
    setEditName(user?.name || "");
    setEditBio(user?.profileMetadata?.bio || "");
    setEditPhoto(user?.profileMetadata?.profilePhoto || "");
    setEditing(false);
  }, [user]);

  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Chajman...
      </div>
    );
  }

  const locationLabel = user.location?.city
    ? [user.location.city, user.location?.country].filter(Boolean).join(", ")
    : user.location?.country || "";

  const rating       = user.stats?.rating ?? 5.0;
  const jobsDone     = user.stats?.totalJobs ?? 0;
  const walletBal    = user.walletBalance ?? 0;
  const trust        = trustScore(user);
  const bio          = editing ? editBio : (user?.profileMetadata?.bio || user?.bio || "");
  const skills       = user?.stats?.skills || [];

  return (
    <div className="w-full flex flex-col text-slate-100 pb-4">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] px-4 pb-5 pt-4 border-b border-slate-800/60">

        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
            Paramèt / Pwofil
          </h1>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold active:scale-95 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Modifye
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black active:scale-95 disabled:opacity-50 transition"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Ap sove..." : "Sove"}
              </button>
            </div>
          )}
        </div>

        {/* Avatar + basic info */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <img
              src={editing ? (editPhoto || avatarSrc) : avatarSrc}
              alt={user.name}
              className="h-20 w-20 rounded-full border-4 border-slate-700 shadow-lg object-cover"
            />
            {editing && (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </>
            )}
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
          </div>

          {editing ? (
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              maxLength={50}
              placeholder="Non ou..."
              className="text-center text-lg font-bold text-white bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-1.5 outline-none focus:border-amber-500/50 w-full max-w-xs mb-1"
            />
          ) : (
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
          )}

          <p className="text-[11px] font-black uppercase tracking-widest text-amber-400 mt-0.5">
            {user.profession || user.role}
          </p>

          {locationLabel && (
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <MapPin className="w-3 h-3" />
              {locationLabel}
            </div>
          )}

          {user.verified && (
            <span className="mt-1.5 text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
              ✓ Kont Verifye
            </span>
          )}
        </div>

        {/* Stats: Rating + Jobs */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-lg font-black text-amber-400">{Number(rating).toFixed(1)}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Evalyasyon</p>
          </div>
          <div className="text-center border-l border-slate-800">
            <div className="flex items-center justify-center gap-1">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-black text-emerald-400">{jobsDone}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Travay Fini</p>
          </div>
        </div>
      </div>

      {/* ── WORKER TAB BAR (worker role only) ─────────────────── */}
      {user?.role === "worker" && (
        <div
          className="flex gap-1.5 overflow-x-auto px-4 pt-3 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Settings tab (always first) */}
          <button
            type="button"
            onClick={() => setActiveTab("main")}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "main"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
            ⚙️ Paramèt
          </button>
          {/* Worker section tabs */}
          {WORKER_TABS.filter(t => t.id !== "overview").map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── TAB CONTENT ────────────────────────────────────────── */}
      {activeTab !== "main" && user?.role === "worker" ? (
        <div className="px-4 pt-3">
          <WorkerContent tab={activeTab} user={user} jobs={[]} />
        </div>
      ) : (
        <div className="px-4 pt-5 space-y-5">

          {/* Bio */}
          <section>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
              Bio / A Pwopo
            </h3>
            {editing ? (
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Ekri yon ti mo sou tèt ou (travay ou fè, ekspèryans, etc.)..."
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-500/40 resize-none leading-relaxed"
              />
            ) : bio ? (
              <p className="text-sm leading-relaxed text-slate-300">{bio}</p>
            ) : (
              <p className="text-sm text-slate-600 italic">
                Klike "Modifye" pou ajoute yon bio...
              </p>
            )}
          </section>

          {/* Trust score */}
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Nivo Konfyans</span>
              </div>
              <span className="text-xs font-black text-amber-500">{trust}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${trust}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              {trust < 60
                ? "Ajoute foto ak bio pou ogmante nivo konfyans ou."
                : trust < 80
                ? "Bon! Verifye kont ou pou rache nivo ou."
                : "Ekselan! Pwofil ou solid."}
            </p>
          </section>

          {/* Wallet */}
          <section>
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Wallet</h3>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500">Balans Disponib</p>
                <p className="text-2xl font-black text-green-400 mt-0.5">
                  ${Number(walletBal).toLocaleString()}
                </p>
              </div>
              <span className="text-3xl">💵</span>
            </div>
          </section>

          {/* Skills */}
          {skills.length > 0 && (
            <section>
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Konpetans</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-bold text-slate-200">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Action links */}
          <section className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate(ROUTES.NOTIFICATIONS)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-slate-800/30 p-4 transition hover:border-slate-700 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-100">Notifikasyon</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <button
              type="button"
              onClick={() => navigate(ROUTES.JOB_HISTORY)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-slate-800/30 p-4 transition hover:border-slate-700 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <History className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-100">Istwa Travay</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 transition hover:border-red-500/40 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-bold">Dekonekte</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-500/50" />
            </button>
          </section>

        </div>
      )}
    </div>
  );
}

export default React.memo(ProfileScreen);
