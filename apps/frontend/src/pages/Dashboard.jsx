import React, {
  useEffect, useState, useCallback, useRef, memo, useMemo,
} from "react";
import {
  MapPin, Wallet, Star, ArrowRight, Play, Heart, Share2,
  MessageCircle, Bookmark, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { isEmployerRole } from "../config/roleConfig";
import StoryRing from "../components/stories/StoryRing";
import { getFeed, likePost, unlikePost, isLiked, getLikeCount } from "../services/social";
import CompanyContent, {
  COMPANY_TABS, CompanyOverviewSupplement,
} from "./company/CompanyDashboard";
import EnterpriseContent, {
  ENTERPRISE_TABS, EnterpriseOverviewSupplement,
} from "./enterprise/EnterpriseDashboard";

// ── Design tokens ─────────────────────────────────────────────────
const BG     = "#050B18";
const CARD   = "#0d1526";
const BORDER = "#1F2937";
const GOLD   = "#FACC15";

// ── Job/worker cache ──────────────────────────────────────────────
let jobsCache = null;
let cacheTime  = 0;
const CACHE_TTL = 15000;

// ── Helpers ───────────────────────────────────────────────────────
function fmtAgo(date) {
  if (!date) return null;
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}j`;
}

// ════════════════════════════════════════════════════════════════
// QUICK ACTION CONFIGS (role-aware)
// ════════════════════════════════════════════════════════════════
const WORKER_ACTIONS = [
  { icon: "🔍", label: "Find Job",      path: "/jobs"               },
  { icon: "💼", label: "Offer Service", path: "/provider-dashboard" },
  { icon: "👷", label: "Hire Workers",  path: "/search"             },
  { icon: "🛒", label: "Marketplace",   path: "/market"             },
  { icon: "📅", label: "Reservations",  path: "/booking"            },
  { icon: "💳", label: "Payments",      path: "/wallet"             },
  { icon: "🤖", label: "AI",           path: "/search"             },
  { icon: "📍", label: "Nearby",        path: "/map"                },
];

const EMPLOYER_ACTIONS = [
  { icon: "📝", label: "Post Job",      path: "/post-job"           },
  { icon: "🔍", label: "Find Workers",  path: "/search"             },
  { icon: "📋", label: "My Posts",      path: "/jobs"               },
  { icon: "🛒", label: "Marketplace",   path: "/market"             },
  { icon: "📅", label: "Reservations",  path: "/booking"            },
  { icon: "💳", label: "Payments",      path: "/wallet"             },
  { icon: "🤖", label: "AI",           path: "/search"             },
  { icon: "📍", label: "Nearby",        path: "/map"                },
];

const SERVICES = [
  { icon: "⚡", label: "Elektrisyen",   path: "/search?q=electrician"  },
  { icon: "🔧", label: "Mekanik",       path: "/search?q=mechanic"     },
  { icon: "🩺", label: "Doktè",         path: "/search?q=doctor"       },
  { icon: "⚖️", label: "Avoka",         path: "/search?q=lawyer"       },
  { icon: "🧹", label: "Netwayaj",      path: "/search?q=cleaning"     },
  { icon: "🔨", label: "Plombye",       path: "/search?q=plumber"      },
  { icon: "🏗",  label: "Konstriksyon", path: "/search?q=construction" },
  { icon: "🚗", label: "Chofè",         path: "/search?q=driver"       },
];

const SPONSORED = [
  { id: "s1", name: "ABC Hôtel",           emoji: "🏨", cta: "Reserve", path: "/search" },
  { id: "s2", name: "Toyota Dealer Haiti", emoji: "🚗", cta: "Buy",     path: "/market" },
  { id: "s3", name: "Construction Co.",    emoji: "🏗",  cta: "Hiring",  path: "/jobs"   },
];

const AI_RECS = [
  { icon: "💼", label: "Djòb Rekòmande",    path: "/jobs"   },
  { icon: "👷", label: "Travayè Près Ou",   path: "/search" },
  { icon: "🏨", label: "Hôtel Rekòmande",   path: "/market" },
  { icon: "🛒", label: "Pwodwi Rekòmande",  path: "/market" },
];

const STATIC_MARKET = [
  { id: "m1", name: "iPhone 16 Pro",   emoji: "📱", tag: "Verified Seller", cta: "Buy",  path: "/market" },
  { id: "m2", name: "Toyota Hilux",    emoji: "🚗", tag: "Verified Seller", cta: "View", path: "/market" },
  { id: "m3", name: "Concrete Mixer",  emoji: "🏗",  tag: "Pro Equipment",  cta: "View", path: "/market" },
];

const RECENT_PAYMENTS = [
  { id: "p1", from: "ABC Construction", label: "Sèvis Elektrik",      amount: "+$800",  date: "Jul 10", status: "completed" },
  { id: "p2", from: "Hotel Montana",    label: "Rezèvasyon Chanm",    amount: "-$240",  date: "Jul 8",  status: "completed" },
];

// ════════════════════════════════════════════════════════════════
// SHARED MICRO-COMPONENTS
// ════════════════════════════════════════════════════════════════

const SectionHeader = memo(function SectionHeader({ title, onViewAll }) {
  return (
    <div className="flex items-center justify-between px-4 mb-3">
      <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      {onViewAll && (
        <button type="button" onClick={onViewAll}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-400 active:opacity-70">
          See All <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});

// ── Job card ──────────────────────────────────────────────────────
const JobCard = memo(function JobCard({ job, navigate, city: userCity }) {
  const [saved, setSaved] = useState(false);
  const photo   = job.companyLogo || job.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company || job.name || "J")}&backgroundColor=111827`;
  const title   = job.title || job.profession || "Position";
  const company = job.company || job.name || "";
  const salary  = job.salary || job.budget || job.rate;
  const city    = job.location?.city || job.city || userCity || "";
  const rating  = job.rating;
  const userId  = job.userId || job._id || job.id;

  return (
    <div className="shrink-0 w-56 flex flex-col rounded-2xl overflow-hidden border"
      style={{ background: CARD, borderColor: BORDER }}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-3 pb-2">
        <img src={photo} alt={company}
          className="w-10 h-10 rounded-xl object-cover border shrink-0"
          style={{ borderColor: BORDER }}
          onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/initials/svg?seed=J"; }} />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-white truncate leading-tight">{company}</p>
          {rating ? (
            <div className="flex items-center gap-0.5 mt-0.5">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span className="text-[9px] text-amber-400 font-bold">{Number(rating).toFixed(1)}</span>
            </div>
          ) : city ? (
            <p className="text-[9px] text-slate-500 truncate mt-0.5">📍 {city}</p>
          ) : null}
        </div>
        <button type="button" onClick={() => setSaved(s => !s)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl border transition"
          style={{ borderColor: saved ? GOLD : BORDER, background: saved ? `${GOLD}20` : 'transparent' }}>
          <Bookmark className={`w-3.5 h-3.5 ${saved ? "text-amber-400 fill-amber-400" : "text-slate-500"}`} />
        </button>
      </div>
      {/* Title */}
      <p className="text-[13px] font-black text-white px-3 pb-2 line-clamp-2 leading-tight">{title}</p>
      {/* Salary + Apply */}
      <div className="flex items-center justify-between px-3 pb-3 mt-auto">
        {salary ? (
          <div>
            <p className="text-[14px] font-black text-amber-400 leading-none">{salary}</p>
            <p className="text-[8px] text-slate-600 mt-0.5">/semèn</p>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic">À négocier</p>
        )}
        <button type="button"
          onClick={() => navigate(`/u/${userId}`, { state: { profile: job } })}
          className="px-3 py-2 rounded-xl text-[11px] font-black text-slate-950 active:scale-95 transition"
          style={{ background: GOLD }}>
          Apply
        </button>
      </div>
    </div>
  );
});

// ── Worker card ───────────────────────────────────────────────────
const WorkerCard = memo(function WorkerCard({ worker, navigate }) {
  const photo = worker.profileMetadata?.profilePhoto || worker.photo
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(worker.name || "w")}`;
  const profession = worker.profession || worker.role || "";
  const rating     = worker.rating || worker.stats?.rating;
  const city       = worker.location?.city || worker.city || "";
  const userId     = worker._id || worker.id;

  return (
    <div className="shrink-0 w-36 flex flex-col items-center gap-2 p-3 rounded-2xl border"
      style={{ background: CARD, borderColor: BORDER }}>
      <div className="relative">
        <img src={photo} alt={worker.name}
          className="w-14 h-14 rounded-2xl object-cover border-2"
          style={{ borderColor: `${GOLD}60` }}
          onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=w"; }} />
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 bg-green-500"
          style={{ borderColor: CARD }} />
      </div>
      <div className="text-center w-full">
        <p className="text-[11px] font-black text-white truncate">{worker.name}</p>
        <p className="text-[9px] text-slate-500 truncate mt-0.5">{profession}</p>
        {rating ? (
          <div className="flex items-center justify-center gap-0.5 mt-1">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span className="text-[9px] text-amber-400 font-bold">{Number(rating).toFixed(1)}</span>
          </div>
        ) : city ? (
          <p className="text-[8px] text-slate-600 mt-1 truncate">📍 {city}</p>
        ) : null}
      </div>
      <button type="button"
        onClick={() => navigate(`/u/${userId}`, { state: { profile: worker } })}
        className="w-full py-1.5 rounded-xl text-[10px] font-black text-slate-950 active:scale-95 transition"
        style={{ background: GOLD }}>
        Hire
      </button>
    </div>
  );
});

// ── Social feed post ──────────────────────────────────────────────
const FeedPost = memo(function FeedPost({ post, myId, navigate }) {
  const [liked, setLiked] = useState(() => isLiked(myId, post.id || post._id));
  const [likes, setLikes] = useState(() => getLikeCount(post.id || post._id) || post.likesCount || 0);

  const toggleLike = useCallback(() => {
    if (liked) { unlikePost(myId, post); setLikes(l => Math.max(0, l - 1)); }
    else       { likePost(myId, post);   setLikes(l => l + 1); }
    setLiked(l => !l);
  }, [liked, myId, post]);

  return (
    <div className="border-b" style={{ borderColor: BORDER }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => navigate(`/u/${post.userId}`)} className="shrink-0">
          <img src={post.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`}
            alt="" className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: GOLD }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white leading-none">{post.userName || "Itilizatè"}</p>
          {post.userProfession && <p className="text-[10px] text-amber-400 mt-0.5">{post.userProfession}</p>}
        </div>
        <span className="text-[10px] text-slate-500">{fmtAgo(post.createdAt)}</span>
      </div>
      {post.mediaUrl ? (
        post.type === "video"
          ? <div className="relative">
              <video src={post.mediaUrl} className="w-full max-h-[360px] object-cover" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            </div>
          : <img src={post.mediaUrl} alt="" className="w-full object-cover max-h-[420px]" />
      ) : post.type === "promotion" ? (
        <div className="mx-4 mb-2 p-3 rounded-2xl" style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30` }}>
          <p className="text-xs text-amber-300 font-bold">📢 Pwomosyon</p>
          {post.caption && <p className="text-sm text-slate-200 mt-1">{post.caption}</p>}
        </div>
      ) : null}
      <div className="flex items-center gap-4 px-4 pt-2 pb-1">
        <button type="button" onClick={toggleLike}
          className="flex items-center gap-1.5 active:scale-90 transition-transform">
          <Heart className={`w-5 h-5 transition-colors ${liked ? "text-red-500 fill-red-500" : "text-slate-400"}`} />
          {likes > 0 && <span className="text-xs text-slate-400">{likes}</span>}
        </button>
        <button type="button" onClick={() => navigate(`/u/${post.userId}`)} className="text-slate-400">
          <MessageCircle className="w-5 h-5" />
        </button>
        <button type="button" className="text-slate-400">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      {post.caption && post.type !== "promotion" && (
        <p className="px-4 pb-3 text-xs text-slate-300 leading-relaxed">
          <span className="font-black text-white mr-1">{post.userName}</span>{post.caption}
        </p>
      )}
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
// CONTACT MODAL
// ════════════════════════════════════════════════════════════════
function ContactModal({ employer, onClose, navigate }) {
  useEffect(() => {
    if (!employer) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [employer, onClose]);

  if (!employer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose} role="presentation">
      <div className="w-full max-w-md rounded-t-3xl p-6 space-y-4"
        style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
        <div className="flex items-center gap-3">
          <img src={employer.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employer.name)}`}
            alt={employer.name} className="w-12 h-12 rounded-xl object-cover border" style={{ borderColor: BORDER }} />
          <div>
            <p className="font-bold text-white">{employer.name}</p>
            <p className="text-xs text-slate-500">{employer.location?.city || ""}</p>
          </div>
        </div>
        <button type="button" onClick={() => { onClose(); navigate("/chat"); }}
          className="w-full py-3 rounded-xl font-black text-sm text-slate-950 active:scale-95 transition"
          style={{ background: GOLD }}>
          💬 Voye Mesaj
        </button>
        <button type="button" onClick={onClose}
          className="w-full py-2.5 text-sm text-slate-500 font-semibold">
          Anile
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN HOME (workers + employers share this layout)
// ════════════════════════════════════════════════════════════════
function JobFastHome({
  user, geo, availability, toggleAvailability,
  jobs, loading, members,
  navigate, isEmployer,
}) {
  const myId  = String(user?._id || user?.id || "");
  const city  = geo.city || "Haiti";
  const wallet = user?.wallet?.balance ?? user?.walletBalance ?? 245;

  // Social feed
  const [feedPosts, setFeedPosts] = useState([]);
  useEffect(() => { setFeedPosts(getFeed(myId).slice(0, 8)); }, [myId]);

  // Contact modal
  const [contactTarget, setContactTarget] = useState(null);
  const handleCloseContact = useCallback(() => setContactTarget(null), []);

  // Role-split data
  const workerMembers   = useMemo(() => members.filter(m =>
    !["company", "business", "enterprise", "employer", "hotel", "restaurant",
      "hospital", "clinic", "tourism"].includes(m.role)
  ), [members]);

  const marketItems = useMemo(() => members.slice(0, 4), [members]);

  const actions = isEmployer ? EMPLOYER_ACTIONS : WORKER_ACTIONS;

  return (
    <>
      <ContactModal employer={contactTarget} onClose={handleCloseContact} navigate={navigate} />

      <div className="pb-24 space-y-6" style={{ background: BG }}>

        {/* ── STORIES ─────────────────────────────────────────── */}
        <StoryRing />

        {/* ── QUICK ACTIONS ───────────────────────────────────── */}
        <div className="px-4">
          <div className="grid grid-cols-4 gap-2">
            {actions.map((a) => (
              <button key={a.label} type="button" onClick={() => navigate(a.path)}
                className="flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border transition-all active:scale-95"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-[22px] leading-none">{a.icon}</span>
                <span className="text-[8px] font-black text-slate-400 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── JOBS NEAR YOU (workers) / WORKERS NEAR YOU (employers) ── */}
        {!isEmployer ? (
          <div>
            <SectionHeader
              title="💼 Jobs Near You"
              onViewAll={() => navigate("/jobs")}
            />
            {loading ? (
              <div className="flex gap-3 px-4 overflow-x-hidden">
                {[1, 2, 3].map(i => (
                  <div key={i} className="shrink-0 w-56 h-40 rounded-2xl animate-pulse"
                    style={{ background: CARD }} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="mx-4 py-10 rounded-2xl text-center border" style={{ background: CARD, borderColor: BORDER }}>
                <p className="text-3xl mb-2">💼</p>
                <p className="text-sm font-bold text-slate-400">Pa gen djòb pou kounye a</p>
                <button type="button" onClick={() => navigate("/jobs")}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-black text-slate-950 active:scale-95 transition"
                  style={{ background: GOLD }}>
                  Wè Tout Djòb
                </button>
              </div>
            ) : (
              <div className="flex gap-3 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {jobs.slice(0, 5).map((j, i) => (
                  <JobCard key={j._id || j.id || i} job={j} navigate={navigate} city={city} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <SectionHeader
              title="👷 Workers Near You"
              onViewAll={() => navigate("/search")}
            />
            {workerMembers.length === 0 ? (
              <div className="mx-4 py-10 rounded-2xl text-center border" style={{ background: CARD, borderColor: BORDER }}>
                <p className="text-3xl mb-2">👷</p>
                <p className="text-sm font-bold text-slate-400">Pa gen travayè pou kounye a</p>
              </div>
            ) : (
              <div className="flex gap-3 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {workerMembers.slice(0, 5).map((w, i) => (
                  <WorkerCard key={w._id || w.id || i} worker={w} navigate={navigate} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES NEAR YOU ────────────────────────────────── */}
        <div>
          <SectionHeader title="⚡ Services Near You" onViewAll={() => navigate("/search")} />
          <div className="flex gap-2.5 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SERVICES.map(s => (
              <button key={s.label} type="button" onClick={() => navigate(s.path)}
                className="shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border transition-all active:scale-95"
                style={{ background: CARD, borderColor: BORDER, minWidth: 72 }}>
                <span className="text-[20px] leading-none">{s.icon}</span>
                <span className="text-[9px] font-black text-slate-400 whitespace-nowrap">{s.label}</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-slate-950"
                  style={{ background: GOLD }}>
                  Book
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── MARKETPLACE HIGHLIGHTS ───────────────────────────── */}
        <div>
          <SectionHeader title="🛒 Featured Marketplace" onViewAll={() => navigate("/market")} />
          <div className="flex gap-3 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {(marketItems.length > 0 ? marketItems.slice(0, 3).map((item, i) => {
              const photo = item.profileMetadata?.profilePhoto || item.photo
                || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name || "M")}&backgroundColor=111827`;
              return (
                <div key={item._id || item.id || i}
                  className="shrink-0 w-44 flex flex-col rounded-2xl border overflow-hidden"
                  style={{ background: CARD, borderColor: BORDER }}>
                  <img src={photo} alt={item.name} className="w-full h-28 object-cover"
                    onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/initials/svg?seed=M"; }} />
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-[11px] font-black text-white truncate">{item.name}</p>
                    <p className="text-[9px] text-amber-400 font-bold mt-0.5">✔ Verified Seller</p>
                    <button type="button" onClick={() => navigate(`/u/${item._id || item.id}`)} className="mt-auto pt-2">
                      <span className="text-[10px] font-black text-amber-400">View →</span>
                    </button>
                  </div>
                </div>
              );
            }) : STATIC_MARKET.map(item => (
              <div key={item.id} className="shrink-0 w-44 flex flex-col rounded-2xl border overflow-hidden"
                style={{ background: CARD, borderColor: BORDER }}>
                <div className="w-full h-28 flex items-center justify-center text-5xl"
                  style={{ background: "#0a1020" }}>
                  {item.emoji}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-[11px] font-black text-white truncate">{item.name}</p>
                  <p className="text-[9px] text-amber-400 font-bold mt-0.5">✔ {item.tag}</p>
                  <button type="button" onClick={() => navigate(item.path)}
                    className="mt-2 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-950 active:scale-95 transition self-start"
                    style={{ background: GOLD }}>
                    {item.cta}
                  </button>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* ── PROFESSIONAL FEED ────────────────────────────────── */}
        {feedPosts.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 mb-3">
              <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">📸 Professional Feed</p>
              <button type="button" onClick={() => navigate("/create-post")}
                className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ background: `${GOLD}20`, color: GOLD }}>
                + Pibliye
              </button>
            </div>
            <div style={{ background: BG }}>
              {feedPosts.map(p => (
                <FeedPost key={p.id || p._id} post={p} myId={myId} navigate={navigate} />
              ))}
            </div>
          </div>
        )}

        {/* ── SPONSORED ───────────────────────────────────────── */}
        <div>
          <SectionHeader title="📢 Sponsored" />
          <div className="flex gap-3 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SPONSORED.map(s => (
              <div key={s.id} className="shrink-0 w-52 flex items-center gap-3 p-3 rounded-2xl border"
                style={{ background: CARD, borderColor: BORDER }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${GOLD}15` }}>
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white truncate">{s.name}</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">Sponsored</p>
                </div>
                <button type="button" onClick={() => navigate(s.path)}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-slate-950 active:scale-95 transition"
                  style={{ background: GOLD }}>
                  {s.cta}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI FOR YOU ───────────────────────────────────────── */}
        <div className="px-4">
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-3">🤖 AI For You</p>
          <div className="grid grid-cols-2 gap-2">
            {AI_RECS.map(a => (
              <button key={a.label} type="button" onClick={() => navigate(a.path)}
                className="flex items-center gap-2.5 px-3 py-3 rounded-2xl border text-left transition-all active:scale-95"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-lg leading-none">{a.icon}</span>
                <span className="text-[11px] font-black text-slate-300 leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── TODAY'S SCHEDULE ─────────────────────────────────── */}
        <div className="px-4">
          <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-3">📅 Today's Schedule</p>
          <div className="rounded-2xl border p-4" style={{ background: CARD, borderColor: BORDER }}>
            <p className="text-sm text-slate-500 text-center py-4">Pa gen rezèvasyon jodi a</p>
            <button type="button" onClick={() => navigate("/booking")}
              className="w-full py-2.5 rounded-xl text-xs font-black text-slate-950 active:scale-95 transition"
              style={{ background: GOLD }}>
              Wè Rezèvasyon Yo
            </button>
          </div>
        </div>

        {/* ── RECENT PAYMENTS ──────────────────────────────────── */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">💰 Recent Payments</p>
            <button type="button" onClick={() => navigate("/wallet")}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-400 active:opacity-70">
              See All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
            {RECENT_PAYMENTS.map((p, i) => (
              <div key={p.id}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < RECENT_PAYMENTS.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: "#0a1020" }}>
                  💸
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{p.from}</p>
                  <p className="text-[10px] text-slate-500 truncate">{p.label} · {p.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${p.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {p.amount}
                  </p>
                  <div className="flex gap-1.5 mt-1 justify-end">
                    <button type="button" onClick={() => navigate("/wallet")}
                      className="text-[9px] font-bold text-slate-500 hover:text-amber-400 transition">
                      Receipt
                    </button>
                    <span className="text-[9px] text-slate-700">·</span>
                    <button type="button" onClick={() => navigate("/wallet")}
                      className="text-[9px] font-bold text-slate-500 hover:text-amber-400 transition">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD ROOT — role router
// ════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const roleKey   = user?.role ?? "worker";
  const isEmployer_ = isEmployerRole(roleKey);

  const isCompanyRole    = roleKey === "company" || roleKey === "business";
  const isEnterpriseRole = roleKey === "enterprise";
  const [companyTab,    setCompanyTab]    = useState("overview");
  const [enterpriseTab, setEnterpriseTab] = useState("overview");

  const [availability, setAvailability] = useState(user?.availability || "available");
  const [geo, setGeo] = useState({
    lat:  user?.location?.coordinates?.latitude  || 18.5432,
    lng:  user?.location?.coordinates?.longitude || -72.3395,
    city: user?.location?.city || "Haiti",
  });

  const [jobs,    setJobs]    = useState(jobsCache || []);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  const mountedRef = useRef(true);
  const abortRef   = useRef(null);
  useEffect(() => () => { mountedRef.current = false; abortRef.current?.abort(); }, []);

  // Fetch jobs (workers only)
  useEffect(() => {
    if (isEmployer_) return;
    const now = Date.now();
    if (jobsCache && now - cacheTime < CACHE_TTL) { setJobs(jobsCache); return; }
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    API.get("/jobs", { signal: ctrl.signal })
      .then(res => {
        if (!mountedRef.current) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        jobsCache = data; cacheTime = Date.now();
        setJobs(data);
      })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [isEmployer_]);

  // Fetch community members (for workers + employers)
  useEffect(() => {
    let alive = true;
    API.get("/community/members?limit=50", { timeout: 15000 })
      .then(res => {
        if (!alive) return;
        setMembers(Array.isArray(res?.data?.data) ? res.data.data : []);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      let city = geo.city;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "fr,ht,es" } }
        );
        const d = await r.json();
        city = d.address?.city || d.address?.town || d.address?.village || city;
      } catch {}
      if (mountedRef.current) setGeo({ lat, lng, city });
    }, () => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAvailability = useCallback(() => {
    const next = availability === "available" ? "busy" : "available";
    setAvailability(next);
    try { localStorage.setItem('jf_availability', next); } catch {}
    API.patch("/workers/availability", { userId: user?._id || user?.id, availability: next }).catch(() => {});
  }, [availability, user]);

  // ── Company dashboard ─────────────────────────────────────────
  if (isCompanyRole) {
    return (
      <div className="space-y-4 pb-8" style={{ background: BG }}>
        <div className="p-5 rounded-2xl border mx-4 mt-2" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-base font-black text-white">Bienveni{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Konpayi Dashboard</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          {COMPANY_TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setCompanyTab(tab.id)}
              aria-pressed={companyTab === tab.id}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                companyTab === tab.id ? "text-slate-950" : "text-slate-400"
              }`}
              style={companyTab === tab.id ? { background: GOLD } : { background: CARD, border: `1px solid ${BORDER}` }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {companyTab === "overview"
          ? <div className="space-y-4 px-4"><CompanyOverviewSupplement user={user} /></div>
          : <CompanyContent tab={companyTab} user={user} />}
      </div>
    );
  }

  // ── Enterprise dashboard ──────────────────────────────────────
  if (isEnterpriseRole) {
    return (
      <div className="space-y-4 pb-8" style={{ background: BG }}>
        <div className="p-5 rounded-2xl border mx-4 mt-2" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-base font-black text-white">Bienveni{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Enterprise Dashboard</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          {ENTERPRISE_TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setEnterpriseTab(tab.id)}
              aria-pressed={enterpriseTab === tab.id}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                enterpriseTab === tab.id ? "text-slate-950" : "text-slate-400"
              }`}
              style={enterpriseTab === tab.id ? { background: GOLD } : { background: CARD, border: `1px solid ${BORDER}` }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {enterpriseTab === "overview"
          ? <div className="space-y-4 px-4"><EnterpriseOverviewSupplement user={user} /></div>
          : <EnterpriseContent tab={enterpriseTab} user={user} />}
      </div>
    );
  }

  // ── Main home (workers + employers) ──────────────────────────
  return (
    <JobFastHome
      user={user}
      geo={geo}
      availability={availability}
      toggleAvailability={toggleAvailability}
      jobs={jobs}
      loading={loading}
      members={members}
      navigate={navigate}
      isEmployer={isEmployer_}
    />
  );
}
