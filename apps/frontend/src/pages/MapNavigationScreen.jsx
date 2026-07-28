 import React, { useMemo, useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Locate,
  Clock,
} from "lucide-react";
import { useNavigationGPS } from "./NavigationGPS";
import { useNavigationVoice } from "./useNavigationVoice";
import { useNavigationSearch } from "./useNavigationSearch";
import { useNavigationRoute } from "./useNavigationRoute";

// Fix default marker icons (Vite / CRA)
if (L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

const userIcon = L.divIcon({
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(59,130,246,0.25)"></div>`,
});

const destIcon = L.divIcon({
  className: "",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  html: `<div style="width:28px;height:36px">
    <div style="width:28px;height:28px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4)"></div>
  </div>`,
});

function MapController({ position, following }) {
  const map = useMap();

  useEffect(() => {
    if (following && position) {
      map.panTo(position, { animate: true, duration: 0.8 });
    }
  }, [position, following, map]);

  return null;
}

export default function MapNavigationScreen() {
  const [following, setFollowing] = useState(true);
  const [stepsOpen, setStepsOpen] = useState(false);

  // Voice (SpeechSynthesis kache andedan hook la)
  const { voiceOn, setVoiceOn, speak } = useNavigationVoice();

  // Search (frontend → /api/navigation/search)
  const {
    query,
    setQuery,
    results,
    searching,
    error: searchError,
    handleSearch,
    setResults,
  } = useNavigationSearch();

  // GPS (battery‑saving logic andedan hook la; la nou ban l always high)
  const {
    position: userPos,
    error: gpsError,
    speedKmh,
  } = useNavigationGPS({ highAccuracy: true });

  // Routing (frontend → /api/navigation/route, AI routes, traffic, multi‑mode)
  const {
    destPos,
    destName,
    mode,
    routeCoords,
    steps,
    curStep,
    navigating,
    totalDist,
    totalTime,
    eta,
    routeErr,
    activeStep,
    setMode,
    buildRoute,
    stop,
    setCurStep,
    metersToLabel,
    secondsToLabel,
    stepInstruction,
    stepIcon,
  } = useNavigationRoute({ userPos, speak });

  const initCenter = userPos || [18.5432, -72.3395];

  const topError = useMemo(
    () => routeErr || gpsError || searchError,
    [routeErr, gpsError, searchError]
  );

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col relative overflow-hidden">
      <MapContainer
        center={initCenter}
        zoom={15}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        {/* Pita: chanje TileLayer selon theme (dark / light / satellite / terrain) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController position={userPos} following={following} />

        {userPos && <Marker position={userPos} icon={userIcon} />}
        {destPos && <Marker position={destPos} icon={destIcon} />}

        {/* Pita: ajoute traffic segments (green / yellow / red) sou routeCoords */}
        {routeCoords && routeCoords.length > 0 && (
          <>
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: "#000",
                weight: 9,
                opacity: 0.18,
              }}
            />
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: "#f59e0b",
                weight: 5,
                opacity: 0.95,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* TOP UI */}
      <div className="absolute top-0 left-0 right-0 z-[500] px-3 pt-3 space-y-2 pointer-events-none">
        {/* Search */}
        <div className="flex gap-2 pointer-events-auto">
          <div className="flex-1 flex items-center gap-2 bg-[#0f172a]/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2.5 shadow-xl">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Chèche destinasyon ou..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            className="px-4 bg-amber-500 text-slate-950 rounded-2xl font-bold text-sm active:scale-95 transition disabled:opacity-50 shadow-xl"
          >
            {searching ? "..." : "Go"}
          </button>
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="pointer-events-auto bg-[#0f172a]/98 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {results.map((r, index) => (
              <button
                key={r.id || r.place_id || index}
                type="button"
                onClick={() => buildRoute(r)}
                className="w-full text-left px-4 py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/50 transition"
              >
                <p className="text-sm font-semibold text-white line-clamp-1">
                  {r.name || r.label}
                </p>
                {r.description && (
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {r.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Error banner */}
        {topError && (
          <div className="pointer-events-auto bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-red-400">
            {topError}
          </div>
        )}

        {/* Active instruction */}
        {navigating && activeStep && (
          <div className="pointer-events-auto bg-[#0f172a]/97 border border-amber-500/40 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <span className="text-2xl shrink-0">
              {stepIcon(activeStep)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                {stepInstruction(activeStep)}
              </p>
              <p className="text-[10px] text-amber-400 mt-0.5">
                {metersToLabel(activeStep.distance || 0)} · Etap{" "}
                {curStep + 1}/{steps.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVoiceOn((v) => !v)}
              className={
                "shrink-0 p-1.5 rounded-lg " +
                (voiceOn ? "text-amber-400" : "text-slate-600")
              }
            >
              {voiceOn ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM UI */}
      <div className="absolute bottom-0 left-0 right-0 z-[500] px-3 pb-3 space-y-2">
        <div className="flex justify-between items-end">
          <button
            type="button"
            onClick={() => setFollowing(true)}
            className={
              "w-10 h-10 rounded-full shadow-xl border flex items-center justify-center transition " +
              (following
                ? "bg-amber-500 border-amber-600 text-slate-950"
                : "bg-[#0f172a]/90 border-slate-700 text-slate-300")
            }
          >
            <Locate className="w-4 h-4" />
          </button>

          {/* Mode switcher pou driving / walking / bike / truck */}
          <div className="flex items-center gap-1 bg-[#0f172a]/90 border border-slate-700 rounded-full px-2 py-1 text-[10px] text-slate-300 shadow-xl">
            {["driving", "walking", "bicycle", "truck"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={
                  "px-2 py-0.5 rounded-full " +
                  (mode === m
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-300")
                }
              >
                {m === "driving"
                  ? "🚗"
                  : m === "walking"
                  ? "🚶"
                  : m === "bicycle"
                  ? "🚲"
                  : "🚚"}
              </button>
            ))}
          </div>

          {navigating && steps && steps.length > 0 && (
            <button
              type="button"
              onClick={() => setStepsOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-[#0f172a]/90 border border-slate-700 rounded-full px-3 py-2 text-xs text-slate-300 shadow-xl"
            >
              {stepsOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
              Tout etap ({steps.length})
            </button>
          )}
        </div>

        {/* Route summary */}
        {navigating && (
          <div className="bg-[#0f172a]/97 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="flex-1 flex items-center gap-4 min-w-0">
              <div className="flex flex-col gap-0.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-black text-white">
                    {secondsToLabel(totalTime)}
                  </span>
                </div>
                {eta && (
                  <span className="text-[10px] text-slate-400">
                    ETA {eta}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-sm font-black text-white">
                  {metersToLabel(totalDist)}
                </span>
              </div>

              {speedKmh != null && (
                <span className="text-[10px] text-slate-400 shrink-0">
                  {speedKmh} km/h
                </span>
              )}

              {destName && (
                <p className="text-[10px] text-slate-400 truncate">
                  {destName}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={stop}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-xs font-bold active:scale-95 transition shrink-0"
            >
              Kanpe
            </button>
          </div>
        )}

        {/* Steps list */}
        {navigating && stepsOpen && steps && steps.length > 0 && (
          <div className="bg-[#0f172a]/98 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurStep(i)}
                className={
                  "w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 last:border-0 transition " +
                  (i === curStep
                    ? "bg-amber-500/10 border-l-2 border-l-amber-500"
                    : "hover:bg-slate-800/40")
                }
              >
                <span className="text-base shrink-0">
                  {stepIcon(s)}
                </span>
                <div className="flex-1 text-left min-w-0">
                  <p
                    className={
                      "text-xs font-semibold line-clamp-1 " +
                      (i === curStep
                        ? "text-amber-400"
                        : "text-slate-200")
                    }
                  >
                    {stepInstruction(s)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {metersToLabel(s.distance || 0)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
