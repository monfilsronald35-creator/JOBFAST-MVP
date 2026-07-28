import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Check, ChevronRight, Phone, FileText } from "lucide-react";

const BG = "#050B18"; const GOLD = "#FACC15";
const TYPES = ["Tout", "Sante", "Lavi", "Machin", "Biznis", "Tanpèt"];
const PLANS = [
  { id:1, type:"Sante",   name:"Plan Esansyel",  price:1500,  period:"mwa", coverage:100000,   emoji:"🏥", features:["Konsiltasyon jeneral","Ijans 24/7","Laboratwa"],            tag:"Pi Abodab" },
  { id:2, type:"Sante",   name:"Plan Fanmi",      price:4200,  period:"mwa", coverage:500000,   emoji:"👪", features:["Tout Plan Esansyel","Chiriji","Maternite"],                 tag:"Meille Pri" },
  { id:3, type:"Lavi",    name:"Asistans Lavi+",  price:800,   period:"mwa", coverage:1000000,  emoji:"💚", features:["Pwoteksyon fanmi","Rev edikasyon","Epay"],                  tag:"Popile" },
  { id:4, type:"Machin",  name:"Auto Complet",    price:2500,  period:"mwa", coverage:300000,   emoji:"🚗", features:["Kolizyon","Vol","Responsabilite"],                          tag:"Obligatwa" },
  { id:5, type:"Biznis",  name:"PME Shield",       price:8000,  period:"mwa", coverage:5000000,  emoji:"🏢", features:["Responsabilite sivil","Ekipman","Anplwaye"],                tag:"Antrepriz" },
];

export default function Insurance() {
  const navigate = useNavigate();
  const [type, setType] = useState("Tout");

  const filtered = type === "Tout" ? PLANS : PLANS.filter(p => p.type === type);

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4" style={{ background:"linear-gradient(135deg,#0a1628,#050B18)" }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color:"#64748b" }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🛡️</span>
          <div>
            <h1 className="text-2xl font-black text-white">Asirens</h1>
            <p className="text-xs" style={{ color:"#64748b" }}>Sante, lavi, machin, biznis</p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex gap-3 mb-4">
          {[["🏛️","Regilasyon BRH"],["🔒","Sekirite 100%"],["⚡","Peman rapid"]].map(([e, t]) => (
            <div key={t} className="flex-1 rounded-[12px] p-2.5 text-center"
              style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
              <span className="text-base">{e}</span>
              <p className="text-[9px] font-bold mt-1" style={{ color:"#64748b" }}>{t}</p>
            </div>
          ))}
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

      <div className="px-4 mt-4 flex flex-col gap-4">
        {filtered.map(p => (
          <div key={p.id} className="rounded-[20px] overflow-hidden"
            style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">{p.name}</h3>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ background:`${GOLD}15`, color: GOLD }}>{p.tag}</span>
                    </div>
                    <p className="text-[10px]" style={{ color:"#64748b" }}>Kouvèti: {p.coverage.toLocaleString()} HTG</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black" style={{ color: GOLD }}>{p.price.toLocaleString()}</span>
                  <span className="text-[10px]" style={{ color:"#475569" }}> HTG/{p.period}</span>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background:"rgba(52,211,153,.15)" }}>
                      <Check size={10} style={{ color:"#34d399" }} />
                    </div>
                    <span className="text-xs" style={{ color:"#94a3b8" }}>{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 rounded-[12px] py-2.5 text-xs font-black flex items-center justify-center gap-2"
                  style={{ background: GOLD, color: BG }}>
                  <Shield size={12}/> Aplike Kounye a
                </button>
                <button className="px-3 rounded-[12px] py-2.5 flex items-center justify-center"
                  style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.08)" }}>
                  <Phone size={14} style={{ color:"#64748b" }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
