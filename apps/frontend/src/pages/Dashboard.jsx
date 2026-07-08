import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { MapPin, Clock, RefreshCcw, Navigation, Star, Briefcase, DollarSign } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRoleDashboard, isEmployerRole } from "../config/roleConfig";
import WorkerContent, {
  WORKER_TABS,
  OverviewSupplement,
  computeTrustScore,
} from "./worker/WorkerDashboard";
import CompanyContent, {
  COMPANY_TABS,
  CompanyOverviewSupplement,
} from "./company/CompanyDashboard";
import EnterpriseContent, {
  ENTERPRISE_TABS,
  EnterpriseOverviewSupplement,
} from "./enterprise/EnterpriseDashboard";

// ── GPS Map section ──────────────────────────────────────────────
const MapSection = memo(function MapSection({ user, onAvailToggle }) {
  const lat = user?.location?.coordinates?.latitude  || 18.5432;
  const lng = user?.location?.coordinates?.longitude || -72.3395;
  const city = user?.location?.city || "Lokasyon ou";
  const avail = user?.availability || "available";
  const isAvailable = avail === "available";

  const bbox = `${lng - 0.06}%2C${lat - 0.04}%2C${lng + 0.06}%2C${lat + 0.04}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900" style={{ height: 180 }}>
      <iframe
        title="Lokasyon GPS"
        src={osmSrc}
        className="w-full h-full border-0 opacity-90"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      {/* Location badge bottom-left */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-[#0f172a]/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-slate-700/60">
        <Navigation className="w-3 h-3 text-amber-400" />
        <span className="text-[11px] font-semibold text-white">{city}</span>
      </div>
      {/* Disponib toggle top-right */}
      <button
        type="button"
        onClick={onAvailToggle}
        className={`absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold backdrop-blur-sm transition active:scale-95 ${
          isAvailable
            ? "bg-green-500/90 border-green-400 text-white"
            : "bg-slate-800/90 border-slate-600 text-slate-300"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-white" : "bg-slate-500"}`} />
        {isAvailable ? "Disponib" : "Okipe"}
      </button>
    </div>
  );
});

// ── Community member card ────────────────────────────────────────
const MemberCard = memo(function MemberCard({ member }) {
  const photo = member.photo
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name || "user")}`;
  const expLabel = member.yearsExperience
    ? (member.yearsExperience === "less_1" ? "< 1 an"
      : member.yearsExperience === "10_plus" ? "10+ an"
      : `${member.yearsExperience.replace("_", "–")} an`)
    : null;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 min-w-[130px]">
      <div className="relative">
        <img
          src={photo}
          alt={member.name}
          className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/20 mx-auto block"
          onError={e => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`; }}
        />
        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
          member.availability === "available" ? "bg-green-500" : "bg-slate-500"
        }`} />
      </div>
      <div className="text-center">
        <p className="text-[12px] font-bold text-white leading-tight truncate">{member.name}</p>
        <p className="text-[10px] text-amber-400 font-semibold truncate">
          {member.profession || member.role}
        </p>
        {member.city && (
          <p className="text-[10px] text-slate-500 truncate">{member.city}</p>
        )}
        {expLabel && (
          <p className="text-[10px] text-slate-400 mt-0.5">{expLabel} exp.</p>
        )}
        <div className="flex items-center justify-center gap-0.5 mt-1">
          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold text-amber-400">{(member.rating || 5).toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
});

// ── Community feed ───────────────────────────────────────────────
const CommunityFeed = memo(function CommunityFeed() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    API.get("/community/members?limit=30", { timeout: 15000 })
      .then(res => {
        if (!alive) return;
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setMembers(list);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="min-w-[130px] h-[140px] bg-slate-800/40 rounded-2xl animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-xs text-slate-500 text-center py-4">
        Pa gen manm anrejistre pou kounye a
      </p>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
      {members.map((m, i) => (
        <div key={m.id || i} className="shrink-0">
          <MemberCard member={m} />
        </div>
      ))}
    </div>
  );
});

// ================= GLOBAL CACHE (worker path only) =================
let jobsCache = null;
let cacheTime = 0;
const CACHE_TTL = 15000;

// ================================================================
// ROLE DASHBOARD — renders for all non-worker roles
// Driven entirely by roleConfig.js — no logic lives here.
// ================================================================
function RoleDashboard({ dashConfig }) {
  const sections = [...dashConfig.sections].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white">{dashConfig.greeting}</h2>
        <p className="text-slate-400 text-sm mt-1">{dashConfig.subtitle}</p>
      </div>

      {/* WIDGETS */}
      <div className="grid grid-cols-3 gap-4">
        {dashConfig.widgets.map((widget) => (
          <div
            key={widget.id}
            className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-center"
          >
            <div className="text-2xl font-bold text-amber-500">—</div>
            <div className="text-xs text-slate-400 mt-1">{widget.label}</div>
          </div>
        ))}
      </div>

      {/* SECTIONS */}
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
        Seksyon yo
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition cursor-default"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-hidden="true">
                {section.icon}
              </span>
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
// DASHBOARD — single component, role-aware
// Worker path: exact original logic + JSX, no changes.
// Employer path: delegates to RoleDashboard.
// ================================================================
export default function Dashboard() {
  const { user } = useAuth();
  const roleKey     = user?.role ?? "worker";
  const isWorker    = !isEmployerRole(roleKey);
  // isWorkerRole is narrower than isWorker — service_provider also passes isWorker,
  // but the new worker sections are scoped to the 'worker' role only.
  const isWorkerRole = roleKey === "worker";
  const dashConfig  = getRoleDashboard(roleKey);

  // ── State (declared unconditionally — React hooks rule) ──────
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [retrying, setRetrying]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  // workerTab: active tab in the worker dashboard tab bar.
  // Declared unconditionally; only rendered when isWorkerRole is true.
  const [workerTab, setWorkerTab]     = useState("overview");
  // isCompanyRole: gates the company-specific tab bar.
  // 'business' is the legacy alias that maps to company behavior.
  const isCompanyRole = roleKey === "company" || roleKey === "business";
  const [companyTab, setCompanyTab]   = useState("overview");
  const isEnterpriseRole = roleKey === "enterprise";
  const [enterpriseTab, setEnterpriseTab] = useState("overview");

  // ── Refs ─────────────────────────────────────────────────────
  const abortRef      = useRef(null);
  const mountedRef    = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const inFlightRef   = useRef(false);

  // ── Cleanup ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
      inFlightRef.current = false;
    };
  }, []);

  // ── Fetch jobs (worker path only) ────────────────────────────
  const fetchJobs = useCallback(async (isRetry = false) => {
    const now = Date.now();
    const hasCache = jobsCache && now - cacheTime < CACHE_TTL;

    if (inFlightRef.current && !isRetry) return;
    inFlightRef.current = true;

    try {
      if (!mountedRef.current) return;

      setError("");

      if (!isRetry && hasCache) {
        setJobs(jobsCache);
        setLoading(false);
        return;
      }

      setLoading(true);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await API.get("/jobs", { signal: controller.signal });

      if (!mountedRef.current) return;

      const data = Array.isArray(res?.data) ? res.data : [];

      jobsCache = data;
      cacheTime = now;

      setJobs(data);
      setLastUpdated(now);

      retryCountRef.current = 0;
      setRetrying(false);

    } catch (err) {
      if (!mountedRef.current) return;

      const canceled =
        err?.code === "ERR_CANCELED" ||
        err?.name === "CanceledError";

      if (canceled) return;

      retryCountRef.current += 1;

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Erè pandan chajman travay yo"
      );

      const canRetry =
        retryCountRef.current <= 2 &&
        !retryTimerRef.current;

      if (canRetry) {
        setRetrying(true);

        const delay = Math.min(1500 * retryCountRef.current, 5000);

        clearTimeout(retryTimerRef.current);

        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          if (!mountedRef.current) return;
          if (!inFlightRef.current) fetchJobs(true);
        }, delay);
      } else {
        setRetrying(false);
      }

    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ── Init — only fetch jobs for worker roles ──────────────────
  useEffect(() => {
    if (isWorker) fetchJobs();
  }, [fetchJobs, isWorker]);

  // ── Refresh ──────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    retryCountRef.current = 0;
    setRetrying(false);
    setError("");
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    fetchJobs(true);
  }, [fetchJobs]);

  // ── Company role → extended company dashboard ────────────────
  // Intercepted before the generic employer short-circuit so company
  // gets the full tab experience; all other employer roles still get
  // the plain RoleDashboard (no change to their behavior).
  if (isCompanyRole) {
    return (
      <div className="space-y-4">

        {/* HEADER */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {dashConfig.greeting}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{dashConfig.subtitle}</p>
        </div>

        {/* COMPANY TAB BAR */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {COMPANY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCompanyTab(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                companyTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB — supplement + existing RoleDashboard sections */}
        {companyTab === "overview" && (
          <div className="space-y-4">
            <CompanyOverviewSupplement user={user} />
            <RoleDashboard dashConfig={dashConfig} />
          </div>
        )}

        {/* OTHER TABS — delegated to CompanyDashboard component */}
        {companyTab !== "overview" && (
          <CompanyContent tab={companyTab} user={user} />
        )}

      </div>
    );
  }

  // ── Enterprise role → extended enterprise dashboard ──────────
  if (isEnterpriseRole) {
    return (
      <div className="space-y-4">

        {/* HEADER */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {dashConfig.greeting}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{dashConfig.subtitle}</p>
        </div>

        {/* ENTERPRISE TAB BAR */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {ENTERPRISE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setEnterpriseTab(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                enterpriseTab === tab.id
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB — supplement + existing RoleDashboard sections */}
        {enterpriseTab === "overview" && (
          <div className="space-y-4">
            <EnterpriseOverviewSupplement user={user} />
            <RoleDashboard dashConfig={dashConfig} />
          </div>
        )}

        {/* OTHER TABS — delegated to EnterpriseContent */}
        {enterpriseTab !== "overview" && (
          <EnterpriseContent tab={enterpriseTab} user={user} />
        )}

      </div>
    );
  }

  // ── Employer roles → role-specific dashboard ─────────────────
  if (!isWorker) {
    return <RoleDashboard dashConfig={dashConfig} />;
  }

  // ── Worker path — extended with role-aware tabs ──────────────
  return (
    <div className="space-y-4 px-4 pt-4">

      {/* ── BYENVENI HERO ──────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-slate-800/60 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.12),transparent_60%)] pointer-events-none" />
        <div className="relative text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70 mb-1">
            JobFast Platform
          </p>
          <h1 className="text-2xl font-black text-white tracking-tight">
            BYENVENI{user?.name ? `, ${user.name.split(" ")[0].toUpperCase()}` : ""}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isWorkerRole && workerTab !== "overview"
              ? dashConfig.subtitle
              : "Platfòm travay la pi rapid nan Ayiti"}
          </p>
          {retrying && (
            <p className="text-xs text-amber-400 mt-1.5">Rekoneksyon...</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-slate-900/70 rounded-xl p-2.5 text-center border border-slate-700/40">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-base font-black text-amber-400">
                {(user?.stats?.rating ?? 5).toFixed(1)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Rating</span>
          </div>
          <div className="bg-slate-900/70 rounded-xl p-2.5 text-center border border-slate-700/40">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-base font-black text-emerald-400">
                {user?.stats?.totalJobs ?? 0}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Travay Fini</span>
          </div>
          <div className="bg-slate-900/70 rounded-xl p-2.5 text-center border border-slate-700/40">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-base font-black text-blue-400">
                ${(user?.stats?.totalJobs ?? 0) * 50}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">Revni Est.</span>
          </div>
        </div>
      </div>

      {/* WORKER TAB BAR — only for the 'worker' role specifically */}
      {isWorkerRole && (
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {WORKER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setWorkerTab(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                workerTab === tab.id
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
      {(!isWorkerRole || workerTab === "overview") && (
        <div className="space-y-4">

          {/* GPS Map with Disponib toggle */}
          <MapSection user={user} onAvailToggle={() => {
            const current = user?.availability || "available";
            const next = current === "available" ? "busy" : "available";
            API.patch("/workers/availability", {
              userId: user?._id || user?.id,
              availability: next,
            }).catch(() => {});
          }} />

          {/* Trust bar — worker only */}
          {isWorkerRole && (
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-400">🛡️ Konfyans</span>
                <span className="text-[11px] font-bold text-amber-500">
                  {computeTrustScore(user)}/100
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
                  style={{ width: `${computeTrustScore(user)}%` }}
                />
              </div>
            </div>
          )}

          {/* Community feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">👥 Kominote JobFast</h3>
              <span className="text-[10px] text-slate-500">Manm yo</span>
            </div>
            <CommunityFeed />
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          {/* Refresh + section header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Travay ki pre w
            </h3>
            {workerTab === "overview" && (
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                aria-label="Rafraichi"
              >
                <RefreshCcw className="w-4 h-4 text-amber-400" />
              </button>
            )}
          </div>

          {/* LOADING / JOB LIST — preserved exactly from original */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-slate-800/50 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-10">
              Pa gen travay disponib kounye a
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, idx) => (
                <div
                  key={job.id || job._id || idx}
                  className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition"
                >
                  <div className="flex justify-between items-start">

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-xl">
                        👷‍♂️
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-100">
                          {job?.title || "Untitled job"}
                        </h4>

                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {job?.company || "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="block font-bold text-amber-500">
                        {job?.price || "N/A"}
                      </span>

                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job?.time || "Just now"}
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── OTHER WORKER TABS ────────────────────────────────────── */}
      {/* Only for the 'worker' role; non-overview tabs rendered here */}
      {isWorkerRole && workerTab !== "overview" && (
        <WorkerContent tab={workerTab} user={user} jobs={jobs} />
      )}

    </div>
  );
}
