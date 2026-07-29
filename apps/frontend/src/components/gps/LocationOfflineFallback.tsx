import React, { useState, useMemo } from 'react';
import { OFFLINE_CITIES } from '../../config/gpsConfig';

interface CityEntry { city: string; country: string; lat: number; lng: number; }
interface Coords     { lat: number; lng: number; city?: string; country?: string; }

interface LocationOfflineFallbackProps {
  onSelect:   (coords: Coords) => void;
  onDismiss?: () => void;
  gpsError?:  string | null;
}

type LocationMode = 'city' | 'manual';

export default function LocationOfflineFallback({ onSelect, onDismiss, gpsError }: LocationOfflineFallbackProps) {
  const [query,     setQuery]     = useState('');
  const [selected,  setSelected]  = useState<CityEntry | null>(null);
  const [mode,      setMode]      = useState<LocationMode>('city');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualErr, setManualErr] = useState('');

  const filtered = useMemo<CityEntry[]>(() =>
    query.trim()
      ? (OFFLINE_CITIES as CityEntry[]).filter(c =>
          c.city.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
        )
      : (OFFLINE_CITIES as CityEntry[]),
    [query]
  );

  function handleConfirm() {
    if (mode === 'city') {
      if (!selected) return;
      onSelect({ lat: selected.lat, lng: selected.lng, city: selected.city, country: selected.country });
    } else {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setManualErr('Kòòdone invalide. Lat: -90→90, Lng: -180→180');
        return;
      }
      setManualErr('');
      onSelect({ lat, lng });
    }
  }

  const MODES: { id: LocationMode; label: string }[] = [
    { id: 'city',   label: '🏙️ Vil'     },
    { id: 'manual', label: '🔢 Kòòdone' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">📍 Lokasyon Manyèl</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">GPS pa disponib — chwazi vil ou manyèlman</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
        )}
      </div>

      {gpsError && (
        <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
          ⚠️ {gpsError}
        </div>
      )}

      <div className="flex gap-1.5">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              mode === m.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'city' ? (
        <>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Chèche vil..."
            className="w-full px-3 py-2.5 bg-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-400/40" />

          <div className="space-y-1 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {filtered.map(c => (
              <button key={`${c.city}-${c.country}`} onClick={() => setSelected(c)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition ${
                  selected?.city === c.city && selected?.country === c.country
                    ? 'bg-indigo-500/20 border border-indigo-500/50'
                    : 'bg-slate-800/60 border border-transparent hover:border-slate-600'
                }`}>
                <div>
                  <span className="text-xs font-semibold text-white">{c.city}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{c.country}</span>
                </div>
                {selected?.city === c.city && selected?.country === c.country && (
                  <span className="text-indigo-400 text-xs">✓</span>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-[10px] text-slate-500 py-4">Pa gen rezilta</p>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Latitude</label>
              <input value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder="18.59" type="number" step="any"
                className="w-full px-3 py-2 bg-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-400/40" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Longitude</label>
              <input value={manualLng} onChange={e => setManualLng(e.target.value)} placeholder="-72.30" type="number" step="any"
                className="w-full px-3 py-2 bg-slate-800 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-400/40" />
            </div>
          </div>
          {manualErr && <p className="text-[10px] text-rose-400">{manualErr}</p>}
        </div>
      )}

      <button onClick={handleConfirm} disabled={mode === 'city' && !selected}
        className="w-full py-3 rounded-xl bg-indigo-500 text-white font-bold text-sm disabled:opacity-40 transition">
        Konfime Lokasyon
      </button>
    </div>
  );
}