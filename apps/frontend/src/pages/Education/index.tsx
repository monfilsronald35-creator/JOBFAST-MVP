import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, Users, Play } from 'lucide-react';

const BG = '#050B18'; const GOLD = '#FACC15';
const CATEGORIES = ['Tout', 'Teknoloji', 'Biznis', 'Lang', 'Sante', 'Atizay', 'Mèt'];

interface Course {
  id: number; name: string; category: string; instructor: string; level: string;
  duration: string; students: number; rating: number; price: number; free: boolean;
  emoji: string; tag: string;
}

const MOCK: Course[] = [
  { id:1, name:'Devlopman Entènèt', category:'Teknoloji', instructor:'Jean Pierre', level:'Kòmansan', duration:'40h', students:1240, rating:4.8, price:3500, free:false, emoji:'💻', tag:'Pi Popilè' },
  { id:2, name:'Kreyòl Pou Biznis', category:'Lang', instructor:'Marie Joseph', level:'Entèmédyè', duration:'20h', students:876, rating:4.9, price:0, free:true, emoji:'🗣️', tag:'Gratis' },
  { id:3, name:'Jesyon Biznis SME', category:'Biznis', instructor:'Robert Dumas', level:'Avanse', duration:'60h', students:543, rating:4.7, price:5000, free:false, emoji:'📊', tag:'Sètifika' },
  { id:4, name:'Swen Enfimyè', category:'Sante', instructor:'Dr. Anne Claire', level:'Pwofesyonèl', duration:'120h', students:289, rating:4.9, price:8000, free:false, emoji:'🩺', tag:'Akredirasyon' },
  { id:5, name:'Desèn & Grafik', category:'Atizay', instructor:'Claude Belizaire', level:'Kòmansan', duration:'30h', students:1102, rating:4.6, price:2500, free:false, emoji:'🎨', tag:'Kreatif' },
  { id:6, name:'Matematik Bak', category:'Mèt', instructor:'Thierry Marcel', level:'Entèmédyè', duration:'45h', students:2340, rating:4.8, price:1500, free:false, emoji:'📐', tag:'Egzamen' },
];

export default function Education() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('Tout');

  const filtered = MOCK.filter(c =>
    (!search || c.name.toLowerCase().includes(search.toLowerCase())) &&
    (cat === 'Tout' || c.category === cat)
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4" style={{ background: 'linear-gradient(135deg,#0a1628,#050B18)' }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color: '#64748b' }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📚</span>
          <div>
            <h1 className="text-2xl font-black text-white">Edikasyon</h1>
            <p className="text-xs" style={{ color: '#64748b' }}>Kò, sètifika, mèt patikilye</p>
          </div>
        </div>
        <div className="relative mb-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kò, matyè, mèt…"
            className="w-full rounded-[14px] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
            style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.1)' }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: cat===c ? GOLD : 'rgba(255,255,255,.06)', color: cat===c ? BG : '#94a3b8', border: cat===c ? 'none' : '1px solid rgba(255,255,255,.08)' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {filtered.map(c => (
          <button key={c.id} className="text-left rounded-[20px] overflow-hidden transition-all active:scale-[.98]"
            style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="relative p-5 flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(250,204,21,.08)', border: `1px solid ${GOLD}20` }}>
                {c.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black text-white leading-tight">{c.name}</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: c.free ? 'rgba(52,211,153,.15)' : `${GOLD}15`, color: c.free ? '#34d399' : GOLD }}>
                    {c.free ? 'GRATIS' : c.tag}
                  </span>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{c.instructor} · {c.level}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: '#64748b' }}>
                <span className="flex items-center gap-1"><Clock size={11}/> {c.duration}</span>
                <span className="flex items-center gap-1"><Users size={11}/> {c.students.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Star size={11} fill={GOLD} style={{ color: GOLD }}/> {c.rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black" style={{ color: GOLD }}>
                  {c.free ? 'Gratis' : `${c.price.toLocaleString()} HTG`}
                </span>
                <button className="flex items-center gap-1.5 text-xs font-black rounded-[12px] px-3 py-2"
                  style={{ background: GOLD, color: BG }}>
                  <Play size={11}/> Kòmanse
                </button>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}