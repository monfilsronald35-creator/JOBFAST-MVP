import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Navigation, ChevronRight, Zap } from 'lucide-react';

const BG = '#050B18'; const GOLD = '#FACC15';

interface VehicleType { id: string; label: string; emoji: string; capacity: string; basePrice: number; pricePerKm: number; color: string; }
interface Route { from: string; to: string; duration: string; avgPrice: number; }

const VEHICLE_TYPES: VehicleType[] = [
  { id:'moto',   label:'Moto',    emoji:'🛵', capacity:'1-2 moun', basePrice:50,  pricePerKm:15, color:'#f59e0b' },
  { id:'car',    label:'Oto',     emoji:'🚗', capacity:'1-4 moun', basePrice:150, pricePerKm:35, color:'#3b82f6' },
  { id:'tapTap', label:'Tap-Tap', emoji:'🚌', capacity:'8-15 moun', basePrice:30, pricePerKm:8,  color:'#10b981' },
  { id:'truck',  label:'Kamyon',  emoji:'🚛', capacity:'Machandiz', basePrice:500, pricePerKm:80, color:'#8b5cf6' },
];

const POPULAR_ROUTES: Route[] = [
  { from:'Pòtoprens', to:'Petionville',  duration:'25min', avgPrice:200 },
  { from:'Pòtoprens', to:'Cap-Haïtien', duration:'4h30',  avgPrice:2500 },
  { from:'Petionville', to:'Aèpò',      duration:'20min', avgPrice:350 },
  { from:'Pòtoprens', to:'Jacmel',      duration:'2h',    avgPrice:1500 },
];

export default function Transport() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('moto');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const vehicle = VEHICLE_TYPES.find(v => v.id === selected);

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4" style={{ background: 'linear-gradient(135deg,#0a1628,#050B18)' }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color: '#64748b' }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🛵</span>
          <div>
            <h1 className="text-2xl font-black text-white">Transpò</h1>
            <p className="text-xs" style={{ color: '#64748b' }}>Moto, oto, tap-tap, kamyon</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Tip Transpò</p>
          <div className="grid grid-cols-2 gap-3">
            {VEHICLE_TYPES.map(v => (
              <button key={v.id} onClick={() => setSelected(v.id)}
                className="rounded-[16px] p-4 text-left transition-all active:scale-[.97]"
                style={{
                  background: selected===v.id ? `${v.color}15` : 'rgba(255,255,255,.04)',
                  border: selected===v.id ? `2px solid ${v.color}50` : '1px solid rgba(255,255,255,.08)',
                  boxShadow: selected===v.id ? `0 0 20px ${v.color}15` : 'none',
                }}>
                <span className="text-2xl">{v.emoji}</span>
                <p className="mt-2 text-sm font-black text-white">{v.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{v.capacity}</p>
                <p className="text-xs font-bold mt-2" style={{ color: v.color }}>
                  À pati {v.basePrice.toLocaleString()} HTG
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] p-4 space-y-3"
          style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Wout ou</p>
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
              <input value={from} onChange={e => setFrom(e.target.value)} placeholder="Depi kote?"
                className="w-full rounded-[12px] pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.08)' }} />
            </div>
            <div className="relative">
              <MapPin size={12} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: GOLD }} />
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="Kote ou prale?"
                className="w-full rounded-[12px] pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none"
                style={{ background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.08)' }} />
            </div>
          </div>
          <button className="w-full rounded-[14px] py-3.5 text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[.98]"
            style={{ background: GOLD, color: BG }}>
            <Zap size={14} /> Jwenn {vehicle?.label} Kounye a
          </button>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#475569' }}>Wout Popilè</p>
          <div className="space-y-2">
            {POPULAR_ROUTES.map((r, i) => (
              <button key={i} className="w-full rounded-[14px] p-3.5 flex items-center justify-between transition-all active:scale-[.98]"
                style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <div className="flex items-center gap-3">
                  <Navigation size={14} style={{ color: '#64748b' }} />
                  <div className="text-left">
                    <p className="text-xs font-black text-white">{r.from} → {r.to}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={10} style={{ color: '#475569' }} />
                      <span className="text-[10px]" style={{ color: '#64748b' }}>{r.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black" style={{ color: GOLD }}>~{r.avgPrice.toLocaleString()} HTG</p>
                  <ChevronRight size={12} style={{ color: '#475569' }} className="ml-auto mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}