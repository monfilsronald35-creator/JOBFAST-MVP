import React, {
  useState, useEffect, useCallback, useRef, memo,
} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Phone, MessageSquare, Star, Heart,
  MessageCircle, Send, MapPin, Shield, Briefcase,
  CheckCircle, X, ChevronRight, Clock,
} from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

// ── Local-storage helpers ────────────────────────────────────────
const lsGet = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// ── Star picker ──────────────────────────────────────────────────
const StarPicker = memo(function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition active:scale-90"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              n <= value ? "text-amber-400 fill-amber-400" : "text-slate-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
});

// ── Rating bottom-sheet ──────────────────────────────────────────
function RatingModal({ target, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [stars, setStars] = useState(5);
  const [text, setText]   = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-t-3xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />
        <p className="text-center text-white font-bold text-base">⭐ {t("pub.rateTitle", "Bay yon nòt")}</p>
        <p className="text-center text-sm text-slate-400">{target?.name}</p>
        <StarPicker value={stars} onChange={setStars} />
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder={t("pub.reviewPlaceholder", "Ekri yon komantè (opsyonèl)...")}
          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none"
        />
        <button
          type="button"
          onClick={() => onSubmit({ stars, text })}
          className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm active:scale-95 transition"
        >
          {t("pub.submitRating", "Voye Nòt la")}
        </button>
        <button type="button" onClick={onClose} className="w-full text-sm text-slate-500 py-1">{t("common.cancel", "Anile")}</button>
      </div>
    </div>
  );
}

// ── Job demand bottom-sheet ─────────────────────────────────────
function DemandModal({ target, onClose, onSubmit }) {
  const { t }    = useTranslation();
  const [desc, setDesc]     = useState("");
  const [budget, setBudget] = useState("");
  const [date, setDate]     = useState("");

  const valid = desc.trim().length > 5;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto" />
        <p className="text-center text-white font-bold text-base">📋 {t("pub.demandTitle", "Voye yon Demand")}</p>
        <p className="text-center text-xs text-slate-400">{target?.name} · {target?.profession || target?.role}</p>

        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={4}
          placeholder={t("pub.demandDesc", "Dekri travay ou bezwen fè a... (p.ex. Repare kay, Netwaye, Kuit manje...)")}
          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none resize-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder={t("pub.demandBudget", "Bidjè (ex: $50)")}
            className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
          />
        </div>

        <button
          type="button"
          disabled={!valid}
          onClick={() => onSubmit({ description: desc, budget, date })}
          className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm active:scale-95 transition disabled:opacity-40"
        >
          {t("pub.sendDemand", "Voye Demand")} →
        </button>
        <button type="button" onClick={onClose} className="w-full text-sm text-slate-500 py-1">{t("common.cancel", "Anile")}</button>
      </div>
    </div>
  );
}

// ── Comment item ─────────────────────────────────────────────────
const CommentItem = memo(function CommentItem({ c }) {
  return (
    <div className="flex gap-2.5">
      <img
        src={c.authorPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.authorName || "u")}`}
        alt={c.authorName}
        className="w-7 h-7 rounded-full shrink-0 object-cover border border-slate-700"
      />
      <div className="flex-1">
        <div className="bg-slate-800/60 rounded-xl px-3 py-2">
          <p className="text-[11px] font-bold text-amber-400">{c.authorName}</p>
          <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{c.text}</p>
        </div>
        <p className="text-[10px] text-slate-600 mt-0.5 ml-2">{c.time}</p>
      </div>
    </div>
  );
});

// ── Main screen ──────────────────────────────────────────────────
export default function PublicProfileScreen() {
  const { userId }   = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { t }        = useTranslation();
  const { user: me } = useAuth();

  // Profile data — start with what the search result passed (if any)
  const seed = location.state?.profile || null;
  const [profile, setProfile] = useState(seed);
  const [loading, setLoading] = useState(!seed);
  const [error,   setError]   = useState(null);

  // Social state
  const [liked,      setLiked]      = useState(() => lsGet(`jf_like_${userId}`,    false));
  const [likeCount,  setLikeCount]  = useState(() => lsGet(`jf_likecount_${userId}`, seed?.likeCount || 0));
  const [comments,   setComments]   = useState(() => lsGet(`jf_comments_${userId}`, []));
  const [myRating,   setMyRating]   = useState(() => lsGet(`jf_rating_${userId}`,   null));

  // UI state
  const [showRating, setShowRating] = useState(false);
  const [showDemand, setShowDemand] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [newComment, setNewComment] = useState("");
  const commentRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Fetch full profile
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    API.get(`/users/${userId}`, { timeout: 12000 })
      .then(res => {
        if (!alive) return;
        const u = res?.data?.data?.user || res?.data?.user || res?.data;
        if (u) setProfile(p => ({ ...p, ...u }));
      })
      .catch(() => {
        // Non-fatal: show whatever seed data we have
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId]);

  // ── Like ──────────────────────────────────────────────────────
  const handleLike = useCallback(() => {
    const next = !liked;
    const nextCount = likeCount + (next ? 1 : -1);
    setLiked(next);
    setLikeCount(nextCount);
    lsSet(`jf_like_${userId}`, next);
    lsSet(`jf_likecount_${userId}`, nextCount);
    API.post(`/users/${userId}/like`, { like: next }).catch(() => {});
  }, [liked, likeCount, userId]);

  // ── Comment ───────────────────────────────────────────────────
  const submitComment = useCallback(() => {
    const text = newComment.trim();
    if (!text || text.length < 2) return;
    const c = {
      id:          Date.now(),
      authorName:  me?.name || "Ou",
      authorPhoto: me?.profileMetadata?.profilePhoto || "",
      text,
      time:        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const next = [c, ...comments];
    setComments(next);
    lsSet(`jf_comments_${userId}`, next);
    setNewComment("");
    API.post(`/users/${userId}/comments`, { text }).catch(() => {});
    showToast(t("pub.commentSent", "Komantè voye!"));
  }, [newComment, comments, userId, me, t, showToast]);

  // ── Rating ────────────────────────────────────────────────────
  const submitRating = useCallback(({ stars, text }) => {
    lsSet(`jf_rating_${userId}`, stars);
    setMyRating(stars);
    setShowRating(false);
    API.post(`/users/${userId}/ratings`, { stars, comment: text }).catch(() => {});
    showToast(`${t("pub.ratedWith", "Ou bay")} ${stars} ⭐`);
  }, [userId, t, showToast]);

  // ── Demand ────────────────────────────────────────────────────
  const submitDemand = useCallback(({ description, budget, date }) => {
    setShowDemand(false);
    API.post("/jobs", {
      targetUserId: userId,
      description,
      budget,
      preferredDate: date,
      status: "pending",
    }).catch(() => {});
    showToast(t("pub.demandSent", "Demand voye avèk siksè!"));
  }, [userId, t, showToast]);

  // ── Helpers ───────────────────────────────────────────────────
  const avgRating   = profile?.stats?.rating ?? profile?.rating ?? 5.0;
  const jobsDone    = profile?.stats?.totalJobs ?? profile?.totalJobs ?? 0;
  const trust       = profile?.trust_score ?? 70;
  const bio         = profile?.profileMetadata?.bio || profile?.bio || "";
  const skills      = profile?.stats?.skills || profile?.skills || [];
  const city        = profile?.location?.city || profile?.city || "";
  const country     = profile?.location?.country || "";
  const photo       = profile?.profileMetadata?.profilePhoto || profile?.photo
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.name || "u")}`;

  if (loading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1528] text-slate-400">
        <p className="animate-pulse text-sm">Ap chaje pwofil...</p>
      </div>
    );
  }

  if (!profile && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1528] text-slate-400 flex-col gap-4">
        <p>Pa jwenn pwofil sa a</p>
        <button onClick={() => navigate(-1)} className="text-amber-400 text-sm">← Retounen</button>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] bg-emerald-500 text-slate-950 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-xl transition-all">
          {toast}
        </div>
      )}

      {/* Modals */}
      {showRating && (
        <RatingModal target={profile} onClose={() => setShowRating(false)} onSubmit={submitRating} />
      )}
      {showDemand && (
        <DemandModal target={profile} onClose={() => setShowDemand(false)} onSubmit={submitDemand} />
      )}

      <div className="min-h-screen bg-[#0B1528] text-white pb-28">

        {/* ── HERO HEADER ──────────────────────────────────────── */}
        <div className="relative bg-gradient-to-b from-[#0f172a] to-[#0B1528] pt-4 pb-6 px-4">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-400 text-sm mb-4 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back", "Retounen")}
          </button>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={photo}
                alt={profile?.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-lg"
                onError={e => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.name || "u")}`;
                }}
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  profile?.availability === "available" ? "bg-green-500" : "bg-slate-500"
                }`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white leading-tight truncate">
                  {profile?.name || "—"}
                </h1>
                {profile?.verified && (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>

              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mt-0.5">
                {profile?.profession || profile?.role || ""}
              </p>

              {(city || country) && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  {[city, country].filter(Boolean).join(", ")}
                </div>
              )}

              {/* Stars */}
              <div className="flex items-center gap-1 mt-1.5">
                {[1,2,3,4,5].map(n => (
                  <Star
                    key={n}
                    className={`w-3 h-3 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
                  />
                ))}
                <span className="text-[11px] text-amber-400 font-bold ml-0.5">{Number(avgRating).toFixed(1)}</span>
                <span className="text-[10px] text-slate-500">({jobsDone} {t("profile.jobsDone", "travay")})</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-amber-400">{jobsDone}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide">{t("profile.jobsDone", "Travay Fini")}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-emerald-400">{trust}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide">{t("profile.trustLevel", "Konfyans")}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-rose-400">{likeCount}</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wide">Jaime</p>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ───────────────────────────────────── */}
        <div className="px-4 mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { if (profile?.phone) window.location.href = `tel:${profile.phone}`; }}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 active:scale-95 transition"
          >
            <Phone className="w-5 h-5" />
            <span className="text-[11px] font-bold">Rele</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/chat/${userId}`)}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 active:scale-95 transition"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[11px] font-bold">Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDemand(true)}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 active:scale-95 transition"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[11px] font-bold">{t("pub.demand", "Demand")}</span>
          </button>
        </div>

        {/* ── SOCIAL BAR ──────────────────────────────────────── */}
        <div className="px-4 mt-3 flex gap-2">
          {/* Like */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition active:scale-95 ${
              liked
                ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                : "bg-slate-800/60 border-slate-700 text-slate-400"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-rose-400" : ""}`} />
            <span className="text-xs font-bold">{likeCount} Jaime</span>
          </button>

          {/* Comment */}
          <button
            type="button"
            onClick={() => commentRef.current?.focus()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-400 active:scale-95 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-bold">{comments.length} Komantè</span>
          </button>

          {/* Rate */}
          <button
            type="button"
            onClick={() => setShowRating(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition active:scale-95 ${
              myRating
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "bg-slate-800/60 border-slate-700 text-slate-400"
            }`}
          >
            <Star className={`w-4 h-4 ${myRating ? "fill-amber-400 text-amber-400" : ""}`} />
            <span className="text-xs font-bold">{myRating ? `${myRating}★` : t("pub.rate", "Nòt")}</span>
          </button>
        </div>

        {/* ── BODY ────────────────────────────────────────────── */}
        <div className="px-4 mt-4 space-y-5">

          {/* Bio */}
          {bio && (
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                {t("profile.bioSection", "Bio / A Pwopo")}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>
            </section>
          )}

          {/* Skills / Services */}
          {skills.length > 0 && (
            <section>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                {t("profile.skillsSection", "Konpetans / Sèvis")}
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs font-bold text-slate-200">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Trust / Verification */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">{t("profile.trustLevel", "Nivo Konfyans")}</p>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400"
                style={{ width: `${trust}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{trust}/100</span>
              {profile?.verified && <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Kont Verifye</span>}
            </div>
          </section>

          {/* ── COMMENTS ──────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">
              💬 Komantè ({comments.length})
            </p>

            {/* Add comment */}
            <div className="flex gap-2 mb-4">
              <img
                src={me?.profileMetadata?.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(me?.name || "me")}`}
                alt="me"
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="flex-1 flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-2xl px-3 py-2">
                <input
                  ref={commentRef}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); }}}
                  placeholder={t("pub.addComment", "Ekri yon komantè...")}
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={newComment.trim().length < 2}
                  className="text-amber-400 disabled:text-slate-600 transition active:scale-90"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">
                {t("pub.noComments", "Pa gen komantè. Soyez premye a!")}
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <CommentItem key={c.id} c={c} />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
