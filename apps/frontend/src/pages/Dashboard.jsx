import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Clock, RefreshCcw } from "lucide-react";
import API from "../api/axios";

// ================= GLOBAL CACHE =================
let jobsCache = null;
let cacheTime = 0;
const CACHE_TTL = 15000;

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null); // 🔥 UX upgrade

  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const inFlightRef = useRef(false);

  // ================= CLEANUP =================
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

  // ================= FETCH =================
  const fetchJobs = useCallback(async (isRetry = false) => {
    const now = Date.now();
    const hasCache = jobsCache && now - cacheTime < CACHE_TTL;

    // 🔥 prevent overlap but allow retry override
    if (inFlightRef.current && !isRetry) return;
    inFlightRef.current = true;

    try {
      if (!mountedRef.current) return;

      setError("");

      // ================= CACHE HIT =================
      if (!isRetry && hasCache) {
        setJobs(jobsCache);
        setLoading(false);
        return;
      }

      setLoading(true);

      // ================= ABORT SAFETY =================
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await API.get("/jobs", {
        signal: controller.signal,
      });

      if (!mountedRef.current) return;

      const data = Array.isArray(res?.data) ? res.data : [];

      // ================= CACHE UPDATE =================
      jobsCache = data;
      cacheTime = now;

      setJobs(data);
      setLastUpdated(now); // 🔥 UX indicator

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

          // 🔥 safe retry gate (no overlap)
          if (!inFlightRef.current) {
            fetchJobs(true);
          }
        }, delay);
      } else {
        setRetrying(false);
      }

    } finally {
      inFlightRef.current = false;

      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // ================= INIT =================
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ================= REFRESH =================
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

  // ================= UI =================
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Byenveni 👋</h2>
          <p className="text-slate-400 text-sm">
            Men travay ki disponib bò kote w.
          </p>

          {retrying && (
            <p className="text-xs text-amber-400 mt-1">
              Rekoneksyon...
            </p>
          )}

          {lastUpdated && (
            <p className="text-[10px] text-slate-500 mt-1">
              Dènye mizajou: {new Date(lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
        >
          <RefreshCcw className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
          {error}
        </div>
      )}

      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
        Travay ki pre w
      </h3>

      {/* LOADING */}
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
  );
}