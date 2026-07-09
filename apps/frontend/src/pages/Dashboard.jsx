import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import {
  RefreshCcw, Navigation, Search, Building2, MapPin,
  ChevronRight, Briefcase, Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRoleDashboard, isEmployerRole } from "../config/roleConfig";
import CompanyContent, {
  COMPANY_TABS,
  CompanyOverviewSupplement,
} from "./company/CompanyDashboard";
import EnterpriseContent, {
  ENTERPRISE_TABS,
  EnterpriseOverviewSupplement,
} from "./enterprise/EnterpriseDashboard";

// ── Employer / company card ──────────────────────────────────────
const ROLE_COLORS = {
  company:    { color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30" },
  business:   { color: "text-sky-400",    bg: "bg-sky-500/10 border-sky-500/30"  },
  enterprise: { color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" },
  employer:   { color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/30" },
};

const EmployerCard = memo(function EmployerCard({ emp, onContact }) {
  const { t } = useTranslation();
  const colors = ROLE_COLORS[emp.role] || { color: "text-slate-400", bg: "bg-slate-800/50 border-slate-700" };
  const roleKey = `dashboard.role${emp.role.charAt(0).toUpperCase()}${emp.role.slice(1)}`;
  const roleLabel = t(roleKey, emp.role);
  const photo = emp.photo || emp.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name || "co")}`;
  const city = emp.location?.city || emp.city || "";
  const jobsCount = emp.stats?.jobsPosted ?? emp.jobsPosted ?? null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img
            src={photo}
            alt={emp.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700"
            onError={e => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`;
            }}
          />
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight truncate">{emp.name}</p>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${colors.bg} ${colors.color}`}>
            {roleLabel}
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
          <MapPin className="w-3 h-3 shrink-0" />
          {city}
        </div>
      )}

      <button
        type="button"
        onClick={() => onContact(emp)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black active:scale-95 transition"
      >
        <Briefcase className="w-3.5 h-3.5" />
        {t("dashboard.contactWork")}
      </button>
    </div>
  );
});

// ── Employer directory (live from API) ───────────────────────────
const EMPLOYER_ROLES = new Set(["company", "business", "enterprise", "employer"]);
const FILTER_IDS = ["all", "company", "enterprise", "employer"];

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
    const matchSearch = !q
      || e.name?.toLowerCase().includes(q)
      || e.location?.city?.toLowerCase().includes(q)
      || e.profession?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-slate-800/40 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex gap-2 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
              filter === f.id
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
          >
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
          {visible.map((e, i) => (
            <EmployerCard key={e.id || e._id || i} emp={e} onContact={onContact} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Contact modal (lightweight) ──────────────────────────────────
function ContactModal({ employer, onClose, navigate }) {
  const { t } = useTranslation();
  if (!employer) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-t-3xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2" />
        <div className="flex items-center gap-3">
          <img
            src={employer.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(employer.name)}`}
            alt={employer.name}
            className="w-12 h-12 rounded-xl object-cover border border-slate-700"
          />
          <div>
            <p className="font-bold text-white">{employer.name}</p>
            <p className="text-xs text-slate-500">{employer.location?.city || ""}</p>
          </div>
        </div>

        <p className="text-sm text-slate-400">
          {t("dashboard.contactMsg")} <span className="text-white font-semibold">{employer.name}</span> {t("dashboard.contactFor")}
        </p>

        <button
          type="button"
          onClick={() => { onClose(); navigate("/chat"); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm active:scale-95 transition"
        >
          💬 {t("dashboard.sendMessage")}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-sm text-slate-500 font-semibold"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

// ── Global cache (worker path) ───────────────────────────────────
let jobsCache = null;
let cacheTime  = 0;
const CACHE_TTL = 15000;

// ================================================================
// ROLE DASHBOARD — renders for non-worker roles
// ================================================================
function RoleDashboard({ dashConfig }) {
  const sections = [...dashConfig.sections].sort((a, b) => a.priority - b.priority);
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white">{dashConfig.greeting}</h2>
        <p className="text-slate-400 text-sm mt-1">{dashConfig.subtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {dashConfig.widgets.map(widget => (
          <div key={widget.id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-2xl font-bold text-amber-500">—</div>
            <div className="text-xs text-slate-400 mt-1">{widget.label}</div>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Seksyon yo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(section => (
          <div key={section.id} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition cursor-default">
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-hidden="true">{section.icon}</span>
              <div>
                <h4 className="font-bold text-slate-100">{section.label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tap pou wè plis</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// DASHBOARD — role-aware, single component
// ================================================================
export default function Dashboard() {
  const { user }    = useAuth();
  const { t }       = useTranslation();
  const roleKey     = user?.role ?? "worker";
  const isWorker    = !isEmployerRole(roleKey);
  const dashConfig  = getRoleDashboard(roleKey);
  const navigate    = useNavigate();

  // ── State ────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [retrying, setRetrying]       = useState(false);
  const isCompanyRole    = roleKey === "company" || roleKey === "business";
  const [companyTab, setCompanyTab]   = useState("overview");
  const isEnterpriseRole = roleKey === "enterprise";
  const [enterpriseTab, setEnterpriseTab] = useState("overview");

  // Worker-specific
  const [searchQuery, setSearchQuery]   = useState("");
  const [availability, setAvailability] = useState(user?.availability || "available");
  const [contactTarget, setContactTarget] = useState(null);
  const [geo, setGeo] = useState({
    lat:  user?.location?.coordinates?.latitude  || 18.5432,
    lng:  user?.location?.coordinates?.longitude || -72.3395,
    city: user?.location?.city || "GPS",
  });

  // ── Refs ─────────────────────────────────────────────────────
  const abortRef      = useRef(null);
  const mountedRef    = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const inFlightRef   = useRef(false);
  const directoryRef  = useRef(null);

  useEffect(() => () => {
    mountedRef.current = false;
    abortRef.current?.abort();
    clearTimeout(retryTimerRef.current);
    inFlightRef.current = false;
  }, []);

  // ── Fetch jobs ────────────────────────────────────────────────
  const fetchJobs = useCallback(async (isRetry = false) => {
    const now = Date.now();
    const hasCache = jobsCache && now - cacheTime < CACHE_TTL;
    if (inFlightRef.current && !isRetry) return;
    inFlightRef.current = true;
    try {
      if (!mountedRef.current) return;
      setError("");
      if (!isRetry && hasCache) { setLoading(false); return; }
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await API.get("/jobs", { signal: controller.signal });
      if (!mountedRef.current) return;
      const data = Array.isArray(res?.data) ? res.data : [];
      jobsCache = data; cacheTime = now;
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

  useEffect(() => { if (isWorker) fetchJobs(); }, [fetchJobs, isWorker]);

  const handleRefresh = useCallback(() => {
    retryCountRef.current = 0; setRetrying(false); setError("");
    clearTimeout(retryTimerRef.current); retryTimerRef.current = null;
    abortRef.current?.abort(); abortRef.current = null;
    fetchJobs(true);
  }, [fetchJobs]);

  // ── Real GPS ─────────────────────────────────────────────────
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
        setGeo({ lat, lng, city });
      },
      () => {}
    );
  }, [isWorker]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAvailability = useCallback(() => {
    const next = availability === "available" ? "busy" : "available";
    setAvailability(next);
    API.patch("/workers/availability", { userId: user?._id || user?.id, availability: next }).catch(() => {});
  }, [availability, user]);

  // ── Company dashboard ─────────────────────────────────────────
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
            <button
              key={tab.id}
              onClick={() => setCompanyTab(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                companyTab === tab.id ? "bg-blue-500 text-white" : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {companyTab === "overview" ? (
          <div className="space-y-4">
            <CompanyOverviewSupplement user={user} />
            <RoleDashboard dashConfig={dashConfig} />
          </div>
        ) : (
          <CompanyContent tab={companyTab} user={user} />
        )}
      </div>
    );
  }

  // ── Enterprise dashboard ──────────────────────────────────────
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
            <button
              key={tab.id}
              onClick={() => setEnterpriseTab(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                enterpriseTab === tab.id ? "bg-indigo-500 text-white" : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {enterpriseTab === "overview" ? (
          <div className="space-y-4">
            <EnterpriseOverviewSupplement user={user} />
            <RoleDashboard dashConfig={dashConfig} />
          </div>
        ) : (
          <EnterpriseContent tab={enterpriseTab} user={user} />
        )}
      </div>
    );
  }

  // ── Generic employer dashboard ────────────────────────────────
  if (!isWorker) return <RoleDashboard dashConfig={dashConfig} />;

  // ── WORKER HOME ───────────────────────────────────────────────
  return (
    <>
      {/* Contact modal */}
      <ContactModal
        employer={contactTarget}
        onClose={() => setContactTarget(null)}
        navigate={navigate}
      />

      <div className="space-y-4 px-4 pt-4 pb-6">

        {/* ── BYENVENI HERO ──────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1a2640] to-[#0f172a] border border-slate-800/70 p-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.09),transparent_55%)] pointer-events-none" />

          {/* GPS pill */}
          <button
            type="button"
            onClick={() => navigate("/map")}
            className="absolute top-3 left-3 flex items-center gap-1 bg-slate-800/90 border border-slate-700/70 px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-400 hover:border-amber-500/50 active:scale-95 transition"
          >
            <Navigation className="w-3 h-3" />
            {geo.city}
          </button>

          {/* Availability toggle */}
          <button
            type="button"
            onClick={toggleAvailability}
            className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition active:scale-95 ${
              availability === "available"
                ? "bg-green-500/20 border-green-500/50 text-green-400"
                : "bg-slate-800/80 border-slate-600 text-slate-400"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${availability === "available" ? "bg-green-400" : "bg-slate-500"}`} />
            {availability === "available" ? t("dashboard.available") : t("dashboard.busy")}
          </button>

          {/* Title */}
          <div className="relative text-center pt-6 pb-2">
            <h1 className="text-xl font-black text-white tracking-tight leading-tight">
              {t("dashboard.welcome")}{user?.name ? `, ${user.name.split(" ")[0].toUpperCase()}` : ""}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {t("dashboard.slogan")}
            </p>
            {retrying && <p className="text-[10px] text-amber-400 mt-1">{t("dashboard.reconnecting")}</p>}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2.5">
              <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("dashboard.searchPlaceholder")}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="w-9 h-9 flex items-center justify-center bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-400 hover:text-amber-400 active:scale-95 transition"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* FIND WORK CTA */}
          <button
            type="button"
            onClick={() => directoryRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="w-full mt-3 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-lg shadow-amber-500/20"
          >
            <Briefcase className="w-4 h-4" />
            {t("dashboard.findWork")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            {error}
          </div>
        )}

        {/* ── EMPLOYER DIRECTORY ──────────────────────────────────── */}
        <div ref={directoryRef} className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t("dashboard.employersTitle")}
            </p>
          </div>
          <EmployerDirectory
            searchQuery={searchQuery}
            onContact={emp => setContactTarget(emp)}
          />
        </div>

      </div>
    </>
  );
}
