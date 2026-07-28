import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, MapPin, Clock, ChevronRight, Flame } from "lucide-react";

const BG = "#050B18"; const GOLD = "#FACC15";
const CUISINES = ["Tout", "Ayisyen", "Entènasyonal", "Fast Food", "Seafood", "Vegetal"];
const MOCK = [
  { id:1, name:"Quartier Latin", city:"Petionville", cuisine:"Entènasyonal", rating:4.8, reviews:423, price:"$$$", deliveryMin:25, open:true, emoji:"🍽️", tag:"#1 Pòtoprens" },
  { id:2, name:"Coin des Arts", city:"Pòtoprens", cuisine:"Ayisyen", rating:4.7, reviews:287, price:"$$", deliveryMin:20, open:true, emoji:"🇭🇹", tag:"Tradisyonèl" },
  { id:3, name:"La Souvenance", city:"Petionville", cuisine:"Ayisyen", rating:4.6, reviews:334, price:"$$", deliveryMin:30, open:true, emoji:"🍲", tag:"Manje Peyi" },
  { id:4, name:"Bamboo Garden", city:"Pòtoprens", cuisine:"Entènasyonal", rating:4.5, reviews:156, price:"$$$", deliveryMin:35, open:false, emoji:"🥢", tag:"Aziatik" },
  { id:5, name:"KFC Haiti", city:"Pòtoprens", cuisine:"Fast Food", rating:4.0, reviews:891, price:"$", deliveryMin:15, open:true, emoji:"🍗", tag:"Rapid" },
  { id:6, name:"Ocean Blue", city:"Pòtoprens", cuisine:"Seafood", rating:4.9, reviews:198, price:"$$$$", deliveryMin:40, open:true, emoji:"🦞", tag:"Pwason Fre" },
];

export default function Restaurants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState("Tout");
  const [items, setItems] = useState(MOCK);

  useEffect(() => {
    let f = MOCK;
    if (search) f = f.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
    if (cuisine !== "Tout") f = f.filter(r => r.cuisine === cuisine);
    setItems(f);
  }, [search, cuisine]);

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      {/* Hero */}
      <div className="px-4 pt-8 pb-4" style={{ background:"linear-gradient(135deg,#0a1628,#050B18)" }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color:"#64748b" }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🍽️</span>
          <div>
            <h1 className="text-2xl font-black text-white">Restoran</h1>
            <p className="text-xs" style={{ color:"#64748b" }}>Manje bon, liv oswa sit</p>
          </div>
        </div>
        <div className="relative mb-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color:"#475569" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Restoran, manje…"
            className="w-full rounded-[14px] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
            style={{ background:"rgba(255,255,255,.06)", border:"1.5px solid rgba(255,255,255,.1)" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CUISINES.map(c => (
            <button key={c} onClick={() => setCuisine(c)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: cuisine===c ? GOLD : "rgba(255,255,255,.06)", color: cuisine===c ? BG : "#94a3b8", border: cuisine===c ? "none" : "1px solid rgba(255,255,255,.08)" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      <div className="px-4 mt-4 mb-2">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={14} style={{ color: GOLD }} />
          <h2 className="text-sm font-black text-white">Pi Popilè</h2>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {items.map(r => (
          <button key={r.id} className="text-left rounded-[20px] overflow-hidden transition-all active:scale-[.98]"
            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
            <div className="relative flex items-center justify-center" style={{ height:130, background:"rgba(255,255,255,.03)" }}>
              <span style={{ fontSize:52 }}>{r.emoji}</span>
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black"
                style={{ background:`${GOLD}20`, color: GOLD, border:`1px solid ${GOLD}30` }}>{r.tag}</span>
              {!r.open && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[20px]"
                  style={{ background:"rgba(5,11,24,.7)" }}>
                  <span className="text-xs font-black" style={{ color:"#f87171" }}>Fèmen</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-black text-white">{r.name}</h3>
                  <p className="flex items-center gap-1 mt-0.5 text-xs" style={{ color:"#64748b" }}>
                    <MapPin size={11} /> {r.city} · {r.cuisine}
                  </p>
                </div>
                <span className="text-sm font-black" style={{ color:"#94a3b8" }}>{r.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={11} fill={GOLD} style={{ color: GOLD }} />
                    <span className="text-xs font-bold text-white">{r.rating}</span>
                    <span className="text-[10px]" style={{ color:"#475569" }}>({r.reviews})</span>
                  </div>
                  {r.open && (
                    <div className="flex items-center gap-1 text-[10px]" style={{ color:"#34d399" }}>
                      <Clock size={10} /> {r.deliveryMin} min
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs font-black rounded-full px-3 py-1.5"
                  style={{ background: r.open ? GOLD : "rgba(255,255,255,.1)", color: r.open ? BG : "#475569" }}>
                  {r.open ? <>Kòmande <ChevronRight size={12} /></> : "Fèmen"}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
