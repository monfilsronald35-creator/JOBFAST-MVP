import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";

const BG = "#050B18"; const GOLD = "#FACC15";

const MOCK_STORIES = [
  { id:1, author:"Jean Paul",  role:"Elektrisyen",  emoji:"👷", color:"#f59e0b", duration:5, viewed:false, caption:"Nouvo travay nan Petionville — yon gwo pwojè!" },
  { id:2, author:"Marie Rose", role:"Sekretè",       emoji:"💼", color:"#3b82f6", duration:5, viewed:false, caption:"Mwen disponib pou travay biwo. Kontakte mwen." },
  { id:3, author:"JOBFAST",    role:"Ofisyèl",       emoji:"⚡", color: GOLD,     duration:8, viewed:true,  caption:"500+ nouvo travayè rejwenn JOBFAST semèn sa a!" },
  { id:4, author:"Claude M.",  role:"Plombiye",      emoji:"🔧", color:"#10b981", duration:5, viewed:false, caption:"Travay fini nan Delmas 75 — kliyan satisfè 💪" },
  { id:5, author:"Sophia D.",  role:"Enfimyè",       emoji:"🩺", color:"#ec4899", duration:5, viewed:false, caption:"Disponib pou swen lakay — Pòtoprens & anviron" },
  { id:6, author:"Robert T.",  role:"Mekanisyen",    emoji:"🚗", color:"#8b5cf6", duration:5, viewed:true,  caption:"Atèlye mwen ouvè 7j/7 — Reparasyon rapid" },
];

export default function Stories() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null); // index of open story
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const openStory = (i) => {
    setActive(i);
    setProgress(0);
    MOCK_STORIES[i].viewed = true;
  };

  const closeStory = () => { setActive(null); setProgress(0); };

  const nextStory = () => {
    if (active < MOCK_STORIES.length - 1) { setActive(active + 1); setProgress(0); }
    else closeStory();
  };

  const prevStory = () => {
    if (active > 0) { setActive(active - 1); setProgress(0); }
  };

  useEffect(() => {
    if (active === null) return;
    const story = MOCK_STORIES[active];
    const ms = (story.duration || 5) * 1000;
    const step = 100 / (ms / 50);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(timerRef.current); nextStory(); return 100; }
        return p + step;
      });
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [active]);

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4">
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color:"#64748b" }}>← Retounen</button>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-white">Istwa</h1>
          <button className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full"
            style={{ background:`${GOLD}15`, color: GOLD, border:`1px solid ${GOLD}30` }}>
            <Plus size={12} /> Ajoute Istwa
          </button>
        </div>
      </div>

      {/* Story rings */}
      <div className="px-4">
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {MOCK_STORIES.map((s, i) => (
            <button key={s.id} onClick={() => openStory(i)} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{
                    background: s.viewed ? "rgba(255,255,255,.08)" : `${s.color}20`,
                    border: s.viewed ? "2.5px solid #334155" : `2.5px solid ${s.color}`,
                    boxShadow: s.viewed ? "none" : `0 0 12px ${s.color}40`,
                  }}>
                  {s.emoji}
                </div>
                {s.id === 3 && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: GOLD }}>
                    <span className="text-[8px] font-black" style={{ color: BG }}>✓</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-center" style={{ color: s.viewed ? "#475569" : "white", maxWidth:60 }}>
                {s.author.split(' ')[0]}
              </p>
            </button>
          ))}
        </div>

        {/* Recent stories list */}
        <div className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color:"#475569" }}>Istwa Resan</h2>
          <div className="flex flex-col gap-3">
            {MOCK_STORIES.filter(s => !s.viewed).map((s, i) => (
              <button key={s.id} onClick={() => openStory(MOCK_STORIES.indexOf(s))}
                className="flex items-center gap-3 rounded-[16px] p-3 text-left transition-all active:scale-[.98]"
                style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background:`${s.color}15`, border:`2px solid ${s.color}50` }}>
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">{s.author}</p>
                  <p className="text-[10px]" style={{ color:"#64748b" }}>{s.role}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color:"#94a3b8" }}>{s.caption}</p>
                </div>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Full-screen story viewer */}
      {active !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:"rgba(0,0,0,.95)" }}>
          <div className="relative w-full max-w-sm h-screen flex flex-col">
            {/* Progress bars */}
            <div className="flex gap-1 px-4 pt-12 pb-3">
              {MOCK_STORIES.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,.2)" }}>
                  <div className="h-full rounded-full transition-none"
                    style={{ width: i < active ? "100%" : i === active ? `${progress}%` : "0%", background:"white" }} />
                </div>
              ))}
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 px-4 pb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{ background:`${MOCK_STORIES[active].color}20`, border:`2px solid ${MOCK_STORIES[active].color}` }}>
                {MOCK_STORIES[active].emoji}
              </div>
              <div>
                <p className="text-sm font-black text-white">{MOCK_STORIES[active].author}</p>
                <p className="text-[10px]" style={{ color:"#64748b" }}>{MOCK_STORIES[active].role}</p>
              </div>
              <button onClick={closeStory} className="ml-auto" style={{ color:"#94a3b8" }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-8">
              <div className="text-center">
                <span style={{ fontSize:80 }}>{MOCK_STORIES[active].emoji}</span>
                <p className="mt-6 text-lg font-bold text-white leading-relaxed">
                  {MOCK_STORIES[active].caption}
                </p>
              </div>
            </div>

            {/* Navigation tap zones */}
            <div className="absolute inset-y-0 left-0 w-1/3" onClick={prevStory} />
            <div className="absolute inset-y-0 right-0 w-1/3" onClick={nextStory} />

            {/* Bottom */}
            <div className="px-4 pb-8">
              <div className="flex items-center gap-3">
                <Eye size={14} style={{ color:"#64748b" }} />
                <span className="text-xs" style={{ color:"#64748b" }}>Klike gòch/dwat pou navige</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
