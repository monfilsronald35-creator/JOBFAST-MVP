import React, {
  useEffect, useState, useCallback, useRef, memo, useMemo,
} from "react";
import {
  Search, Building2, MapPin, Briefcase, Star,
  Wallet, MessageSquare, Globe, CheckCircle,
  ArrowRight, RefreshCcw, Navigation,
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

// ── Role colours ─────────────────────────────────────────────────
const ROLE_COLORS = {
  company:    { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30" },
  business:   { color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/30"   },
  enterprise: { color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" },
  employer:   { color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
};

// ── Employer card ─────────────────────────────────────────────────
const EmployerCard = memo(function EmployerCard({ emp, onContact }) {
  const { t } = useTranslation();
  const colors = ROLE_COLORS[emp.role] || { color: "text-slate-400", bg: "bg-slate-800/50 border-slate-700" };
  const roleKey = `dashboard.role${emp.role.charAt(0).toUpperCase()}${emp.role.slice(1)}`;
  const photo = emp.photo || emp.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name || "co")}`;
  const city = emp.location?.city || emp.city || "";
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

// ── Employer directory ────────────────────────────────────────────
const EMPLOYER_ROLES = new Set(["company", "business", "enterprise", "employer"]);

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
    return (!q || e.name?.toLowerCase().includes(q)
      || e.location?.city?.toLowerCase().includes(q)
      || e.profession?.toLowerCase().includes(q))
      && matchFilter;
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
              filter === f.id ? "bg-amber-500 text-slate-950" : "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}>
            {f.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          <p className="text-4xl">🏢</p>
          <p className="text-sm text-slate-400 font-semibold">{t("dashboard.noEmployers")}</p>
          <p className="text-xs text-slate-600">{searchQuery ? t("dashboard.noEmployersSearch") : t("dashboard.noEmployersYet")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visible.map((e, i) => <EmployerCard key={e.id || e._id || i} emp={e} onContact={onContact} />)}
        </div>
      )}
    </div>
  );
}

// ── Contact modal ─────────────────────────────────────────────────
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

// ── Cache ─────────────────────────────────────────────────────────
let jobsCache = null;
let cacheTime  = 0;
const CACHE_TTL = 15000;

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
// WORKER HOME SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════

const SERVICE_CATEGORIES = [
  { id: "construction", emoji: "🏗", key: "catConstruction" },
  { id: "restaurant",   emoji: "🍽", key: "catRestaurant"   },
  { id: "hotels",       emoji: "🏨", key: "catHotels"       },
  { id: "delivery",     emoji: "🚚", key: "catDelivery"     },
  { id: "cleaning",     emoji: "🧹", key: "catCleaning"     },
  { id: "transport",    emoji: "🚖", key: "catTransport"    },
  { id: "it",           emoji: "💻", key: "catIT"           },
  { id: "electrician",  emoji: "⚡", key: "catElectrician"  },
  { id: "plumbing",     emoji: "🚰", key: "catPlumbing"     },
  { id: "design",       emoji: "🎨", key: "catDesign"       },
];

const SECTION_META = [
  { key: "featuredJobs",      icon: "🔥", color: "text-orange-400"  },
  { key: "recommended",       icon: "⭐", color: "text-amber-400"   },
  { key: "nearbyWorkers",     icon: "📍", color: "text-emerald-400" },
  { key: "topCompanies",      icon: "🏢", color: "text-blue-400"    },
  { key: "highestPaying",     icon: "💰", color: "text-green-400"   },
  { key: "trending",          icon: "🎯", color: "text-purple-400"  },
  { key: "recentlyPosted",    icon: "🆕", color: "text-sky-400"     },
  { key: "verifiedEmployers", icon: "🏆", color: "text-indigo-400"  },
];

// ── Job card (horizontal scroll) ──────────────────────────────────
const JobCard = memo(function JobCard({ job, navigate, t }) {
  const photo = job.companyLogo || job.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.title || job.company || "J")}`;
  const salary = job.salary || job.budget || job.rate;
  const distance = job.distance ? `${Math.round(job.distance)} km` : null;
  const timeAgo = job.createdAt
    ? (() => {
        const diff = Date.now() - new Date(job.createdAt).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return "< 1h";
        if (h < 24) return `${h}h`;
        return `${Math.floor(h / 24)}j`;
      })()
    : null;

  return (
    <div
      onClick={() => navigate(`/u/${job.userId || job._id || job.id}`, { state: { profile: job } })}
      className="shrink-0 w-52 bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5 cursor-pointer active:scale-[0.97] transition hover:border-amber-500/30"
    >
      <div className="flex items-start justify-between">
        <img src={photo} alt={job.company || job.title} className="w-10 h-10 rounded-xl object-cover border border-slate-700"
          onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=J`; }} />
        <div className="flex flex-col items-end gap-1">
          {job.verified && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              <CheckCircle className="w-2.5 h-2.5" /> {t("dashboard.verified")}
            </span>
          )}
          {timeAgo && <span className="text-[9px] text-slate-500">{timeAgo}</span>}
        </div>
      </div>
      <div>
        <p className="text-[13px] font-bold text-white leading-tight line-clamp-2">{job.title || job.profession}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{job.company || job.name}</p>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="space-y-0.5">
          {salary && <p className="text-[12px] font-black text-amber-400">{salary}</p>}
          {distance && (
            <div className="flex items-center gap-0.5 text-[10px] text-slate-500">
              <MapPin className="w-2.5 h-2.5" /> {distance}
            </div>
          )}
          {!salary && !distance && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] text-slate-400">{job.rating?.toFixed(1) || "—"}</span>
            </div>
          )}
        </div>
        <button type="button"
          onClick={e => { e.stopPropagation(); navigate(`/u/${job.userId || job._id || job.id}`, { state: { profile: job } }); }}
          className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black active:scale-95 transition">
          {t("dashboard.applyNow")}
        </button>
      </div>
    </div>
  );
});

// ── Worker card (people) ───────────────────────────────────────────
const WorkerCard = memo(function WorkerCard({ worker, navigate, t }) {
  const photo = worker.profileMetadata?.profilePhoto || worker.photo
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(worker.name || "w")}`;
  return (
    <div
      onClick={() => navigate(`/u/${worker._id || worker.id}`, { state: { profile: worker } })}
      className="shrink-0 w-36 bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col items-center gap-2 cursor-pointer active:scale-[0.97] transition hover:border-amber-500/30"
    >
      <div className="relative">
        <img src={photo} alt={worker.name} className="w-14 h-14 rounded-xl object-cover border-2 border-slate-700"
          onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=w`; }} />
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-green-500" />
      </div>
      <div className="text-center w-full">
        <p className="text-[12px] font-bold text-white truncate">{worker.name}</p>
        <p className="text-[10px] text-slate-500 truncate">{worker.profession || worker.role}</p>
      </div>
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="text-[11px] text-amber-400 font-bold">{worker.rating?.toFixed(1) || "—"}</span>
      </div>
    </div>
  );
});

// ── Company card (top companies) ───────────────────────────────────
const CompanyCard = memo(function CompanyCard({ company, navigate, t }) {
  const photo = company.profileMetadata?.profilePhoto || company.photo
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company.name || "C")}`;
  const city = company.location?.city || company.city || "";
  return (
    <div
      onClick={() => navigate(`/u/${company._id || company.id}`, { state: { profile: company } })}
      className="shrink-0 w-48 bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2 cursor-pointer active:scale-[0.97] transition hover:border-amber-500/30"
    >
      <div className="flex items-center gap-2.5">
        <img src={photo} alt={company.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700"
          onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=C`; }} />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-white truncate">{company.name}</p>
          {city && <p className="text-[10px] text-slate-500 truncate">{city}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
          {company.role}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          <Briefcase className="w-2.5 h-2.5" />
          {company.stats?.jobsPosted ?? "—"}
        </div>
      </div>
      <button type="button" onClick={e => { e.stopPropagation(); navigate("/chat"); }}
        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold transition">
        {t("dashboard.contactWork")}
      </button>
    </div>
  );
});

// ── Horizontal section ─────────────────────────────────────────────
function HSection({ icon, color, titleKey, children, navigate, t, onViewAll }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <p className={`text-[13px] font-black uppercase tracking-wider ${color}`}>
            {t(`dashboard.${titleKey}`, titleKey)}
          </p>
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-amber-400 transition font-semibold">
            {t("dashboard.viewAll")} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────
const SkeletonCard = ({ wide }) => (
  <div className={`shrink-0 ${wide ? "w-52" : "w-36"} h-36 bg-slate-800/40 rounded-2xl animate-pulse`} />
);

// ════════════════════════════════════════════════════════════════
// WORKER HOME — main
// ════════════════════════════════════════════════════════════════
function WorkerHome({ user, geo, availability, toggleAvailability, jobs, loading,
  employers, employersLoading, retrying, error, handleRefresh, navigate, t }) {
  const [searchQuery, setSearchQuery]   = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const directoryRef = useRef(null);
  const [contactTarget, setContactTarget] = useState(null);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12)  return t("dashboard.greetMorning");
    if (h >= 12 && h < 18) return t("dashboard.greetAfternoon");
    return t("dashboard.greetEvening");
  }, [t]);

  const firstName = user?.name?.split(" ")[0] || "";
  const rating    = user?.stats?.rating ?? user?.rating ?? null;
  const verified  = user?.verified || false;
  const avatarSrc = user?.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "user")}`;

  const SEARCH_FILTERS = [
    { id: "location", icon: "📍", key: "filterLocation" },
    { id: "distance", icon: "🎯", key: "filterDistance" },
    { id: "category", icon: "🧰", key: "filterCategory" },
    { id: "language", icon: "🗣", key: "filterLanguage" },
  ];

  // For section content, use real data where possible
  const featuredJobs   = jobs.slice(0, 8);
  const recentlyPosted = [...jobs].reverse().slice(0, 8);
  const workerList     = employers.filter(e => !EMPLOYER_ROLES.has(e.role)).slice(0, 8);
  const companyList    = employers.filter(e => EMPLOYER_ROLES.has(e.role)).slice(0, 8);
  const topCompanies   = [...companyList].sort((a, b) => (b.stats?.jobsPosted || 0) - (a.stats?.jobsPosted || 0));

  return (
    <>
      <ContactModal employer={contactTarget} onClose={() => setContactTarget(null)} navigate={navigate} />

      <div className="pb-6 space-y-5">

        {/* ── TOP INFO STRIP ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-4 pt-3">
          {/* GPS pill */}
          <button type="button" onClick={() => navigate("/map")}
            className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-amber-400 hover:border-amber-500/50 active:scale-95 transition shrink-0">
            <Navigation className="w-3 h-3" />
            {geo.city}
          </button>

          {/* Wallet */}
          <button type="button" onClick={() => navigate("/settings")}
            className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-green-400 hover:border-green-500/50 active:scale-95 transition">
            <Wallet className="w-3 h-3" />
            <span>$0.00</span>
          </button>

          <div className="flex-1" />

          {/* Language switcher */}
          <button type="button" onClick={() => navigate("/settings")}
            className="w-8 h-8 flex items-center justify-center bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition active:scale-95">
            <Globe className="w-4 h-4" />
          </button>

          {/* Messages */}
          <button type="button" onClick={() => navigate("/chat")}
            className="w-8 h-8 flex items-center justify-center bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition active:scale-95 relative">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* ── HERO CARD ────────────────────────────────────────────── */}
        <div className="mx-4 relative rounded-2xl overflow-hidden border border-slate-800/70 p-4 bg-gradient-to-br from-[#0f172a] via-[#1a2640] to-[#0f172a]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.07),transparent_60%)] pointer-events-none" />

          <div className="relative flex items-start gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img src={avatarSrc} alt={user?.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg" />
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] ${availability === "available" ? "bg-green-500" : "bg-slate-500"}`} />
            </div>

            {/* Greeting */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{greeting}</p>
              <h1 className="text-xl font-black text-white leading-tight mt-0.5 truncate">
                {firstName || user?.name || "—"}
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">{t("dashboard.heroSubtitle")}</p>
            </div>

            {/* Availability toggle */}
            <button type="button" onClick={toggleAvailability}
              className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition active:scale-95 ${
                availability === "available"
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-slate-800/80 border-slate-600 text-slate-400"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${availability === "available" ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
              {availability === "available" ? t("dashboard.available") : t("dashboard.busy")}
            </button>
          </div>

          {/* Profile stat chips */}
          <div className="relative flex items-center gap-2 mt-4 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2 py-1 rounded-lg">
              <MapPin className="w-2.5 h-2.5 text-amber-400" /> {geo.city}
            </span>
            {rating && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                <Star className="w-2.5 h-2.5 fill-amber-400" /> {rating.toFixed(1)}
              </span>
            )}
            {verified && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                <CheckCircle className="w-2.5 h-2.5" /> {t("dashboard.verified")}
              </span>
            )}
            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border ${
              availability === "available"
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : "text-slate-500 bg-slate-800/60 border-slate-700/50"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${availability === "available" ? "bg-green-400" : "bg-slate-500"}`} />
              {availability === "available" ? t("dashboard.available") : t("dashboard.busy")}
            </span>
          </div>

          {retrying && (
            <p className="relative text-[10px] text-amber-400 mt-2">{t("dashboard.reconnecting")}</p>
          )}
        </div>

        {/* ── SEARCH BAR ───────────────────────────────────────────── */}
        <div className="px-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2.5">
              <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("dashboard.searchPlaceholder")}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none" />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-slate-500 hover:text-white text-xs">✕</button>
              )}
            </div>
            <button type="button" onClick={handleRefresh}
              className="w-9 h-9 flex items-center justify-center bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-400 hover:text-amber-400 active:scale-95 transition">
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            {SEARCH_FILTERS.map(f => (
              <button key={f.id} type="button" onClick={() => setActiveFilter(prev => prev === f.id ? null : f.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition active:scale-95 ${
                  activeFilter === f.id
                    ? "bg-amber-500 text-slate-950 border-amber-500"
                    : "bg-slate-800/70 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-700"
                }`}>
                {f.icon} {t(`dashboard.${f.key}`)}
              </button>
            ))}
          </div>
        </div>

        {/* ── TWO UBER-STYLE BUTTONS ───────────────────────────────── */}
        <div className="px-4 grid grid-cols-2 gap-3">
          <button type="button"
            onClick={() => directoryRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-amber-500 text-slate-950 font-black active:scale-[0.97] transition shadow-lg shadow-amber-500/20">
            <span className="text-2xl">🔍</span>
            <span className="text-[13px] leading-tight text-center">{t("dashboard.findWork")}</span>
          </button>
          <button type="button"
            onClick={() => navigate("/post-job")}
            className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-slate-800 border border-slate-700/60 text-white font-black active:scale-[0.97] transition hover:border-amber-500/30">
            <span className="text-2xl">⚡</span>
            <span className="text-[13px] leading-tight text-center">{t("dashboard.offerServices")}</span>
          </button>
        </div>

        {/* ── SERVICE CATEGORIES ───────────────────────────────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-4">
            <p className="text-[13px] font-black uppercase tracking-wider text-slate-400">
              {t("dashboard.categories")}
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
            {SERVICE_CATEGORIES.map(cat => (
              <button key={cat.id} type="button"
                onClick={() => {
                  setActiveCategory(prev => prev === cat.id ? null : cat.id);
                  navigate("/search");
                }}
                className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition active:scale-95 ${
                  activeCategory === cat.id
                    ? "bg-amber-500 border-amber-500 text-slate-950"
                    : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-amber-500/30 hover:text-white"
                }`}>
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[10px] font-bold whitespace-nowrap">{t(`dashboard.${cat.key}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-4 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        {/* ── CONTENT SECTIONS ─────────────────────────────────────── */}

        {/* Featured Jobs */}
        <HSection icon="🔥" color="text-orange-400" titleKey="featuredJobs" navigate={navigate} t={t}
          onViewAll={() => navigate("/search")}>
          {loading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} wide />)
            : featuredJobs.length > 0
              ? featuredJobs.map((j, i) => <JobCard key={j._id || j.id || i} job={j} navigate={navigate} t={t} />)
              : companyList.map((c, i) => <CompanyCard key={c._id || c.id || i} company={c} navigate={navigate} t={t} />)
          }
          {(!loading && featuredJobs.length === 0 && companyList.length === 0) && (
            <div className="flex items-center justify-center w-full py-8 text-slate-600 text-sm">
              {t("dashboard.noJobs")}
            </div>
          )}
        </HSection>

        {/* Nearby Workers */}
        <HSection icon="📍" color="text-emerald-400" titleKey="nearbyWorkers" navigate={navigate} t={t}
          onViewAll={() => navigate("/search")}>
          {employersLoading
            ? [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
            : workerList.length > 0
              ? workerList.map((w, i) => <WorkerCard key={w._id || w.id || i} worker={w} navigate={navigate} t={t} />)
              : <div className="text-slate-600 text-sm py-4 px-2">{t("dashboard.noJobs")}</div>
          }
        </HSection>

        {/* Top Companies */}
        <HSection icon="🏢" color="text-blue-400" titleKey="topCompanies" navigate={navigate} t={t}
          onViewAll={() => directoryRef.current?.scrollIntoView({ behavior: "smooth" })}>
          {employersLoading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} wide />)
            : topCompanies.length > 0
              ? topCompanies.map((c, i) => <CompanyCard key={c._id || c.id || i} company={c} navigate={navigate} t={t} />)
              : <div className="text-slate-600 text-sm py-4 px-2">{t("dashboard.noJobs")}</div>
          }
        </HSection>

        {/* Highest Paying */}
        <HSection icon="💰" color="text-green-400" titleKey="highestPaying" navigate={navigate} t={t}
          onViewAll={() => navigate("/search")}>
          {loading
            ? [1, 2].map(i => <SkeletonCard key={i} wide />)
            : featuredJobs.slice(0, 4).map((j, i) => <JobCard key={j._id || j.id || i} job={j} navigate={navigate} t={t} />)
          }
          {(!loading && featuredJobs.length === 0) && (
            <div className="text-slate-600 text-sm py-4 px-2">{t("dashboard.noJobs")}</div>
          )}
        </HSection>

        {/* Recently Posted */}
        <HSection icon="🆕" color="text-sky-400" titleKey="recentlyPosted" navigate={navigate} t={t}
          onViewAll={() => navigate("/search")}>
          {loading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} wide />)
            : recentlyPosted.length > 0
              ? recentlyPosted.map((j, i) => <JobCard key={j._id || j.id || i} job={j} navigate={navigate} t={t} />)
              : companyList.slice(0, 4).map((c, i) => <CompanyCard key={c._id || c.id || i} company={c} navigate={navigate} t={t} />)
          }
        </HSection>

        {/* Verified Employers */}
        <HSection icon="🏆" color="text-indigo-400" titleKey="verifiedEmployers" navigate={navigate} t={t}
          onViewAll={() => directoryRef.current?.scrollIntoView({ behavior: "smooth" })}>
          {employersLoading
            ? [1, 2, 3].map(i => <SkeletonCard key={i} wide />)
            : companyList.map((c, i) => <CompanyCard key={c._id || c.id || i} company={c} navigate={navigate} t={t} />)
          }
        </HSection>

        {/* ── FULL EMPLOYER DIRECTORY ──────────────────────────────── */}
        <div ref={directoryRef} className="px-4 space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
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

  // Employers list (shared between WorkerHome sections and directory)
  const [employers, setEmployers]           = useState([]);
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

  // Fetch jobs
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

  // Fetch community members
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

  // GPS
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
