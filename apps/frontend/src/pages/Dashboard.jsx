import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Clock, RefreshCcw } from "lucide-react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getRoleDashboard, isEmployerRole } from "../config/roleConfig";
import WorkerContent, {
  WORKER_TABS,
  OverviewSupplement,
} from "./worker/WorkerDashboard";
import CompanyContent, {
  COMPANY_TABS,
  CompanyOverviewSupplement,
} from "./company/CompanyDashboard";
import EnterpriseContent, {
  ENTERPRISE_TABS,
  EnterpriseOverviewSupplement,
} from "./enterprise/EnterpriseDashboard";

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
  // Tab 'overview' preserves the original job list JSX exactly.
  // Other tabs delegate to WorkerContent (worker/WorkerDashboard.jsx).
  // service_provider and user roles (also isWorker) skip the tab bar
  // and always see the plain job list — same behavior as before.
  return (
    <div className="space-y-4">

      {/* HEADER — preserved for all worker-type roles */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">
            Byenveni{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h2>
          <p className="text-slate-400 text-sm">
            {isWorkerRole && workerTab !== "overview"
              ? dashConfig.subtitle
              : "Men travay ki disponib bò kote w."}
          </p>

          {retrying && (
            <p className="text-xs text-amber-400 mt-1">Rekoneksyon...</p>
          )}

          {lastUpdated && workerTab === "overview" && (
            <p className="text-[10px] text-slate-500 mt-1">
              Dènye mizajou: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Refresh only on overview tab */}
        {workerTab === "overview" && (
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <RefreshCcw className="w-5 h-5 text-amber-400" />
          </button>
        )}
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
      {/* Visible when: non-worker roles (service_provider/user) OR  */}
      {/* worker role with overview tab active.                       */}
      {(!isWorkerRole || workerTab === "overview") && (
        <div className="space-y-6">

          {/* Quick stats + trust bar — worker role only */}
          {isWorkerRole && <OverviewSupplement user={user} />}

          {/* ERROR */}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Travay ki pre w
          </h3>

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
