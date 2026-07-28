import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, Send, ArrowDownLeft, RefreshCw, CreditCard, ChevronRight, Landmark } from "lucide-react";

const BG = "#050B18"; const GOLD = "#FACC15";
const SERVICES = [
  { id:"send",     label:"Voye Lajan",   emoji:"📤", color:"#34d399", desc:"MonCash, Natcom, Digicel" },
  { id:"receive",  label:"Resevwa",      emoji:"📥", color:"#60a5fa", desc:"Nenpòt bank" },
  { id:"exchange", label:"Chanj",        emoji:"💱", color: GOLD,      desc:"USD, EUR, HTG" },
  { id:"credit",   label:"Kredi",        emoji:"💳", color:"#a78bfa", desc:"Mikrokrati rapid" },
  { id:"save",     label:"Epay",         emoji:"🏦", color:"#f97316", desc:"Enterè jiska 8% / an" },
  { id:"invest",   label:"Envestisman",  emoji:"📈", color:"#ec4899", desc:"Bourse + Obligasyon" },
];

const RATES = [
  { from:"USD", to:"HTG", rate:131.5,  trend:"+0.3%", icon:"🇺🇸" },
  { from:"EUR", to:"HTG", rate:142.0,  trend:"+0.1%", icon:"🇪🇺" },
  { from:"CAD", to:"HTG", rate:97.2,   trend:"-0.2%", icon:"🇨🇦" },
];

const PARTNERS = [
  { name:"BNC",      emoji:"🏛️", tagline:"Banque Nationale de Crédit" },
  { name:"Sogebank", emoji:"🏦", tagline:"Société Générale Haïtienne de Banque" },
  { name:"MonCash",  emoji:"📱", tagline:"Digicel Mobile Money" },
  { name:"Lajankou", emoji:"💰", tagline:"Envoi d'argent rapide" },
];

export default function Banking() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("services");

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      <div className="px-4 pt-8 pb-4" style={{ background:"linear-gradient(135deg,#0a1628,#050B18)" }}>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color:"#64748b" }}>← Retounen</button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏦</span>
          <div>
            <h1 className="text-2xl font-black text-white">Bank & Finans</h1>
            <p className="text-xs" style={{ color:"#64748b" }}>Sèvis finansye pou tout moun</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-[14px]" style={{ background:"rgba(255,255,255,.05)" }}>
          {["services","rates","partners"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="flex-1 py-2 rounded-[12px] text-xs font-bold capitalize transition-all"
              style={{ background: activeTab===t ? GOLD : "transparent", color: activeTab===t ? BG : "#64748b" }}>
              {t === "services" ? "Sèvis" : t === "rates" ? "Chanj" : "Patnè"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {activeTab === "services" && (
          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map(s => (
              <button key={s.id} className="rounded-[18px] p-4 text-left transition-all active:scale-[.97]"
                style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
                <div className="w-10 h-10 rounded-[12px] flex items-center justify-center text-xl mb-3"
                  style={{ background:`${s.color}15`, border:`1px solid ${s.color}25` }}>
                  {s.emoji}
                </div>
                <p className="text-sm font-black text-white">{s.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color:"#64748b" }}>{s.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-[10px] font-bold" style={{ color: s.color }}>
                  Kòmanse <ChevronRight size={10} />
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === "rates" && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-center mb-4" style={{ color:"#64748b" }}>
              To chanj jounen an — BRH ofisyèl
            </p>
            {RATES.map(r => (
              <div key={r.from} className="rounded-[16px] p-4 flex items-center justify-between"
                style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <p className="text-sm font-black text-white">1 {r.from} = {r.rate.toFixed(2)} {r.to}</p>
                    <p className="text-xs" style={{ color:"#64748b" }}>{r.from} → {r.to}</p>
                  </div>
                </div>
                <span className="text-xs font-black" style={{ color: r.trend.startsWith("+") ? "#34d399" : "#f87171" }}>
                  {r.trend}
                </span>
              </div>
            ))}
            <div className="rounded-[14px] p-3 mt-2"
              style={{ background:"rgba(250,204,21,.05)", border:`1px solid ${GOLD}20` }}>
              <p className="text-[10px] text-center" style={{ color:"#64748b" }}>
                Dènye mizajou: {new Date().toLocaleTimeString("fr-HT")} — Sous: BRH
              </p>
            </div>
          </div>
        )}

        {activeTab === "partners" && (
          <div className="space-y-3">
            {PARTNERS.map(p => (
              <button key={p.name} className="w-full rounded-[16px] p-4 flex items-center gap-4 text-left transition-all active:scale-[.98]"
                style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
                <span className="text-3xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{p.name}</p>
                  <p className="text-xs" style={{ color:"#64748b" }}>{p.tagline}</p>
                </div>
                <ChevronRight size={16} style={{ color:"#475569" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
