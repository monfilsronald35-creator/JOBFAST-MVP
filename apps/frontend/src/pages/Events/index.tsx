import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Users, Ticket } from 'lucide-react';

const BG = '#050B18'; const GOLD = '#FACC15';
const CATS = ['Tout', 'Mizik', 'Biznis', 'Spò', 'Edikasyon', 'Kiltirèl', 'Gastronomik'];

interface EventItem {
  id: number; name: string; date: string; city: string; category: string;
  attendees: number; price: number; emoji: string; tag: string; desc: string;
}

const MOCK: EventItem[] = [
  { id:1, name:'KOMPA FESTIVAL 2026', date:'2026-08-15', city:'Pòtoprens', category:'Mizik', attendees:15000, price:2500, emoji:'🎵', tag:'Gran Evènman', desc:'Pi gran fèt mizik nan Karayib la' },
  { id:2, name:'Haiti Tech Summit', date:'2026-09-10', city:'Pòtoprens', category:'Biznis', attendees:2000, price:5000, emoji:'💻', tag:'Teknoloji', desc:'Summit teknoloji entènasyonal' },
  { id:3, name:'Festival Gastronomique', date:'2026-10-05', city:'Petionville', category:'Gastronomik', attendees:3000, price:1000, emoji:'🍽️', tag:'Manje', desc:'Meye chèf ak manje ayisyen' },
  { id:4, name:'Kanaval Jakmel 2027', date:'2027-02-15', city:'Jakmel', category:'Kiltirèl', attendees:50000, price:0, emoji:'🎭', tag:'Gratis', desc:'Kanaval tradisyonèl ak mas papye-mache' },
  { id:5, name:'Match Foot – Haïti vs Jamaïque', date:'2026-11-20', city:'Pòtoprens', category:'Spò', attendees:25000, price:500, emoji:'⚽', tag:'Spò', desc:'Eliminatwa CONCACAF 2026' },
];

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-HT', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Events() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tout');

  const filtered = MOCK.filter(e =>
    (!search || e.name.toLowerCase().includes(search.toLowerCase())) &&
    (cat === 'Tout' || e.category === cat)
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4" style={{ background: 'linear-gradient(135deg,#0a1628,#050B18)' }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color: '#64748b' }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎉</span>
          <div>
            <h1 className="text-2xl font-black text-white">Evènman</h1>
            <p className="text-xs" style={{ color: '#64748b' }}>Konser, konfrans, match, fèt</p>
          </div>
        </div>
        <div className="relative mb-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Evènman, atis, lokasyon…"
            className="w-full rounded-[14px] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
            style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.1)' }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: cat===c ? GOLD : 'rgba(255,255,255,.06)', color: cat===c ? BG : '#94a3b8', border: cat===c ? 'none' : '1px solid rgba(255,255,255,.08)' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {filtered.map(e => (
          <div key={e.id} className="rounded-[20px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="relative p-4 flex items-start gap-4">
              <div className="text-4xl">{e.emoji}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${GOLD}15`, color: GOLD }}>{e.tag}</span>
                    <h3 className="text-sm font-black text-white mt-1 leading-tight">{e.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{e.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-[10px]" style={{ color: '#64748b' }}>
                  <span className="flex items-center gap-1"><Calendar size={10}/> {formatDate(e.date)}</span>
                  <span className="flex items-center gap-1"><MapPin size={10}/> {e.city}</span>
                  <span className="flex items-center gap-1"><Users size={10}/> {e.attendees.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="px-4 pb-4 flex items-center justify-between">
              <span className="text-sm font-black" style={{ color: GOLD }}>
                {e.price === 0 ? 'Gratis' : `${e.price.toLocaleString()} HTG`}
              </span>
              <button className="flex items-center gap-1.5 text-xs font-black rounded-[12px] px-4 py-2"
                style={{ background: GOLD, color: BG }}>
                <Ticket size={12}/> Achte Tikè
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}