import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Navigation, Search, X, ChevronUp, ChevronDown,
  Volume2, VolumeX, Locate, ArrowLeft, Clock, MapPin,
} from "lucide-react";

// ── Leaflet dynamic import (browser-only) ────────────────────────
let L;
let MapContainer, TileLayer, Marker, Polyline, useMap;

async function loadLeaflet() {
  if (L) return;
  const leaflet   = await import("leaflet");
  const rleaflet  = await import("react-leaflet");
  await import("leaflet/dist/leaflet.css");

  L           = leaflet.default || leaflet;
  MapContainer = rleaflet.MapContainer;
  TileLayer    = rleaflet.TileLayer;
  Marker       = rleaflet.Marker;
  Polyline     = rleaflet.Polyline;
  useMap       = rleaflet.useMap;

  // Fix default icons in Vite builds
  delete L.Icon.Default.prototype._getIconUrl;
  const base = "https://unpkg.com/leaflet@1.9.4/dist/images/";
  L.Icon.Default.mergeOptions({
    iconUrl:       `${base}marker-icon.png`,
    iconRetinaUrl: `${base}marker-icon-2x.png`,
    shadowUrl:     `${base}marker-shadow.png`,
  });
}

// ── Helpers ──────────────────────────────────────────────────────
function metersToLabel(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function secondsToLabel(s) {
  if (s < 60) return `${Math.round(s)} sèk`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return `${h}h ${m}min`;
}

const TURN_HT = {
  depart:       "Kòmanse",
  arrive:       "Ou rive!",
  turn:         { left: "Vire goch", right: "Vire dwat", "sharp left": "Vire fo goch", "sharp right": "Vire fo dwat", "slight left": "Ti vire goch", "slight right": "Ti vire dwat", uturn: "Fè demi-tou", straight: "Kontinye dwat" },
  "new name":   "Kontinye sou",
  merge:        "Mele",
  "on ramp":    "Antre nan otowout",
  "off ramp":   "Sòti nan otowout",
  fork:         { left: "Pran bif goch", right: "Pran bif dwat" },
  "end of road":{ left: "Vire goch nan bout wout la", right: "Vire dwat nan bout wout la" },
  roundabout:   "Antre nan wonn",
  rotary:       "Antre nan wonde-pwen",
  notification: "Kontinye",
};

function stepInstruction(step) {
  const type = step.maneuver?.type || "notification";
  const mod  = step.maneuver?.modifier || "";
  const name = step.name || "";
  const tr   = TURN_HT[type];
  let action = typeof tr === "string" ? tr : (typeof tr === "object" && tr[mod]) || "Kontinye";
  return name ? `${action} — ${name}` : action;
}

function stepIcon(step) {
  const type = step.maneuver?.type || "";
  const mod  = step.maneuver?.modifier || "";
  if (type === "arrive")  return "🏁";
  if (type === "depart")  return "🚀";
  if (type === "roundabout" || type === "rotary") return "🔄";
  if (mod === "left" || mod === "sharp left" || mod === "slight left")  return "↰";
  if (mod === "right" || mod === "sharp right" || mod === "slight right") return "↱";
  if (mod === "uturn")    return "↩";
  return "↑";
}

// ── Map child: follow user + recenter button ──────────────────────
function MapController({ position, following }) {
  const map = useMap();
  useEffect(() => {
    if (following && position) map.panTo(position, { animate: true, duration: 0.8 });
  }, [position, following, map]);
  return null;
}

// ── Custom div icons ──────────────────────────────────────────────
function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="width:20px;height:20px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
  });
}
function makeDestIcon() {
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    html: `<div style="width:28px;height:36px;position:relative">
      <div style="width:28px;height:28px;background:#ef4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>
    </div>`,
  });
}

// ── Main component ────────────────────────────────────────────────
export default function MapNavigationScreen() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [ready,   setReady]   = useState(false);   // leaflet loaded
  const [userPos, setUserPos] = useState(null);     // [lat, lng]
  const [destPos, setDestPos] = useState(null);     // [lat, lng]
  const [destName, setDestName] = useState("");
  const [route,   setRoute]   = useState([]);       // polyline coords
  const [steps,   setSteps]   = useState([]);       // turn-by-turn
  const [curStep, setCurStep] = useState(0);        // active step index
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [navigating,  setNavigating]  = useState(false);
  const [following,   setFollowing]   = useState(true);
  const [voiceOn,     setVoiceOn]     = useState(true);
  const [searchQ,     setSearchQ]     = useState("");
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [stepsOpen,   setStepsOpen]   = useState(false);
  const [routeError,  setRouteError]  = useState("");
  const [gpsError,    setGpsError]    = useState("");

  const watchId   = useRef(null);
  const prevStep  = useRef(-1);

  // Load Leaflet on mount
  useEffect(() => {
    loadLeaflet().then(() => setReady(true));
  }, []);

  // Start GPS watch
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS pa disponib sou aparèy sa a.");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setGpsError("");
      },
      (err) => {
        if (err.code === 1) setGpsError("Aksepte GPS pou itilize navigasyon an.");
        else setGpsError("Pa ka jwenn lokasyon ou.");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  // Voice helper
  const speak = useCallback((text) => {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }, [voiceOn]);

  // Advance step when user approaches next waypoint
  useEffect(() => {
    if (!navigating || !userPos || steps.length === 0) return;
    const step = steps[curStep];
    if (!step?.maneuver?.location) return;
    const [lng, lat] = step.maneuver.location;
    const dy = (userPos[0] - lat) * 111000;
    const dx = (userPos[1] - lng) * 111000 * Math.cos(lat * Math.PI / 180);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 30 && curStep < steps.length - 1) {
      const next = curStep + 1;
      setCurStep(next);
      if (next !== prevStep.current) {
        prevStep.current = next;
        speak(stepInstruction(steps[next]));
      }
    }
  }, [userPos, curStep, steps, navigating, speak]);

  // ── Nominatim search ─────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "fr,ht,es" } }
      );
      const data = await r.json();
      setResults(data);
    } catch {
      setRouteError("Pa ka chèche kote a. Tcheke koneksyon ou.");
    } finally {
      setSearching(false);
    }
  }, [searchQ]);

  // ── OSRM routing ─────────────────────────────────────────────
  const buildRoute = useCallback(async (dest) => {
    if (!userPos) {
      setRouteError("Ap tann GPS ou... Aksepte lokasyon sil plè.");
      return;
    }
    setRouteError("");
    setResults([]);
    const [uLat, uLng] = userPos;
    const dLat = parseFloat(dest.lat);
    const dLng = parseFloat(dest.lon);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${dLng},${dLat}?steps=true&geometries=geojson&overview=full&annotations=false`;
      const r   = await fetch(url);
      const d   = await r.json();
      if (d.code !== "Ok" || !d.routes?.length) {
        setRouteError("Pa ka jwenn wout ant de pwen sa yo.");
        return;
      }
      const rt = d.routes[0];
      const coords = rt.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const allSteps = rt.legs.flatMap(l => l.steps);
      setRoute(coords);
      setSteps(allSteps);
      setDestPos([dLat, dLng]);
      setDestName(dest.display_name?.split(",").slice(0, 2).join(", ") || searchQ);
      setTotalDist(rt.distance);
      setTotalTime(rt.duration);
      setNavigating(true);
      setCurStep(0);
      prevStep.current = 0;
      setFollowing(true);
      speak(`Wout jwenn. Distans: ${metersToLabel(rt.distance)}. Tan: ${secondsToLabel(rt.duration)}. ${stepInstruction(allSteps[0])}`);
    } catch {
      setRouteError("Erè pandan kalkil wout la. Eseye ankò.");
    }
  }, [userPos, searchQ, speak]);

  const stopNavigation = useCallback(() => {
    setNavigating(false);
    setRoute([]);
    setSteps([]);
    setDestPos(null);
    setDestName("");
    setCurStep(0);
    setRouteError("");
    speak("Navigasyon kanpe.");
  }, [speak]);

  // ── Render: loading ──────────────────────────────────────────
  if (!ready) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-[#020617]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Ap chaje kat GPS la...</p>
        </div>
      </div>
    );
  }

  const activeStep = steps[curStep];

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col relative bg-[#020617] overflow-hidden">

      {/* ── TOP SEARCH BAR ──────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-3 pt-3 space-y-2">

        {/* Search input row */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#0f172a]/95 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2.5 shadow-xl">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Chèche destinasyon ou..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
            {searchQ && (
              <button type="button" onClick={() => { setSearchQ(""); setResults([]); }}
                className="text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !searchQ.trim()}
            className="px-3.5 bg-amber-500 text-slate-950 rounded-2xl font-bold text-sm active:scale-95 transition disabled:opacity-50"
          >
            {searching ? "..." : "Chèche"}
          </button>
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && (
          <div className="bg-[#0f172a]/98 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => buildRoute(r)}
                className="w-full text-left px-4 py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/50 transition"
              >
                <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
                  {r.display_name?.split(",")[0]}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {r.display_name?.split(",").slice(1, 3).join(",")}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Route error */}
        {routeError && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-red-400">
            {routeError}
          </div>
        )}

        {/* GPS error */}
        {gpsError && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-400">
            📍 {gpsError}
          </div>
        )}

        {/* Current instruction card */}
        {navigating && activeStep && (
          <div className="bg-[#0f172a]/97 border border-amber-500/30 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <span className="text-2xl shrink-0">{stepIcon(activeStep)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                {stepInstruction(activeStep)}
              </p>
              <p className="text-[10px] text-amber-400 mt-0.5">
                {metersToLabel(activeStep.distance || 0)} · {curStep + 1}/{steps.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVoiceOn(v => !v)}
              className={`shrink-0 p-1.5 rounded-lg transition ${voiceOn ? "text-amber-400" : "text-slate-600"}`}
            >
              {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* ── LEAFLET MAP ─────────────────────────────────────────── */}
      <div className="flex-1 relative">
        <MapContainer
          center={userPos || [18.5432, -72.3395]}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <MapController position={userPos} following={following} />

          {/* User position */}
          {userPos && (
            <Marker
              position={userPos}
              icon={makeUserIcon()}
            />
          )}

          {/* Destination */}
          {destPos && (
            <Marker
              position={destPos}
              icon={makeDestIcon()}
            />
          )}

          {/* Route polyline */}
          {route.length > 0 && (
            <>
              {/* Shadow */}
              <Polyline positions={route} pathOptions={{ color: "#000", weight: 8, opacity: 0.2 }} />
              {/* Main route */}
              <Polyline positions={route} pathOptions={{ color: "#f59e0b", weight: 5, opacity: 0.9 }} />
            </>
          )}
        </MapContainer>
      </div>

      {/* ── BOTTOM PANEL ────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] px-3 pb-3 space-y-2">

        {/* Float controls */}
        <div className="flex justify-between items-end">
          {/* Recenter */}
          <button
            type="button"
            onClick={() => setFollowing(true)}
            className={`w-10 h-10 rounded-full shadow-xl border flex items-center justify-center transition ${
              following
                ? "bg-amber-500 border-amber-600 text-slate-950"
                : "bg-[#0f172a]/90 border-slate-700 text-slate-300"
            }`}
          >
            <Locate className="w-4 h-4" />
          </button>

          {/* Step-list toggle */}
          {navigating && steps.length > 0 && (
            <button
              type="button"
              onClick={() => setStepsOpen(v => !v)}
              className="flex items-center gap-1.5 bg-[#0f172a]/90 border border-slate-700 rounded-full px-3 py-2 text-xs text-slate-300 shadow-xl"
            >
              {stepsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              Etap yo ({steps.length})
            </button>
          )}
        </div>

        {/* Route summary / stop button */}
        {navigating && (
          <div className="bg-[#0f172a]/97 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="flex-1 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-black text-white">{secondsToLabel(totalTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-sm font-black text-white">{metersToLabel(totalDist)}</span>
              </div>
              {destName && (
                <p className="text-[10px] text-slate-400 truncate flex-1">{destName}</p>
              )}
            </div>
            <button
              type="button"
              onClick={stopNavigation}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-xs font-bold active:scale-95 transition"
            >
              Kanpe
            </button>
          </div>
        )}

        {/* Turn-by-turn step list */}
        {navigating && stepsOpen && (
          <div className="bg-[#0f172a]/98 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurStep(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 last:border-0 transition ${
                  i === curStep ? "bg-amber-500/10 border-l-2 border-l-amber-500" : "hover:bg-slate-800/40"
                }`}
              >
                <span className="text-base shrink-0">{stepIcon(s)}</span>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-xs font-semibold leading-tight line-clamp-1 ${i === curStep ? "text-amber-400" : "text-slate-200"}`}>
                    {stepInstruction(s)}
                  </p>
                  <p className="text-[10px] text-slate-500">{metersToLabel(s.distance || 0)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
