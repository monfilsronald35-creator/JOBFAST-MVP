import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Navigation, Search, X, ChevronUp, ChevronDown,
  Volume2, VolumeX, Locate, Clock,
} from "lucide-react";

// Fix default marker icons in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom icons ────────────────────────────────────────────────
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

// ── Helpers ─────────────────────────────────────────────────────
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
  "new name":   "Kontinye sou",
  merge:        "Mele",
  "on ramp":    "Antre nan otowout",
  "off ramp":   "Sòti nan otowout",
  roundabout:   "Antre nan wonn",
  rotary:       "Antre nan wonde-pwen",
  notification: "Kontinye",
  turn: { left: "Vire goch", right: "Vire dwat", "sharp left": "Vire fo goch",
    "sharp right": "Vire fo dwat", "slight left": "Ti vire goch",
    "slight right": "Ti vire dwat", uturn: "Fè demi-tou", straight: "Kontinye dwat" },
  fork:          { left: "Pran bif goch",           right: "Pran bif dwat"           },
  "end of road": { left: "Vire goch nan bout wout",  right: "Vire dwat nan bout wout" },
};

function stepInstruction(step) {
  const type = step?.maneuver?.type || "notification";
  const mod  = step?.maneuver?.modifier || "";
  const name = step?.name || "";
  const tr   = TURN_HT[type];
  const action = typeof tr === "string" ? tr : (typeof tr === "object" && tr[mod]) || "Kontinye";
  return name ? `${action} — ${name}` : action;
}

function stepIcon(step) {
  const type = step?.maneuver?.type || "";
  const mod  = step?.maneuver?.modifier || "";
  if (type === "arrive")  return "🏁";
  if (type === "depart")  return "🚀";
  if (type === "roundabout" || type === "rotary") return "🔄";
  if (mod?.includes("left"))  return "↰";
  if (mod?.includes("right")) return "↱";
  if (mod === "uturn") return "↩";
  return "↑";
}

// ── Map controller: auto-follow user position ────────────────────
function MapController({ position, following }) {
  const map = useMap();
  useEffect(() => {
    if (following && position) map.panTo(position, { animate: true, duration: 0.8 });
  }, [position, following, map]);
  return null;
}

// ── Main component ───────────────────────────────────────────────
export default function MapNavigationScreen() {
  const navigate = useNavigate();

  const [userPos,    setUserPos]    = useState(null);
  const [destPos,    setDestPos]    = useState(null);
  const [destName,   setDestName]   = useState("");
  const [route,      setRoute]      = useState([]);
  const [steps,      setSteps]      = useState([]);
  const [curStep,    setCurStep]    = useState(0);
  const [totalDist,  setTotalDist]  = useState(0);
  const [totalTime,  setTotalTime]  = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [following,  setFollowing]  = useState(true);
  const [voiceOn,    setVoiceOn]    = useState(true);
  const [searchQ,    setSearchQ]    = useState("");
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [stepsOpen,  setStepsOpen]  = useState(false);
  const [routeErr,   setRouteErr]   = useState("");
  const [gpsErr,     setGpsErr]     = useState("");

  const watchId   = useRef(null);
  const prevStep  = useRef(-1);

  // ── GPS watch ──────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsErr("GPS pa disponib."); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => { setUserPos([pos.coords.latitude, pos.coords.longitude]); setGpsErr(""); },
      (err) => {
        if (err.code === 1) setGpsErr("Aksepte GPS pou navigasyon an mache.");
        else setGpsErr("Pa ka jwenn lokasyon GPS ou.");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    return () => { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current); };
  }, []);

  // ── Voice ──────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!voiceOn || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }, [voiceOn]);

  // ── Auto-advance step when near waypoint ──────────────────
  useEffect(() => {
    if (!navigating || !userPos || !steps[curStep]?.maneuver?.location) return;
    const [lng, lat] = steps[curStep].maneuver.location;
    const dy = (userPos[0] - lat) * 111000;
    const dx = (userPos[1] - lng) * 111000 * Math.cos(lat * Math.PI / 180);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 30 && curStep < steps.length - 1) {
      const next = curStep + 1;
      setCurStep(next);
      if (next !== prevStep.current) { prevStep.current = next; speak(stepInstruction(steps[next])); }
    }
  }, [userPos, curStep, steps, navigating, speak]);

  // ── Nominatim search ───────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQ.trim()) return;
    setSearching(true); setResults([]);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=6&addressdetails=1`,
        { headers: { "Accept-Language": "fr,ht,es" } }
      );
      setResults(await r.json());
    } catch { setRouteErr("Rechèch echwe. Tcheke koneksyon ou."); }
    finally { setSearching(false); }
  }, [searchQ]);

  // ── OSRM routing ───────────────────────────────────────────
  const buildRoute = useCallback(async (dest) => {
    if (!userPos) { setRouteErr("Ap tann GPS ou..."); return; }
    setRouteErr(""); setResults([]);
    const [uLat, uLng] = userPos;
    const dLat = parseFloat(dest.lat);
    const dLng = parseFloat(dest.lon);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${uLng},${uLat};${dLng},${dLat}?steps=true&geometries=geojson&overview=full`;
      const d = await (await fetch(url)).json();
      if (d.code !== "Ok" || !d.routes?.length) { setRouteErr("Pa ka jwenn wout sa a."); return; }
      const rt = d.routes[0];
      setRoute(rt.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
      const allSteps = rt.legs.flatMap(l => l.steps);
      setSteps(allSteps); setDestPos([dLat, dLng]);
      setDestName(dest.display_name?.split(",").slice(0, 2).join(", ") || searchQ);
      setTotalDist(rt.distance); setTotalTime(rt.duration);
      setNavigating(true); setCurStep(0); prevStep.current = 0; setFollowing(true);
      speak(`Wout jwenn. ${metersToLabel(rt.distance)}, ${secondsToLabel(rt.duration)}. ${stepInstruction(allSteps[0])}`);
    } catch { setRouteErr("Erè kalkil wout. Eseye ankò."); }
  }, [userPos, searchQ, speak]);

  const stopNav = useCallback(() => {
    setNavigating(false); setRoute([]); setSteps([]); setDestPos(null);
    setDestName(""); setCurStep(0); setRouteErr(""); speak("Navigasyon kanpe.");
  }, [speak]);

  const activeStep = steps[curStep];
  const initCenter = userPos || [18.5432, -72.3395];

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col relative overflow-hidden">

      {/* ── LEAFLET MAP ────────────────────────────────────────── */}
      <MapContainer
        center={initCenter}
        zoom={15}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          maxZoom={19}
        />
        <MapController position={userPos} following={following} />
        {userPos  && <Marker position={userPos}  icon={userIcon} />}
        {destPos  && <Marker position={destPos}  icon={destIcon} />}
        {route.length > 0 && (
          <>
            <Polyline positions={route} pathOptions={{ color: "#000", weight: 9,  opacity: 0.18 }} />
            <Polyline positions={route} pathOptions={{ color: "#f59e0b", weight: 5, opacity: 0.95 }} />
          </>
        )}
      </MapContainer>

      {/* ── TOP OVERLAY ────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-[500] px-3 pt-3 space-y-2 pointer-events-none">

        {/* Search bar */}
        <div className="flex gap-2 pointer-events-auto">
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
              <button type="button" onClick={() => { setSearchQ(""); setResults([]); }}>
                <X className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !searchQ.trim()}
            className="px-4 bg-amber-500 text-slate-950 rounded-2xl font-bold text-sm active:scale-95 transition disabled:opacity-50 shadow-xl"
          >
            {searching ? "..." : "Go"}
          </button>
        </div>

        {/* Results dropdown */}
        {results.length > 0 && (
          <div className="pointer-events-auto bg-[#0f172a]/98 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            {results.map((r, i) => (
              <button key={i} type="button" onClick={() => buildRoute(r)}
                className="w-full text-left px-4 py-3 border-b border-slate-800/60 last:border-0 hover:bg-slate-800/50 transition">
                <p className="text-sm font-semibold text-white line-clamp-1">
                  {r.display_name?.split(",")[0]}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {r.display_name?.split(",").slice(1, 3).join(",")}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Errors */}
        {routeErr && (
          <div className="pointer-events-auto bg-red-500/15 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-red-400">
            {routeErr}
          </div>
        )}
        {gpsErr && (
          <div className="pointer-events-auto bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-400">
            📍 {gpsErr}
          </div>
        )}

        {/* Active instruction card */}
        {navigating && activeStep && (
          <div className="pointer-events-auto bg-[#0f172a]/97 border border-amber-500/40 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <span className="text-2xl shrink-0">{stepIcon(activeStep)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-snug line-clamp-2">
                {stepInstruction(activeStep)}
              </p>
              <p className="text-[10px] text-amber-400 mt-0.5">
                {metersToLabel(activeStep.distance || 0)} · Etap {curStep + 1}/{steps.length}
              </p>
            </div>
            <button type="button" onClick={() => setVoiceOn(v => !v)}
              className={`shrink-0 p-1.5 rounded-lg ${voiceOn ? "text-amber-400" : "text-slate-600"}`}>
              {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* ── BOTTOM OVERLAY ─────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-[500] px-3 pb-3 space-y-2">

        {/* Float buttons */}
        <div className="flex justify-between items-end">
          <button
            type="button"
            onClick={() => setFollowing(true)}
            className={`w-10 h-10 rounded-full shadow-xl border flex items-center justify-center transition ${
              following ? "bg-amber-500 border-amber-600 text-slate-950" : "bg-[#0f172a]/90 border-slate-700 text-slate-300"
            }`}
          >
            <Locate className="w-4 h-4" />
          </button>
          {navigating && steps.length > 0 && (
            <button
              type="button"
              onClick={() => setStepsOpen(v => !v)}
              className="flex items-center gap-1.5 bg-[#0f172a]/90 border border-slate-700 rounded-full px-3 py-2 text-xs text-slate-300 shadow-xl"
            >
              {stepsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              Tout etap ({steps.length})
            </button>
          )}
        </div>

        {/* Route summary + stop */}
        {navigating && (
          <div className="bg-[#0f172a]/97 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            <div className="flex-1 flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-black text-white">{secondsToLabel(totalTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-sm font-black text-white">{metersToLabel(totalDist)}</span>
              </div>
              {destName && <p className="text-[10px] text-slate-400 truncate">{destName}</p>}
            </div>
            <button type="button" onClick={stopNav}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-xs font-bold active:scale-95 transition shrink-0">
              Kanpe
            </button>
          </div>
        )}

        {/* Step list */}
        {navigating && stepsOpen && (
          <div className="bg-[#0f172a]/98 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
            {steps.map((s, i) => (
              <button key={i} type="button" onClick={() => setCurStep(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/50 last:border-0 transition ${
                  i === curStep ? "bg-amber-500/10 border-l-2 border-l-amber-500" : "hover:bg-slate-800/40"
                }`}>
                <span className="text-base shrink-0">{stepIcon(s)}</span>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-xs font-semibold line-clamp-1 ${i === curStep ? "text-amber-400" : "text-slate-200"}`}>
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
