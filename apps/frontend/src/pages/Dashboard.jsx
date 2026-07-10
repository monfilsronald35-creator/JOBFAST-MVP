import React, {
  useEffect, useState, useCallback, useRef, memo, useMemo,
} from "react";
import {
  Search, Building2, MapPin, Briefcase, Star, CheckCircle,
  ArrowRight, RefreshCcw, Navigation, Bookmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRoleDashboard, isEmployerRole } from "../config/roleConfig";
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

// ── 15 Service categories ────────────────────────────────────────
const SERVICE_CATEGORIES = [
  { id: "construction", emoji: "🏗", key: "catConstruction", gradient: "from-orange-600/20 to-transparent"  },
  { id: "restaurant",   emoji: "🍽", key: "catRestaurant",   gradient: "from-yellow-500/20 to-transparent"  },
  { id: "hotels",       emoji: "🏨", key: "catHotels",       gradient: "from-blue-600/20 to-transparent"    },
  { id: "delivery",     emoji: "🚚", key: "catDelivery",     gradient: "from-cyan-600/20 to-transparent"    },
  { id: "cleaning",     emoji: "🧹", key: "catCleaning",     gradient: "from-teal-600/20 to-transparent"    },
  { id: "transport",    emoji: "🚖", key: "catTransport",    gradient: "from-violet-600/20 to-transparent"  },
  { id: "it",           emoji: "💻", key: "catIT",           gradient: "from-indigo-600/20 to-transparent"  },
  { id: "electrician",  emoji: "⚡", key: "catElectrician",  gradient: "from-amber-500/20 to-transparent"   },
  { id: "plumbing",     emoji: "🚰", key: "catPlumbing",     gradient: "from-sky-600/20 to-transparent"     },
  { id: "design",       emoji: "🎨", key: "catDesign",       gradient: "from-pink-600/20 to-transparent"    },
  { id: "healthcare",   emoji: "🏥", key: "catHealthcare",   gradient: "from-red-600/20 to-transparent"     },
  { id: "office",       emoji: "🏢", key: "catOffice",       gradient: "from-slate-600/20 to-transparent"   },
  { id: "education",    emoji: "🎓", key: "catEducation",    gradient: "from-emerald-600/20 to-transparent" },
  { id: "retail",       emoji: "🛍", key: "catRetail",       gradient: "from-purple-600/20 to-transparent"  },
  { id: "homeservices", emoji: "🏠", key: "catHomeServices", gradient: "from-amber-600/20 to-transparent"   },
];

// ── Cache ─────────────────────────────────────────────────────────
let jobsCache = null;
let cacheTime  = 0;
const CACHE_TTL = 15000;

// ── Category job counts (illustrative — replaced by live data when available) ──
const CATEGORY_JOB_COUNTS = {
  construction: "142+", restaurant: "89+", hotels:       "34+",
  delivery:     "210+", cleaning:   "67+", transport:    "95+",
  it:           "58+",  electrician:"43+", plumbing:     "31+",
  design:       "76+",  healthcare: "52+", office:       "28+",
  education:    "19+",  retail:     "113+",homeservices: "88+",
};

// ════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ════════════════════════════════════════════════════════════════

function PremiumSkeleton({ wide }) {
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
}

function PremiumEmpty({ emoji, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="shrink-0 w-72 flex flex-col items-center justify-center text-center px-6 py-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800/60">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/40 flex items-center justify-center mb-3 shadow-xl shadow-black/20">
        <span className="text-3xl">{emoji}</span>
      </div>
      <p className="text-[13px] font-bold text-slate-300 mb-1">{title}</p>
      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{subtitle}</p>
      {actionLabel && (
        <button onClick={onAction}
          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-[11px] font-black active:scale-95 transition shadow-lg shadow-amber-500/20">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────
function HSection({ icon, titleKey, accentColor, children, onViewAll, t }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-[18px] leading-none">{icon}</span>
          <p className={`text-[12px] font-black uppercase tracking-widest ${accentColor}`}>
            {t(`dashboard.${titleKey}`)}
          </p>
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-400 transition font-bold">
            {t("dashboard.viewAll")} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {children}
      </div>
    </div>
  );
}

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
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white leading-tight truncate max-w-[95px]">{company || "Company"}</p>
            {rating && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-amber-400 font-bold">{Number(rating).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        <button type="button" onClick={e => { e.stopPropagation(); setBookmarked(b => !b); }}
          className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border transition-all ${
            bookmarked
              ? "bg-amber-500 border-amber-500 text-slate-950"
              : "bg-slate-800/60 border-slate-700/40 text-slate-500 hover:border-amber-500/50 hover:text-amber-400"
          }`}>
          <Bookmark className="w-3.5 h-3.5" fill={bookmarked ? "currentColor" : "none"} />
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
            <MapPin className="w-2 h-2 text-amber-400/70 shrink-0" />{location}
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
          {t("dashboard.applyNow")} <ArrowRight className="w-3 h-3" />
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
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0b1120] bg-green-500 shadow-md" />
      </div>
      <div className="text-center w-full">
        <p className="text-[12px] font-bold text-white truncate leading-tight">{worker.name}</p>
        <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-tight">{profession}</p>
      </div>
      {rating ? (
        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-bold text-amber-300">{Number(rating).toFixed(1)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-green-400">Online</span>
        </div>
      )}
      {city && (
        <p className="text-[9px] text-slate-600 truncate flex items-center gap-1 w-full justify-center">
          <MapPin className="w-2.5 h-2.5 shrink-0" />{city}
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
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
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
            <Briefcase className="w-3 h-3" />{jobsCount} jobs
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
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-green-500" />
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
          <MapPin className="w-3 h-3 shrink-0" />{city}
        </div>
      )}
      <button type="button" onClick={() => onContact(emp)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black active:scale-95 transition">
        <Briefcase className="w-3.5 h-3.5" />
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
          <p className="text-4xl">🏢</p>
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
  if (!employer) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
        <div className="flex items-center gap-3">
          <img src={employer.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employer.name)}`}
            alt={employer.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
          <div>
            <p className="font-bold text-white">{employer.name}</p>
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

  const SEARCH_FILTERS = [
    { id: "location", icon: "📍", key: "filterLocation" },
    { id: "distance", icon: "🎯", key: "filterDistance" },
    { id: "category", icon: "🧰", key: "filterCategory" },
    { id: "language", icon: "🗣",  key: "filterLanguage" },
  ];

  const workerMembers  = employers.filter(e => !EMPLOYER_ROLES.has(e.role));
  const companyMembers = employers.filter(e => EMPLOYER_ROLES.has(e.role));
  const topCompanies   = [...companyMembers].sort((a, b) => (b.stats?.jobsPosted || 0) - (a.stats?.jobsPosted || 0));
  const featuredJobs   = jobs.slice(0, 10);
  const recentJobs     = [...jobs].reverse().slice(0, 10);

  return (
    <>
      <ContactModal employer={contactTarget} onClose={() => setContactTarget(null)} navigate={navigate} />

      <div className="pb-8 space-y-5">

        {/* ── PREMIUM HERO ────────────────────────────────────────── */}
        <div className="mx-4 relative rounded-3xl overflow-hidden p-5 border border-slate-800/50 shadow-2xl shadow-black/60">
          {/* Layered backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#1a1240] to-[#0a1628]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_55%)]" />
          {/* Decorative blurs — animated for a "living" gradient feel */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "3s" }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/6 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: "4s", animationDelay: "1.2s" }} />
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-violet-500/4 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: "5s", animationDelay: "0.6s" }} />

          <div className="relative">
            {/* Avatar + greeting row */}
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <img src={avatarSrc} alt={user?.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl shadow-black/40" />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111827] shadow-md ${
                  availability === "available" ? "bg-green-500" : "bg-slate-500"
                }`} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 leading-tight">{greeting}</p>
                <h1 className="text-[15px] font-bold text-slate-300 leading-tight mt-0.5">
                  {t("dashboard.welcomeBack")},
                </h1>
                <h2 className="text-[22px] font-black text-white leading-tight tracking-tight truncate">
                  {firstName || user?.name}
                </h2>
              </div>
              {/* Availability toggle */}
              <button type="button" onClick={toggleAvailability}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all active:scale-95 mt-1 ${
                  availability === "available"
                    ? "bg-green-500/15 border-green-500/30 text-green-400 shadow-lg shadow-green-500/10"
                    : "bg-slate-800/60 border-slate-700/50 text-slate-400"
                }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${availability === "available" ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
                {availability === "available" ? t("dashboard.available") : t("dashboard.busy")}
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-[12px] text-slate-400 mt-2.5 leading-relaxed">{t("dashboard.heroSubtitle")}</p>

            {/* Profile chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/40 backdrop-blur-sm">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-[10px] font-semibold text-slate-300">{geo.city}</span>
              </div>
              {rating && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="text-[10px] font-bold text-amber-300">{Number(rating).toFixed(1)}</span>
                </div>
              )}
              {verified && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                  <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-semibold text-emerald-300">{t("dashboard.verified")}</span>
                </div>
              )}
            </div>

            {retrying && (
              <p className="text-[10px] text-amber-400 mt-2 animate-pulse">{t("dashboard.reconnecting")}</p>
            )}
          </div>
        </div>

        {/* ── PREMIUM SEARCH ───────────────────────────────────────── */}
        <div className="px-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2.5 bg-slate-900/80 border border-slate-700/50 rounded-2xl px-4 py-3 shadow-inner
              focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/10 transition-all">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("dashboard.searchPlaceholder")}
                className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-500 outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}
                  className="text-slate-500 hover:text-white text-xs w-4 h-4 flex items-center justify-center shrink-0">✕</button>
              )}
            </div>
            <button type="button" onClick={handleRefresh}
              className="w-11 h-11 flex items-center justify-center bg-slate-900/80 border border-slate-700/50 rounded-2xl text-slate-400 hover:text-amber-400 hover:border-amber-500/40 active:scale-95 transition-all shrink-0">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {SEARCH_FILTERS.map(f => (
              <button key={f.id} type="button"
                onClick={() => setActiveFilter(prev => prev === f.id ? null : f.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                  activeFilter === f.id
                    ? "bg-amber-500 text-slate-950 border-amber-500 shadow-lg shadow-amber-500/20"
                    : "bg-slate-900/70 text-slate-400 border-slate-700/50 hover:border-amber-500/30 hover:text-slate-300"
                }`}>
                <span>{f.icon}</span>
                <span>{t(`dashboard.${f.key}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── TWO PREMIUM ACTION BUTTONS ────────────────────────────── */}
        <div className="px-4 grid grid-cols-2 gap-3">
          {/* Find Work — primary */}
          <button type="button" onClick={() => directoryRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="relative overflow-hidden flex flex-col items-center justify-center gap-2 py-5 rounded-2xl
              bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black
              active:scale-[0.97] transition-all duration-200 shadow-xl shadow-amber-500/30 group">
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-2xl" />
            <span className="text-[26px] leading-none relative">🔍</span>
            <span className="text-[13px] font-black relative">{t("dashboard.findWork")}</span>
            <span className="text-[9px] font-semibold opacity-60 relative">{t("dashboard.findWorkSub")}</span>
          </button>

          {/* Offer Services — secondary */}
          <button type="button" onClick={() => navigate("/post-job")}
            className="relative overflow-hidden flex flex-col items-center justify-center gap-2 py-5 rounded-2xl
              bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 text-white font-black
              active:scale-[0.97] transition-all duration-200 shadow-xl shadow-black/30 group hover:border-amber-500/30">
            <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-all duration-300 rounded-2xl" />
            <span className="text-[26px] leading-none relative">⚡</span>
            <span className="text-[13px] font-black relative">{t("dashboard.offerServices")}</span>
            <span className="text-[9px] font-semibold opacity-40 relative">{t("dashboard.offerServicesSub")}</span>
          </button>
        </div>

        {/* ── SERVICE CATEGORY CAROUSEL (15 categories) ────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4">
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">{t("dashboard.categories")}</p>
            <button type="button" onClick={() => navigate("/search")}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition font-bold">
              {t("dashboard.viewAll")} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {SERVICE_CATEGORIES.map(cat => {
              const count = CATEGORY_JOB_COUNTS[cat.id];
              return (
                <button key={cat.id} type="button" onClick={() => navigate("/search")}
                  className={`shrink-0 w-[78px] flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border
                    bg-gradient-to-b ${cat.gradient} bg-slate-900/80 border-slate-800/60 text-slate-300
                    hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40
                    active:scale-95 transition-all duration-200 relative overflow-hidden group`}>
                  {/* Hover glow overlay */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/3 rounded-2xl transition-all duration-300" />
                  <span className="text-[24px] leading-none relative">{cat.emoji}</span>
                  <span className="text-[9px] font-bold leading-tight text-center px-1 w-full truncate text-slate-400 relative">
                    {t(`dashboard.${cat.key}`)}
                  </span>
                  {count && (
                    <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full leading-none relative">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mx-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>
        )}

        {/* ── FEATURED JOBS ───────────────────────────────────────── */}
        <HSection icon="🔥" titleKey="featuredJobs" accentColor="text-orange-400" t={t}
          onViewAll={() => navigate("/search")}>
          {loading
            ? [1, 2, 3].map(i => <PremiumSkeleton key={i} wide />)
            : featuredJobs.length > 0
              ? featuredJobs.map((j, i) => <PremiumJobCard key={j._id || j.id || i} job={j} navigate={navigate} t={t} userCity={geo.city} />)
              : <PremiumEmpty emoji="💼" title={t("dashboard.emptyJobsTitle")} subtitle={t("dashboard.emptyJobsSubtitle")} actionLabel={t("dashboard.viewAll")} onAction={() => navigate("/search")} />
          }
        </HSection>

        {/* ── RECOMMENDED FOR YOU ─────────────────────────────────── */}
        <HSection icon="⭐" titleKey="recommended" accentColor="text-amber-400" t={t}
          onViewAll={() => navigate("/search")}>
          {loading
            ? [1, 2, 3].map(i => <PremiumSkeleton key={i} wide />)
            : workerMembers.length > 0
              ? workerMembers.slice(0, 8).map((w, i) => <PremiumWorkerCard key={w._id || w.id || i} worker={w} navigate={navigate} t={t} />)
              : featuredJobs.length > 0
                ? featuredJobs.slice(0, 4).map((j, i) => <PremiumJobCard key={j._id || j.id || i} job={j} navigate={navigate} t={t} userCity={geo.city} />)
                : <PremiumEmpty emoji="⭐" title={t("dashboard.emptyWorkersTitle")} subtitle={t("dashboard.emptyWorkersSubtitle")} actionLabel={t("dashboard.searchNow")} onAction={() => navigate("/search")} />
          }
        </HSection>

        {/* ── NEARBY WORKERS ───────────────────────────────────────── */}
        <HSection icon="📍" titleKey="nearbyWorkers" accentColor="text-emerald-400" t={t}
          onViewAll={() => navigate("/search")}>
          {employersLoading
            ? [1, 2, 3, 4].map(i => <PremiumSkeleton key={i} />)
            : workerMembers.length > 0
              ? workerMembers.map((w, i) => <PremiumWorkerCard key={w._id || w.id || i} worker={w} navigate={navigate} t={t} />)
              : <PremiumEmpty emoji="📍" title={t("dashboard.emptyWorkersTitle")} subtitle={t("dashboard.emptyWorkersSubtitle")} actionLabel={t("dashboard.searchNow")} onAction={() => navigate("/search")} />
          }
        </HSection>

        {/* ── TOP COMPANIES ────────────────────────────────────────── */}
        <HSection icon="🏢" titleKey="topCompanies" accentColor="text-blue-400" t={t}
          onViewAll={() => directoryRef.current?.scrollIntoView({ behavior: "smooth" })}>
          {employersLoading
            ? [1, 2, 3].map(i => <PremiumSkeleton key={i} wide />)
            : topCompanies.length > 0
              ? topCompanies.map((c, i) => <PremiumCompanyCard key={c._id || c.id || i} company={c} navigate={navigate} t={t} onContact={emp => setContactTarget(emp)} />)
              : <PremiumEmpty emoji="🏢" title={t("dashboard.noEmployers")} subtitle={t("dashboard.noEmployersYet")} />
          }
        </HSection>

        {/* ── HIGHEST PAYING ───────────────────────────────────────── */}
        <HSection icon="💰" titleKey="highestPaying" accentColor="text-green-400" t={t}
          onViewAll={() => navigate("/search")}>
          {loading
            ? [1, 2].map(i => <PremiumSkeleton key={i} wide />)
            : featuredJobs.length > 0
              ? featuredJobs.slice(0, 5).map((j, i) => <PremiumJobCard key={j._id || j.id || i} job={j} navigate={navigate} t={t} userCity={geo.city} />)
              : <PremiumEmpty emoji="💰" title={t("dashboard.emptyJobsTitle")} subtitle={t("dashboard.emptyJobsSubtitle")} actionLabel={t("dashboard.viewAll")} onAction={() => navigate("/search")} />
          }
        </HSection>

        {/* ── RECENTLY POSTED ──────────────────────────────────────── */}
        <HSection icon="🆕" titleKey="recentlyPosted" accentColor="text-sky-400" t={t}
          onViewAll={() => navigate("/search")}>
          {loading
            ? [1, 2, 3].map(i => <PremiumSkeleton key={i} wide />)
            : recentJobs.length > 0
              ? recentJobs.map((j, i) => <PremiumJobCard key={j._id || j.id || i} job={j} navigate={navigate} t={t} userCity={geo.city} />)
              : <PremiumEmpty emoji="🆕" title={t("dashboard.emptyJobsTitle")} subtitle={t("dashboard.emptyJobsSubtitle")} actionLabel={t("dashboard.searchNow")} onAction={() => navigate("/search")} />
          }
        </HSection>

        {/* ── VERIFIED EMPLOYERS ───────────────────────────────────── */}
        <HSection icon="🏆" titleKey="verifiedEmployers" accentColor="text-indigo-400" t={t}
          onViewAll={() => directoryRef.current?.scrollIntoView({ behavior: "smooth" })}>
          {employersLoading
            ? [1, 2, 3].map(i => <PremiumSkeleton key={i} wide />)
            : companyMembers.length > 0
              ? companyMembers.map((c, i) => <PremiumCompanyCard key={c._id || c.id || i} company={c} navigate={navigate} t={t} onContact={emp => setContactTarget(emp)} />)
              : <PremiumEmpty emoji="🏆" title={t("dashboard.noEmployers")} subtitle={t("dashboard.noEmployersYet")} />
          }
        </HSection>

        {/* ── TRENDING SERVICES ────────────────────────────────────── */}
        <HSection icon="🎯" titleKey="trending" accentColor="text-violet-400" t={t}
          onViewAll={() => navigate("/search")}>
          {employersLoading
            ? [1, 2, 3, 4].map(i => <PremiumSkeleton key={i} />)
            : workerMembers.slice(0, 8).length > 0
              ? workerMembers.slice(0, 8).map((w, i) => <PremiumWorkerCard key={w._id || w.id || i} worker={w} navigate={navigate} t={t} />)
              : <PremiumEmpty emoji="🎯" title={t("dashboard.emptyWorkersTitle")} subtitle={t("dashboard.emptyWorkersSubtitle")} actionLabel={t("dashboard.searchNow")} onAction={() => navigate("/search")} />
          }
        </HSection>

        {/* ── FULL EMPLOYER DIRECTORY ──────────────────────────────── */}
        <div ref={directoryRef} className="px-4 space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">
              {t("dashboard.employersTitle")}
            </p>
          </div>
          <EmployerDirectory searchQuery={searchQuery} onContact={emp => setContactTarget(emp)} />
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
            <button key={tab.id} onClick={() => setCompanyTab(tab.id)}
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
            <button key={tab.id} onClick={() => setEnterpriseTab(tab.id)}
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
