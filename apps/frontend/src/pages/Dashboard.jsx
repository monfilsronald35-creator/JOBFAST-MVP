import React, {
  useEffect, useState, useCallback, useRef, memo, useMemo,
} from "react";
import {
  Search, Building2, MapPin, Briefcase, Star, CheckCircle,
  ArrowRight, RefreshCcw, Navigation, Bookmark,
  Mic, QrCode, SlidersHorizontal, X, Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRoleDashboard, isEmployerRole } from "../config/roleConfig";
import { getAllCategoryConfigs } from "../config/marketplaceConfig";
import StoryRing from "../components/stories/StoryRing";
import CompanyContent, {
  COMPANY_TABS, CompanyOverviewSupplement,
} from "./company/CompanyDashboard";
import EnterpriseContent, {
  ENTERPRISE_TABS, EnterpriseOverviewSupplement,
} from "./enterprise/EnterpriseDashboard";

// ── Helpers ──────────────────────────────────────────────────────
function formatTimeAgo(date) {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "< 1m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

// ── Role colours ─────────────────────────────────────────────────
const ROLE_COLORS = {
  company:    { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30"     },
  business:   { color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/30"       },
  enterprise: { color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" },
  employer:   { color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
};

const EMPLOYER_ROLES = new Set(["company", "business", "enterprise", "employer"]);

// ── Marketplace categories from authoritative config (8 real provider roles) ──
const ACCENT_GRADIENT = {
  amber:   "from-amber-600/20 to-transparent",
  cyan:    "from-cyan-600/20 to-transparent",
  emerald: "from-emerald-600/20 to-transparent",
  slate:   "from-slate-600/20 to-transparent",
  purple:  "from-violet-600/20 to-transparent",
  red:     "from-red-600/20 to-transparent",
  teal:    "from-teal-600/20 to-transparent",
  yellow:  "from-yellow-500/20 to-transparent",
};
const MARKETPLACE_CATEGORIES = getAllCategoryConfigs();

// ── Cache ─────────────────────────────────────────────────────────
let jobsCache = null;
let cacheTime  = 0;
const CACHE_TTL = 15000;


// ── Search filter definitions — hoisted to module level (no runtime deps) ──
const SEARCH_FILTERS = [
  { id: "location", icon: "📍", key: "filterLocation" },
  { id: "distance", icon: "🎯", key: "filterDistance" },
  { id: "category", icon: "🧰", key: "filterCategory" },
  { id: "language", icon: "🗣",  key: "filterLanguage" },
];

// ════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ════════════════════════════════════════════════════════════════

const PremiumSkeleton = memo(function PremiumSkeleton({ wide }) {
  return (
    <div className={`shrink-0 ${wide ? "w-60" : "w-[130px]"} rounded-2xl bg-slate-900/60 border border-slate-800/40 overflow-hidden`}>
      <div className="animate-pulse p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={`${wide ? "w-11 h-11" : "w-14 h-14"} rounded-xl bg-slate-800/80 shrink-0`} />
          {wide && (
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-slate-800/80 rounded-full w-3/4" />
              <div className="h-2 bg-slate-800/50 rounded-full w-1/2" />
            </div>
          )}
        </div>
        {wide && (
          <>
            <div className="h-2.5 bg-slate-800/70 rounded-full w-full" />
            <div className="h-2 bg-slate-800/50 rounded-full w-2/3" />
            <div className="h-8 bg-slate-800/40 rounded-xl w-full mt-2" />
          </>
        )}
      </div>
    </div>
  );
});

const PremiumEmpty = memo(function PremiumEmpty({ emoji, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="shrink-0 w-72 flex flex-col items-center justify-center text-center px-6 py-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800/60">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/40 flex items-center justify-center mb-3 shadow-xl shadow-black/20">
        <span className="text-3xl">{emoji}</span>
      </div>
      <p className="text-[13px] font-bold text-slate-300 mb-1">{title}</p>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{subtitle}</p>
      {actionLabel && (
        <button type="button" onClick={onAction}
          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black active:scale-95 transition shadow-lg shadow-amber-500/20">
          {actionLabel}
        </button>
      )}
    </div>
  );
});

// ── Section wrapper ───────────────────────────────────────────────
const HSection = memo(function HSection({ icon, titleKey, accentColor, children, onViewAll, t }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-[18px] leading-none" aria-hidden="true">{icon}</span>
          <p className={`text-[12px] font-black uppercase tracking-widest ${accentColor}`}>
            {t(`dashboard.${titleKey}`)}
          </p>
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-400 transition font-bold">
            {t("dashboard.viewAll")} <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {children}
      </div>
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
// PREMIUM CARDS
// ════════════════════════════════════════════════════════════════

const PremiumJobCard = memo(function PremiumJobCard({ job, navigate, t, userCity }) {
  const [bookmarked, setBookmarked] = useState(false);

  const photo = job.companyLogo || job.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company || job.name || "J")}&backgroundColor=1e293b`;
  const title    = job.title || job.profession || "Position";
  const company  = job.company || job.name || "";
  const salary   = job.salary || job.budget || job.rate;
  const location = job.location?.city || job.city || userCity || "";
  const timeAgo  = formatTimeAgo(job.createdAt);
  const rating   = job.rating;
  const verified = job.verified;
  const userId   = job.userId || job._id || job.id;

  return (
    <div
      onClick={() => navigate(`/u/${userId}`, { state: { profile: job } })}
      className="shrink-0 w-60 flex flex-col bg-gradient-to-b from-slate-900 to-[#0b1120] border border-slate-800/60 rounded-2xl p-4 cursor-pointer
        hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40
        transition-all duration-300 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <img src={photo} alt={company}
              className="w-11 h-11 rounded-xl object-cover border border-slate-700/60 bg-slate-800"
              onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/initials/svg?seed=J"; }} />
            {verified && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0b1120] shadow-md">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white leading-tight truncate max-w-[95px]">{company || "Company"}</p>
            {rating && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" aria-hidden="true" />
                <span className="text-[10px] text-amber-400 font-bold">{Number(rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <button type="button" onClick={e => { e.stopPropagation(); setBookmarked(b => !b); }}
          aria-label={bookmarked ? "Retire sove" : "Sove travay"}
          aria-pressed={bookmarked}
          className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border transition-all ${
            bookmarked
              ? "bg-amber-500 border-amber-500 text-slate-950"
              : "bg-slate-800/60 border-slate-700/40 text-slate-500 hover:border-amber-500/50 hover:text-amber-400"
          }`}>
          <Bookmark className="w-3.5 h-3.5" fill={bookmarked ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      </div>

      {/* Title */}
      <h3 className="text-[13px] font-black text-white leading-tight mb-2.5 line-clamp-2 group-hover:text-amber-50 transition-colors flex-1">
        {title}
      </h3>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {location && (
          <span className="flex items-center gap-1 text-[9px] text-slate-500 bg-slate-800/50 border border-slate-700/30 px-2 py-1 rounded-lg">
            <MapPin className="w-2 h-2 text-amber-400/70 shrink-0" aria-hidden="true" />{location}
          </span>
        )}
        {timeAgo && (
          <span className="text-[9px] text-amber-400/70 bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded-lg">
            🕐 {timeAgo}
          </span>
        )}
        {verified && !timeAgo && (
          <span className="text-[9px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg">
            ✔ {t("dashboard.verified")}
          </span>
        )}
      </div>

      {/* Footer: salary + apply */}
      <div className="flex items-end justify-between mt-auto">
        <div>
          {salary ? (
            <>
              <p className="text-[16px] font-black text-amber-400 leading-tight">{salary}</p>
              <p className="text-[9px] text-slate-500 leading-tight">{t("dashboard.perDay")}</p>
            </>
          ) : (
            <p className="text-[11px] text-slate-500 italic">{t("dashboard.negotiable")}</p>
          )}
        </div>
        <button type="button"
          onClick={e => { e.stopPropagation(); navigate(`/u/${userId}`, { state: { profile: job } }); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black
            group-hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20">
          {t("dashboard.applyNow")} <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

const PremiumWorkerCard = memo(function PremiumWorkerCard({ worker, navigate }) {
  const photo = worker.profileMetadata?.profilePhoto || worker.photo
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(worker.name || "w")}`;
  const profession = worker.profession || worker.role || "";
  const rating     = worker.rating;
  const city       = worker.location?.city || worker.city || "";

  return (
    <div
      onClick={() => navigate(`/u/${worker._id || worker.id}`, { state: { profile: worker } })}
      className="shrink-0 w-[130px] flex flex-col items-center gap-2.5 p-4 bg-gradient-to-b from-slate-900 to-[#0b1120] border border-slate-800/60 rounded-2xl cursor-pointer
        hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30
        transition-all duration-300"
    >
      <div className="relative">
        <img src={photo} alt={worker.name}
          className="w-14 h-14 rounded-xl object-cover border-2 border-slate-700/60"
          onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=w"; }} />
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0b1120] bg-green-500 shadow-md" aria-hidden="true" />
      </div>
      <div className="text-center w-full">
        <p className="text-[12px] font-bold text-white truncate leading-tight">{worker.name}</p>
        <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-tight">{profession}</p>
      </div>
      {rating ? (
        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />
          <span className="text-[11px] font-bold text-amber-300">{Number(rating).toFixed(1)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          <span className="text-[10px] font-semibold text-green-400">Online</span>
        </div>
      )}
      {city && (
        <p className="text-[9px] text-slate-600 truncate flex items-center gap-1 w-full justify-center">
          <MapPin className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />{city}
        </p>
      )}
    </div>
  );
});

const PremiumCompanyCard = memo(function PremiumCompanyCard({ company, navigate, t, onContact }) {
  const photo = company.profileMetadata?.profilePhoto || company.photo
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company.name || "C")}&backgroundColor=1e293b`;
  const city      = company.location?.city || company.city || "";
  const jobsCount = company.stats?.jobsPosted ?? company.jobsPosted ?? null;
  const colors    = ROLE_COLORS[company.role] || { color: "text-slate-400", bg: "bg-slate-800/50 border-slate-700" };

  return (
    <div
      onClick={() => navigate(`/u/${company._id || company.id}`, { state: { profile: company } })}
      className="shrink-0 w-52 flex flex-col gap-3 p-4 bg-gradient-to-b from-slate-900 to-[#0b1120] border border-slate-800/60 rounded-2xl cursor-pointer
        hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30
        transition-all duration-300"
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={photo} alt={company.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-700/60 bg-slate-800"
            onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/initials/svg?seed=C"; }} />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0b1120] shadow-md">
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight truncate">{company.name}</p>
          {city && <p className="text-[10px] text-slate-500 truncate mt-0.5">{city}</p>}
          <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1 ${colors.bg} ${colors.color}`}>
            {company.role}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {jobsCount !== null ? (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Briefcase className="w-3 h-3" aria-hidden="true" />{jobsCount} jobs
          </div>
        ) : <div />}
        <button type="button"
          onClick={e => { e.stopPropagation(); onContact(company); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold
            hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 transition-all active:scale-95">
          {t("dashboard.contactWork")}
        </button>
      </div>
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
// EXISTING EMPLOYER DIRECTORY COMPONENTS (unchanged)
// ════════════════════════════════════════════════════════════════

const EmployerCard = memo(function EmployerCard({ emp, onContact }) {
  const { t } = useTranslation();
  const colors  = ROLE_COLORS[emp.role] || { color: "text-slate-400", bg: "bg-slate-800/50 border-slate-700" };
  const roleKey = `dashboard.role${emp.role.charAt(0).toUpperCase()}${emp.role.slice(1)}`;
  const photo   = emp.photo || emp.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name || "co")}`;
  const city      = emp.location?.city || emp.city || "";
  const jobsCount = emp.stats?.jobsPosted ?? emp.jobsPosted ?? null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={photo} alt={emp.name} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700"
            onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`; }} />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-green-500" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight truncate">{emp.name}</p>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${colors.bg} ${colors.color}`}>
            {t(roleKey, emp.role)}
          </span>
        </div>
        {jobsCount !== null && (
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-amber-400">{jobsCount}</p>
            <p className="text-[9px] text-slate-500">{t("dashboard.jobs")}</p>
          </div>
        )}
      </div>
      {city && (
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />{city}
        </div>
      )}
      <button type="button" onClick={() => onContact(emp)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black active:scale-95 transition">
        <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
        {t("dashboard.contactWork")}
      </button>
    </div>
  );
});

function EmployerDirectory({ searchQuery, onContact }) {
  const { t } = useTranslation();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");

  const FILTERS = [
    { id: "all",        label: t("dashboard.filterAll") },
    { id: "company",    label: t("dashboard.filterCompany") },
    { id: "enterprise", label: t("dashboard.filterEnterprise") },
    { id: "employer",   label: t("dashboard.filterEmployer") },
  ];

  useEffect(() => {
    let alive = true;
    API.get("/community/members?limit=100", { timeout: 15000 })
      .then(res => {
        if (!alive) return;
        const all = Array.isArray(res?.data?.data) ? res.data.data : [];
        setEmployers(all.filter(m => EMPLOYER_ROLES.has(m.role)));
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const visible = employers.filter(e => {
    const matchFilter = filter === "all" || e.role === filter
      || (filter === "employer" && !["company", "enterprise"].includes(e.role));
    const q = searchQuery.trim().toLowerCase();
    return matchFilter && (!q || e.name?.toLowerCase().includes(q)
      || e.location?.city?.toLowerCase().includes(q)
      || e.profession?.toLowerCase().includes(q));
  });

  if (loading) return (
    <div className="grid grid-cols-1 gap-3">
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-800/40 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {FILTERS.map(f => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
              filter === f.id
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}>
            {f.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <p className="text-4xl" aria-hidden="true">🏢</p>
          <p className="text-sm text-slate-400 font-semibold">{t("dashboard.noEmployers")}</p>
          <p className="text-xs text-slate-600">
            {searchQuery ? t("dashboard.noEmployersSearch") : t("dashboard.noEmployersYet")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visible.map((e, i) => <EmployerCard key={e.id || e._id || i} emp={e} onContact={onContact} />)}
        </div>
      )}
    </div>
  );
}

function ContactModal({ employer, onClose, navigate }) {
  const { t } = useTranslation();

  // Close on Escape key — only active when modal is open
  useEffect(() => {
    if (!employer) return;
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [employer, onClose]);

  if (!employer) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-t-3xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" aria-hidden="true" />
        <div className="flex items-center gap-3">
          <img src={employer.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employer.name)}`}
            alt={employer.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
          <div>
            <p id="contact-modal-title" className="font-bold text-white">{employer.name}</p>
            <p className="text-xs text-slate-500">{employer.location?.city || ""}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          {t("dashboard.contactMsg")} <span className="text-white font-semibold">{employer.name}</span> {t("dashboard.contactFor")}
        </p>
        <button type="button" onClick={() => { onClose(); navigate("/chat"); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm active:scale-95 transition">
          💬 {t("dashboard.sendMessage")}
        </button>
        <button type="button" onClick={onClose} className="w-full py-2.5 text-sm text-slate-500 font-semibold">
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

// ── Generic role dashboard ────────────────────────────────────────
function RoleDashboard({ dashConfig }) {
  const sections = [...dashConfig.sections].sort((a, b) => a.priority - b.priority);
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white">{dashConfig.greeting}</h2>
        <p className="text-slate-400 text-sm mt-1">{dashConfig.subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {dashConfig.widgets.map(w => (
          <div key={w.id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-2xl font-bold text-amber-500">—</div>
            <div className="text-xs text-slate-400 mt-1">{w.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Seksyon yo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(s => (
          <div key={s.id} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition cursor-default">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-hidden="true">{s.icon}</span>
              <div>
                <h4 className="font-bold text-slate-100">{s.label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tap pou wè plis</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Smart filter chips (9 items, horizontal scroll) ────────────────
const SMART_FILTERS = [
  { id: 'location',  icon: '📍', label: 'Lokasyon'  },
  { id: 'category',  icon: '📂', label: 'Kategori'  },
  { id: 'salary',    icon: '💰', label: 'Salè'      },
  { id: 'country',   icon: '🌎', label: 'Peyi'      },
  { id: 'date',      icon: '📅', label: 'Dat'       },
  { id: 'rating',    icon: '⭐', label: 'Nòt'       },
  { id: 'available', icon: '🟢', label: 'Disponib'  },
  { id: 'company',   icon: '🏢', label: 'Antrepriz' },
  { id: 'urgent',    icon: '⚡', label: 'Ijan'      },
];

// ── Service industry list (6 sectors) ─────────────────────────────
const SERVICE_INDUSTRIES = [
  { id: 'restaurant',   icon: '🍽',  label: 'Restaurant',   count: 1248,  unit: 'Businesses', role: 'restaurant'   },
  { id: 'hotel',        icon: '🏨',  label: 'Hôtel',        count: 824,   unit: 'Hotels',     role: 'hotel'        },
  { id: 'hospital',     icon: '🏥',  label: 'Lopital',      count: 216,   unit: 'Hospitals',  role: 'hospital'     },
  { id: 'clinic',       icon: '🩺',  label: 'Klinik',       count: 378,   unit: 'Clinics',    role: 'clinic'       },
  { id: 'tourism',      icon: '✈',   label: 'Touris',       count: 561,   unit: 'Companies',  role: 'tourism'      },
  { id: 'construction', icon: '🏗',  label: 'Konstriksyon', count: 5812,  unit: 'Companies',  role: 'construction' },
];

// ── AI recommendation mock data ────────────────────────────────────
const MOCK_AI_RECS = [
  { id: 'ai1', profession: 'Elektrisyen',    match: 92, icon: '⚡' },
  { id: 'ai2', profession: 'Chef / Kuyinye', match: 88, icon: '👨‍🍳' },
  { id: 'ai3', profession: 'Chofè',          match: 85, icon: '🚗' },
  { id: 'ai4', profession: 'Plombye',        match: 79, icon: '🔧' },
];

// ── Compact list-style job card (LinkedIn / Indeed pattern) ────────
const JobListCard = memo(function JobListCard({ job, navigate, userCity }) {
  const title   = job.title || job.profession || 'Position';
  const company = job.company || job.name || '';
  const salary  = job.salary || job.budget || job.rate || '';
  const city    = job.location?.city || job.city || userCity || '';
  const timeAgo = formatTimeAgo(job.createdAt);
  const userId  = job.userId || job._id || job.id;
  const photo   = job.companyLogo || job.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company || 'J')}&backgroundColor=1e293b`;

  return (
    <div role="button" tabIndex={0}
      onClick={() => navigate(`/u/${userId}`, { state: { profile: job } })}
      onKeyDown={e => e.key === 'Enter' && navigate(`/u/${userId}`, { state: { profile: job } })}
      className="flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-white/[0.015] transition-colors active:bg-white/[0.025]"
      style={{ WebkitTapHighlightColor: 'transparent' }}>
      <div className="relative shrink-0">
        <img src={photo} alt={company}
          className="w-12 h-12 rounded-[14px] object-cover border border-[#1F2937] bg-[#111827]"
          onError={e => { e.currentTarget.src = 'https://api.dicebear.com/7.x/initials/svg?seed=J'; }} />
        {!!job.verified && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#111827] flex items-center justify-center">
            <CheckCircle className="w-2 h-2 text-white" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black text-white truncate leading-tight">{title}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">
          {company}{company && city ? ' · ' : ''}{city}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[9px] bg-[#1F2937] text-slate-400 rounded-lg px-1.5 py-0.5 font-medium">Tan Plen</span>
          {salary && <span className="text-[9px] font-black text-amber-400">{salary}</span>}
          {timeAgo && <span className="text-[9px] text-slate-600">{timeAgo}</span>}
        </div>
      </div>
      <button type="button"
        onClick={e => { e.stopPropagation(); navigate(`/u/${userId}`, { state: { profile: job } }); }}
        className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition-all active:scale-95">
        Apply
      </button>
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
// PREMIUM WORKER HOME
// ════════════════════════════════════════════════════════════════
function WorkerHome({
  user, geo, availability, toggleAvailability,
  jobs, loading, employers, employersLoading,
  retrying, error, handleRefresh, navigate, t,
}) {
  const [searchQuery, setSearchQuery]     = useState("");
  const [activeFilter, setActiveFilter]   = useState(null);
  const [contactTarget, setContactTarget] = useState(null);
  const directoryRef = useRef(null);

  // Stable callback for ContactModal — prevents effect re-registration on every render
  const handleCloseContact = useCallback(() => setContactTarget(null), []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12)  return t("dashboard.greetMorning");
    if (h >= 12 && h < 18) return t("dashboard.greetAfternoon");
    return t("dashboard.greetEvening");
  }, [t]);

  const firstName = user?.name?.split(" ")[0] || "";
  const rating    = user?.stats?.rating ?? user?.rating ?? null;
  const verified  = !!user?.verified;
  const avatarSrc = user?.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "user")}`;

  // Derived lists — only recomputed when source data changes
  const companyMembers = useMemo(() => employers.filter(e =>  EMPLOYER_ROLES.has(e.role)), [employers]);
  const topCompanies   = useMemo(() => [...companyMembers].sort((a, b) => (b.stats?.jobsPosted || 0) - (a.stats?.jobsPosted || 0)), [companyMembers]);
  const featuredJobs   = useMemo(() => jobs.slice(0, 10), [jobs]);

  return (
    <>
      <ContactModal employer={contactTarget} onClose={handleCloseContact} navigate={navigate} />

      <div className="pb-8 space-y-5">

        {/* ── STORIES ─────────────────────────────────────────────── */}
        <StoryRing />

        {/* ── 1. QUICK DASHBOARD ──────────────────────────────────── */}
        <div className="mx-4">
          <div className="bg-gradient-to-br from-slate-800/80 via-[#111827] to-[#0a1628] border border-slate-700/50 rounded-3xl p-4 shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">{greeting}</p>
                <h1 className="text-[18px] font-black text-white leading-tight">{firstName || user?.name}</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                  <span className="text-[11px] text-slate-400">{geo.city}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <img src={avatarSrc} alt={user?.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg"
                  onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=user`; }} />
                <button type="button" onClick={toggleAvailability} aria-pressed={availability === 'available'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border transition-all active:scale-95 ${
                    availability === 'available'
                      ? 'bg-green-500/15 border-green-500/30 text-green-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${availability === 'available' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                  {availability === 'available' ? 'Disponib' : 'Okipe'}
                </button>
              </div>
            </div>
            {retrying && (
              <p className="text-[10px] text-amber-400 mb-2 animate-pulse" aria-live="polite">
                {t('dashboard.reconnecting')}
              </p>
            )}
            {/* Stat tiles */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: '💼', label: 'Nouvo Djòb', value: loading ? '…' : (jobs.length || 18), color: 'text-amber-400',  path: '/jobs'    },
                { icon: '💬', label: 'Mesaj',      value: user?.stats?.messages    ?? 5,        color: 'text-blue-400',  path: '/chat'    },
                { icon: '📅', label: 'Rezèvas',    value: user?.stats?.reservations ?? 3,       color: 'text-indigo-400',path: '/booking' },
                { icon: '💳', label: 'Wallet',     value: '$245',                               color: 'text-green-400', path: '/wallet'  },
              ].map(s => (
                <button key={s.label} type="button" onClick={() => navigate(s.path)}
                  className="flex flex-col items-center gap-1 p-2 bg-slate-800/50 rounded-2xl border border-slate-700/40 hover:border-amber-500/30 transition-all active:scale-95">
                  <span className="text-base leading-none">{s.icon}</span>
                  <span className={`text-sm font-black leading-none ${s.color}`}>{s.value}</span>
                  <span className="text-[7px] text-slate-500 text-center leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ────────────────────────────────────────── */}
        <div className="px-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2.5">⚡ Quick Actions</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon:'💼', label:'Find Job',       path:'/jobs'              },
              { icon:'🛠', label:'Offer Service',  path:'/provider-dashboard'},
              { icon:'📝', label:'Post Job',       path:'/post-job'          },
              { icon:'🛒', label:'Marketplace',    path:'/market'            },
              { icon:'📅', label:'Reservations',   path:'/booking'           },
              { icon:'💳', label:'Payments',       path:'/wallet'            },
              { icon:'💬', label:'Messages',       path:'/chat'              },
              { icon:'🔍', label:'Search',         path:'/search'            },
            ].map(a => (
              <button key={a.label} type="button" onClick={() => navigate(a.path)}
                className="flex flex-col items-center gap-1.5 py-3 bg-[#0d1526] border border-slate-800 rounded-2xl hover:border-amber-500/30 transition-all active:scale-95">
                <span className="text-xl leading-none">{a.icon}</span>
                <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 2. SEARCH BAR ────────────────────────────────────────── */}
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/50 rounded-2xl px-3 py-3
            focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/10 transition-all shadow-inner">
            <Search className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') navigate(`/search?q=${encodeURIComponent(searchQuery)}`); }}
              placeholder="Chèche djòb, antrepriz, sèvis…"
              aria-label="Rechèch"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Efase rechèch"
                className="text-slate-500 hover:text-white shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center gap-0.5 border-l border-slate-700/50 pl-2 ml-1">
              <button type="button" aria-label="Rechèch vwa"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button type="button" aria-label="Scanner QR"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/70 transition-all">
                <QrCode className="w-3.5 h-3.5" />
              </button>
              <button type="button" aria-label="Filtè avanse"
                onClick={() => setActiveFilter(prev => prev === 'advanced' ? null : 'advanced')}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  activeFilter === 'advanced' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800/70'
                }`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── 3. SMART FILTER CHIPS — 9 items ─────────────────────── */}
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {SMART_FILTERS.map(f => (
              <button key={f.id} type="button"
                onClick={() => setActiveFilter(prev => prev === f.id ? null : f.id)}
                aria-pressed={activeFilter === f.id}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
                  activeFilter === f.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-900/70 text-slate-400 border-slate-700/50 hover:border-amber-500/30 hover:text-slate-300'
                }`}>
                <span aria-hidden="true">{f.icon}</span> {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. SERVICES SECTION ──────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">🏪 Sektè &amp; Sèvis</p>
            <button type="button" onClick={() => navigate('/marketplace')}
              className="text-[11px] text-amber-400 font-bold flex items-center gap-1 hover:text-amber-300 transition-colors">
              Wè tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mx-4 rounded-[20px] overflow-hidden bg-[#111827] border border-[#1F2937]">
            {SERVICE_INDUSTRIES.map((s, idx, arr) => (
              <React.Fragment key={s.id}>
                <button type="button" onClick={() => navigate(`/marketplace/${s.role}`)}
                  className="flex items-center gap-3 w-full px-4 py-4 hover:bg-white/[0.015] transition-colors active:bg-white/[0.025] text-left"
                  style={{ WebkitTapHighlightColor: 'transparent' }}>
                  <div className="w-11 h-11 rounded-[14px] bg-[#1A2335] flex items-center justify-center text-2xl shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-white">{s.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.count.toLocaleString()} {s.unit}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700 shrink-0" />
                </button>
                {idx < arr.length - 1 && <div className="h-px mx-4 bg-[#1F2937]" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mx-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        {/* ── 5. FEATURED JOBS — list style (LinkedIn / Indeed) ────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <p className="text-[12px] font-black uppercase tracking-widest text-orange-400">🔥 Trending Jobs</p>
            <button type="button" onClick={() => navigate('/jobs')}
              className="text-[11px] text-slate-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors">
              Wè tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mx-4 rounded-[20px] overflow-hidden bg-[#111827] border border-[#1F2937]">
            {loading
              ? [1, 2, 3].map(i => (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-3 px-4 py-4 animate-pulse">
                      <div className="w-12 h-12 rounded-[14px] bg-[#1F2937] shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-[#1F2937] rounded-full w-3/4" />
                        <div className="h-2 bg-[#1F2937] rounded-full w-1/2" />
                        <div className="h-2 bg-[#1F2937] rounded-full w-1/3" />
                      </div>
                      <div className="w-14 h-8 rounded-xl bg-[#1F2937] shrink-0" />
                    </div>
                    {i < 2 && <div className="h-px mx-4 bg-[#1F2937]" />}
                  </React.Fragment>
                ))
              : featuredJobs.length > 0
                ? featuredJobs.slice(0, 5).map((j, idx, arr) => (
                    <React.Fragment key={j._id || j.id || idx}>
                      <JobListCard job={j} navigate={navigate} userCity={geo.city} />
                      {idx < arr.length - 1 && <div className="h-px mx-4 bg-[#1F2937]" />}
                    </React.Fragment>
                  ))
                : <div className="text-center py-8 text-slate-500 text-sm">{t('dashboard.emptyJobsTitle')}</div>
            }
          </div>
        </div>

        {/* ── 6. AI RECOMMENDATIONS ────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <p className="text-[12px] font-black uppercase tracking-widest text-indigo-400">✨ AI Recommendations</p>
            <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full font-bold">Pou ou</span>
          </div>
          <div className="mx-4 rounded-[20px] overflow-hidden bg-[#111827] border border-[#1F2937]">
            {MOCK_AI_RECS.map((rec, idx, arr) => (
              <React.Fragment key={rec.id}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="w-11 h-11 rounded-[14px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shrink-0">
                    {rec.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-white">{rec.profession}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                          style={{ width: `${rec.match}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-indigo-400 shrink-0">{rec.match}% Match</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => navigate('/search')}
                    className="shrink-0 px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[11px] font-black hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all active:scale-95">
                    Apply
                  </button>
                </div>
                {idx < arr.length - 1 && <div className="h-px mx-4 bg-[#1F2937]" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── AI SMART FEED ────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Recommended Products */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4">
              <p className="text-[12px] font-black uppercase tracking-widest text-orange-400">🛒 Recommended Products</p>
              <button type="button" onClick={() => navigate('/market')}
                className="text-[11px] text-slate-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors">
                Wè tout <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth:'none' }}>
              {[
                { icon:'📱', name:'iPhone 16 Pro', price:'$1,099', seller:'TechShop', match:95 },
                { icon:'💻', name:'MacBook Pro M3', price:'$2,499', seller:'iCenter', match:88 },
                { icon:'🚗', name:'Toyota Hilux',   price:'$32,000',seller:'AutoDeal',match:82 },
                { icon:'⚡', name:'Groupe élect. 5KW',price:'$3,500',seller:'PowerDR',match:76 },
              ].map(p => (
                <button key={p.name} type="button" onClick={() => navigate('/market')}
                  className="shrink-0 w-32 flex flex-col gap-2 p-3 bg-[#0d1526] border border-slate-800 rounded-2xl hover:border-amber-500/30 transition-all active:scale-95 text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl">{p.icon}</div>
                  <div>
                    <p className="text-[11px] font-black text-white leading-tight truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.seller}</p>
                    <p className="text-[11px] font-black text-amber-400 mt-1">{p.price}</p>
                  </div>
                  <span className="self-start text-[8px] bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
                    {p.match}% match
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Hotels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4">
              <p className="text-[12px] font-black uppercase tracking-widest text-blue-400">🏨 Recommended Hotels</p>
              <button type="button" onClick={() => navigate('/marketplace/hotel')}
                className="text-[11px] text-slate-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors">
                Wè tout <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="px-4 space-y-2">
              {[
                { name:'Hotel Montana',      city:'Port-au-Prince', price:'$120/nuit', stars:4, verified:true  },
                { name:'Royal Decameron DR', city:'Montrouis',      price:'$280/nuit', stars:5, verified:true  },
                { name:'Karibe Convention',  city:'Pétionville',    price:'$150/nuit', stars:4, verified:false },
              ].map(h => (
                <div key={h.name}
                  className="flex items-center gap-3 p-3 bg-[#0d1526] border border-slate-800 rounded-2xl hover:border-blue-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl shrink-0">🏨</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-black text-white truncate">{h.name}</p>
                      {h.verified && <span className="text-[8px] text-amber-400">✓</span>}
                    </div>
                    <p className="text-xs text-slate-400">{h.city} · {'★'.repeat(h.stars)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-black text-amber-400">{h.price}</p>
                    <button type="button" onClick={() => navigate('/booking')}
                      className="mt-1 text-[9px] font-black px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                      Rezève
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Workers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4">
              <p className="text-[12px] font-black uppercase tracking-widest text-emerald-400">👷 Recommended Workers</p>
              <button type="button" onClick={() => navigate('/search')}
                className="text-[11px] text-slate-500 hover:text-amber-400 font-bold flex items-center gap-1 transition-colors">
                Wè tout <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex gap-2.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth:'none' }}>
              {[
                { icon:'⚡', name:'Jean-Pierre M.', job:'Électricien',  rating:4.9, match:94, avail:true  },
                { icon:'👩‍⚕️', name:'Marie Celeste', job:'Infirmière',   rating:4.8, match:89, avail:true  },
                { icon:'👨‍🍳', name:'Carlos Mendez', job:'Chef Kuyinye', rating:5.0, match:85, avail:false },
                { icon:'🔧', name:'Paul Fils',      job:'Plombye',      rating:4.7, match:79, avail:true  },
              ].map(w => (
                <button key={w.name} type="button" onClick={() => navigate('/search')}
                  className="shrink-0 w-28 flex flex-col items-center gap-2 p-3 bg-[#0d1526] border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all active:scale-95">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">{w.icon}</div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-white leading-tight">{w.name}</p>
                    <p className="text-[9px] text-slate-500">{w.job}</p>
                    <p className="text-[9px] text-amber-400 font-bold">★ {w.rating}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                    w.avail ? 'bg-green-500/15 border border-green-500/25 text-green-400' : 'bg-slate-800 border border-slate-700 text-slate-500'
                  }`}>
                    {w.avail ? 'Disponib' : 'Okipe'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── TOP COMPANIES ────────────────────────────────────────── */}
        <HSection icon="🏢" titleKey="topCompanies" accentColor="text-blue-400" t={t}
          onViewAll={() => directoryRef.current?.scrollIntoView({ behavior: 'smooth' })}>
          {employersLoading
            ? [1, 2, 3].map(i => <PremiumSkeleton key={i} wide />)
            : topCompanies.length > 0
              ? topCompanies.map((c, i) => <PremiumCompanyCard key={c._id || c.id || i} company={c} navigate={navigate} t={t} onContact={setContactTarget} />)
              : <PremiumEmpty emoji="🏢" title={t('dashboard.noEmployers')} subtitle={t('dashboard.noEmployersYet')} />
          }
        </HSection>

        {/* ── FULL EMPLOYER DIRECTORY ──────────────────────────────── */}
        <div ref={directoryRef} className="px-4 space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
              {t('dashboard.employersTitle')}
            </p>
          </div>
          <EmployerDirectory searchQuery={searchQuery} onContact={setContactTarget} />
        </div>

      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD — role-aware root
// ════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user }   = useAuth();
  const { t }      = useTranslation();
  const roleKey    = user?.role ?? "worker";
  const isWorker   = !isEmployerRole(roleKey);
  const dashConfig = getRoleDashboard(roleKey);
  const navigate   = useNavigate();

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [retrying, setRetrying] = useState(false);
  const [jobs, setJobs]         = useState(jobsCache || []);

  const isCompanyRole    = roleKey === "company" || roleKey === "business";
  const [companyTab, setCompanyTab]       = useState("overview");
  const isEnterpriseRole = roleKey === "enterprise";
  const [enterpriseTab, setEnterpriseTab] = useState("overview");

  const [availability, setAvailability] = useState(user?.availability || "available");
  const [geo, setGeo] = useState({
    lat:  user?.location?.coordinates?.latitude  || 18.5432,
    lng:  user?.location?.coordinates?.longitude || -72.3395,
    city: user?.location?.city || "GPS",
  });
  const [employers, setEmployers]               = useState([]);
  const [employersLoading, setEmployersLoading] = useState(true);

  const abortRef      = useRef(null);
  const mountedRef    = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const inFlightRef   = useRef(false);

  useEffect(() => () => {
    mountedRef.current = false;
    abortRef.current?.abort();
    clearTimeout(retryTimerRef.current);
    inFlightRef.current = false;
  }, []);

  const fetchJobs = useCallback(async (isRetry = false) => {
    const now = Date.now();
    const hasCache = jobsCache && now - cacheTime < CACHE_TTL;
    if (inFlightRef.current && !isRetry) return;
    inFlightRef.current = true;
    try {
      if (!mountedRef.current) return;
      setError("");
      if (!isRetry && hasCache) { setJobs(jobsCache); setLoading(false); return; }
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await API.get("/jobs", { signal: controller.signal });
      if (!mountedRef.current) return;
      const data = Array.isArray(res?.data) ? res.data : [];
      jobsCache = data; cacheTime = now;
      setJobs(data);
      retryCountRef.current = 0; setRetrying(false);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      retryCountRef.current += 1;
      setError(err?.response?.data?.message || err?.message || "Erè pandan chajman");
      if (retryCountRef.current <= 2 && !retryTimerRef.current) {
        setRetrying(true);
        const delay = Math.min(1500 * retryCountRef.current, 5000);
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          if (mountedRef.current && !inFlightRef.current) fetchJobs(true);
        }, delay);
      } else { setRetrying(false); }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isWorker) return;
    let alive = true;
    API.get("/community/members?limit=100", { timeout: 15000 })
      .then(res => {
        if (!alive) return;
        const all = Array.isArray(res?.data?.data) ? res.data.data : [];
        setEmployers(all);
      })
      .catch(() => {})
      .finally(() => { if (alive) setEmployersLoading(false); });
    return () => { alive = false; };
  }, [isWorker]);

  useEffect(() => { if (isWorker) fetchJobs(); }, [fetchJobs, isWorker]);

  const handleRefresh = useCallback(() => {
    retryCountRef.current = 0; setRetrying(false); setError("");
    clearTimeout(retryTimerRef.current); retryTimerRef.current = null;
    abortRef.current?.abort(); abortRef.current = null;
    fetchJobs(true);
  }, [fetchJobs]);

  useEffect(() => {
    if (!isWorker || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let city = geo.city;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "fr,ht,es" } }
          );
          const d = await r.json();
          city = d.address?.city || d.address?.town || d.address?.village || d.address?.municipality || city;
        } catch {}
        if (mountedRef.current) setGeo({ lat, lng, city });
      },
      () => {}
    );
  }, [isWorker]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAvailability = useCallback(() => {
    const next = availability === "available" ? "busy" : "available";
    setAvailability(next);
    API.patch("/workers/availability", { userId: user?._id || user?.id, availability: next }).catch(() => {});
  }, [availability, user]);

  // ── Company dashboard ────────────────────────────────────────
  if (isCompanyRole) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {dashConfig.greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{dashConfig.subtitle}</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {COMPANY_TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setCompanyTab(tab.id)}
              aria-pressed={companyTab === tab.id}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                companyTab === tab.id ? "bg-blue-500 text-white" : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {companyTab === "overview" ? (
          <div className="space-y-4"><CompanyOverviewSupplement user={user} /><RoleDashboard dashConfig={dashConfig} /></div>
        ) : (
          <CompanyContent tab={companyTab} user={user} />
        )}
      </div>
    );
  }

  // ── Enterprise dashboard ─────────────────────────────────────
  if (isEnterpriseRole) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {dashConfig.greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{dashConfig.subtitle}</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {ENTERPRISE_TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setEnterpriseTab(tab.id)}
              aria-pressed={enterpriseTab === tab.id}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                enterpriseTab === tab.id ? "bg-indigo-500 text-white" : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {enterpriseTab === "overview" ? (
          <div className="space-y-4"><EnterpriseOverviewSupplement user={user} /><RoleDashboard dashConfig={dashConfig} /></div>
        ) : (
          <EnterpriseContent tab={enterpriseTab} user={user} />
        )}
      </div>
    );
  }

  if (!isWorker) return <RoleDashboard dashConfig={dashConfig} />;

  return (
    <WorkerHome
      user={user} geo={geo}
      availability={availability} toggleAvailability={toggleAvailability}
      jobs={jobs} loading={loading}
      employers={employers} employersLoading={employersLoading}
      retrying={retrying} error={error} handleRefresh={handleRefresh}
      navigate={navigate} t={t}
    />
  );
}
