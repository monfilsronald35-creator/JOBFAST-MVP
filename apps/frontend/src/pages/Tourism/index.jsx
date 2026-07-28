import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, MapPin, Camera, ChevronRight, Sun } from "lucide-react";

const BG = "#050B18"; const GOLD = "#FACC15";
const TYPES = ["Tout", "Plaj", "Montay", "Patrimwàn", "Nati", "Kiltirèl"];
const MOCK = [
  { id:1, name:"Citadelle Laferrière", region:"Cap-Haïtien", type:"Patrimwàn", rating:4.9, distance:"5 km", price:500, emoji:"🏰", tag:"UNESCO", desc:"Fò istorik ki pi gran nan Karayib la" },
  { id:2, name:"Labadee Beach", region:"Cap-Haïtien", type:"Plaj", rating:4.8, distance:"12 km", price:0, emoji:"🌊", tag:"Top Plaj", desc:"Plaj ki pi bèl nan nò Ayiti" },
  { id:3, name:"Bassin-Bleu", region:"Jakmel", type:"Nati", rating:4.7, distance:"8 km", price:300, emoji:"💧", tag:"Nati Piti", desc:"Twa lak kaskad nan forè tropical" },
  { id:4, name:"Pic Macaya", region:"Gran Anse", type:"Montay", rating:4.6, distance:"2h trek", price:800, emoji:"⛰️", tag:"Avanti", desc:"Piton ki pi wo nan peyi a" },
  { id:5, name:"Jacmel Kanaval", region:"Jakmel", type:"Kiltirèl", rating:5.0, distance:"3 km", price:200, emoji:"🎭", tag:"Fèt", desc:"Kanaval reyèl ak mas papye-mache" },
  { id:6, name:"Île à Vache", region:"Les Cayes", type:"Plaj", rating:4.8, distance:"Bato 30min", price:1500, emoji:"🏝️", tag:"Paradis", desc:"Zile izole ak dlo kristal" },
];

export default function Tourism() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("Tout");

  const filtered = MOCK.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase())) &&
    (type === "Tout" || t.type === type)
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4" style={{ background:"linear-gradient(135deg,#0a1628,#050B18)" }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color:"#64748b" }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🌴</span>
          <div>
            <h1 className="text-2xl font-black text-white">Touris</h1>
            <p className="text-xs" style={{ color:"#64748b" }}>Dekouvri bèlte Ayiti</p>
          </div>
        </div>
        <div className="relative mb-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color:"#475569" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Destriktasyon, aktivite…"
            className="w-full rounded-[14px] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
            style={{ background:"rgba(255,255,255,.06)", border:"1.5px solid rgba(255,255,255,.1)" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: type===t ? GOLD : "rgba(255,255,255,.06)", color: type===t ? BG : "#94a3b8", border: type===t ? "none" : "1px solid rgba(255,255,255,.08)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 grid grid-cols-1 gap-4">
        {filtered.map(item => (
          <button key={item.id} className="text-left rounded-[20px] overflow-hidden transition-all active:scale-[.98]"
            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
            <div className="relative flex items-center justify-center" style={{ height:140, background:"linear-gradient(135deg,rgba(250,204,21,.05),rgba(16,185,129,.05))" }}>
              <span style={{ fontSize:60 }}>{item.emoji}</span>
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black"
                style={{ background:`${GOLD}20`, color: GOLD, border:`1px solid ${GOLD}30` }}>{item.tag}</span>
              <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background:"rgba(255,255,255,.1)", color:"#94a3b8" }}>{item.type}</span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-black text-white">{item.name}</h3>
              <p className="text-xs mt-0.5" style={{ color:"#64748b" }}>{item.desc}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star size={11} fill={GOLD} style={{ color: GOLD }} />
                    <span className="text-xs font-bold text-white">{item.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color:"#64748b" }}>
                    <MapPin size={11} /> {item.region} · {item.distance}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black" style={{ color: GOLD }}>
                    {item.price === 0 ? "Gratis" : `${item.price} HTG`}
                  </p>
                </div>
              </div>
              <button className="w-full mt-3 rounded-[12px] py-2.5 text-xs font-black flex items-center justify-center gap-2"
                style={{ background: GOLD, color: BG }}>
                <Camera size={12} /> Ekspore <ChevronRight size={12} />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
