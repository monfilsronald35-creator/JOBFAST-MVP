import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Phone, MapPin, Clock, AlertCircle, ChevronRight, Heart } from "lucide-react";

const BG = "#050B18"; const GOLD = "#FACC15";
const SPECIALTIES = ["Tout", "Ijans", "Chiriji", "Pediatri", "Maternite", "Kardiyo", "Dantis"];
const MOCK = [
  { id:1, name:"Hôpital Universitaire d'État d'Haïti", city:"Pòtoprens", type:"Piblik", emergency:true, phone:"+509 2222-0000", rating:3.8, specialties:["Ijans","Chiriji","Pediatri"], emoji:"🏥", tag:"Ijans 24/7" },
  { id:2, name:"Complexe Médical CMNS", city:"Petionville", type:"Prive", emergency:true, phone:"+509 2812-5000", rating:4.6, specialties:["Chiriji","Kardiyo","Maternite"], emoji:"🏨", tag:"Pi Modèn" },
  { id:3, name:"Hôpital de Sacré-Cœur", city:"Milot", type:"ONG", emergency:true, phone:"+509 3758-1234", rating:4.8, specialties:["Ijans","Pediatri","Chiriji"], emoji:"❤️", tag:"Meillè Swen" },
  { id:4, name:"Bernard Mevs Hospital", city:"Pòtoprens", type:"ONG", emergency:true, phone:"+509 3773-9466", rating:4.7, specialties:["Ijans","Kiriji"], emoji:"🩺", tag:"Trauma" },
  { id:5, name:"Canapé-Vert Hospital", city:"Pòtoprens", type:"Prive", emergency:false, phone:"+509 2245-1234", rating:4.3, specialties:["Dantis","Maternite"], emoji:"🌿", tag:"Fanmi" },
];

export default function Hospitals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState("Tout");

  const filtered = MOCK.filter(h =>
    (!search || h.name.toLowerCase().includes(search.toLowerCase())) &&
    (spec === "Tout" || h.specialties.includes(spec))
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4" style={{ background:"linear-gradient(135deg,#0a1628,#050B18)" }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color:"#64748b" }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏥</span>
          <div>
            <h1 className="text-2xl font-black text-white">Sante</h1>
            <p className="text-xs" style={{ color:"#64748b" }}>Lopital, doktè, klinik</p>
          </div>
        </div>
        {/* Emergency banner */}
        <div className="rounded-[14px] p-3 mb-4 flex items-center gap-3"
          style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)" }}>
          <AlertCircle size={16} style={{ color:"#f87171" }} />
          <div>
            <p className="text-xs font-black" style={{ color:"#f87171" }}>Ijans Medikal?</p>
            <p className="text-[10px]" style={{ color:"#94a3b8" }}>Rele 4040 pou SAMU oswa anbilans</p>
          </div>
          <a href="tel:4040" className="ml-auto px-3 py-1.5 rounded-full text-xs font-black" style={{ background:"#f87171", color:"white" }}>
            4040
          </a>
        </div>
        <div className="relative mb-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color:"#475569" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Non lopital, doktè…"
            className="w-full rounded-[14px] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
            style={{ background:"rgba(255,255,255,.06)", border:"1.5px solid rgba(255,255,255,.1)" }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SPECIALTIES.map(s => (
            <button key={s} onClick={() => setSpec(s)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: spec===s ? "#f87171" : "rgba(255,255,255,.06)", color: spec===s ? "white" : "#94a3b8", border: spec===s ? "none" : "1px solid rgba(255,255,255,.08)" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4">
        {filtered.map(h => (
          <div key={h.id} className="rounded-[20px] overflow-hidden"
            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.15)" }}>
                  {h.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black text-white leading-tight">{h.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: h.type==="Piblik" ? "rgba(59,130,246,.15)" : h.type==="ONG" ? "rgba(52,211,153,.15)" : "rgba(250,204,21,.15)",
                        color: h.type==="Piblik" ? "#60a5fa" : h.type==="ONG" ? "#34d399" : GOLD }}>
                      {h.type}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 mt-1 text-[10px]" style={{ color:"#64748b" }}>
                    <MapPin size={10} /> {h.city}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {h.specialties.slice(0,3).map(s => (
                      <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:"rgba(255,255,255,.06)", color:"#94a3b8" }}>{s}</span>
                    ))}
                    {h.emergency && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:"rgba(239,68,68,.15)", color:"#f87171" }}>Ijans 24/7</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop:"1px solid rgba(255,255,255,.06)" }}>
                <a href={`tel:${h.phone}`} className="flex items-center gap-2 text-xs font-bold rounded-[10px] px-3 py-2 transition-all"
                  style={{ background:"rgba(52,211,153,.1)", color:"#34d399", border:"1px solid rgba(52,211,153,.2)" }}>
                  <Phone size={12} /> {h.phone}
                </a>
                <button className="flex items-center gap-1 text-xs font-black rounded-[10px] px-3 py-2"
                  style={{ background: GOLD, color: BG }}>
                  Randevou <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
