import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, MapPin, Wifi, Coffee, Car, ChevronRight, Filter, Map } from "lucide-react";

const BG = "#050B18"; const GOLD = "#FACC15";
const AMENITY_ICONS = { wifi: <Wifi size={12}/>, breakfast: <Coffee size={12}/>, parking: <Car size={12}/> };

const CATEGORIES = ["Tout", "Luksi", "Biznis", "Bèl Pri", "Boutik", "Resort"];
const MOCK = [
  { id:1, name:"Karibe Hotel & Convention Center", city:"Pòtoprens", stars:5, rating:4.8, reviews:312, price:8500, currency:"HTG", amenities:["wifi","breakfast","parking"], image:"🏨", tag:"Top Pik" },
  { id:2, name:"Royal Oasis Hotel", city:"Pòtoprens", stars:4, rating:4.5, reviews:188, price:5200, currency:"HTG", amenities:["wifi","parking"], image:"🏩", tag:"Favorit" },
  { id:3, name:"Wahoo Bay Beach Resort", city:"Kyona", stars:4, rating:4.7, reviews:256, price:7800, currency:"HTG", amenities:["wifi","breakfast"], image:"🌴", tag:"Plaj" },
  { id:4, name:"Hotel Montana", city:"Pòtoprens", stars:5, rating:4.9, reviews:445, price:12000, currency:"HTG", amenities:["wifi","breakfast","parking"], image:"⭐", tag:"Prezij" },
  { id:5, name:"El Rancho Hotel", city:"Petionville", stars:4, rating:4.4, reviews:167, price:4800, currency:"HTG", amenities:["wifi"], image:"🏡", tag:"Nati" },
  { id:6, name:"Best Western Plus", city:"Cap-Haïtien", stars:3, rating:4.2, reviews:89, price:3200, currency:"HTG", amenities:["wifi","parking"], image:"🏢", tag:"Bèl Pri" },
];

export default function Hotels() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Tout");
  const [items, setItems] = useState(MOCK);

  useEffect(() => {
    let filtered = MOCK;
    if (search) filtered = filtered.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase()));
    setItems(filtered);
  }, [search, cat]);

  return (
    <div className="min-h-screen pb-24" style={{ background: BG }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-8 pb-6"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#050B18 100%)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position:"absolute", top:"-30%", right:"-10%", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle,rgba(250,204,21,.07),transparent 70%)" }} />
        </div>
        <button onClick={() => navigate(-1)} className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color:"#64748b" }}>
          ← Retounen
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🏨</span>
          <div>
            <h1 className="text-2xl font-black text-white">Otèl</h1>
            <p className="text-xs" style={{ color:"#64748b" }}>Jwenn pi bon kote pou rete</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color:"#475569" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Vil, non otèl…"
            className="w-full rounded-[14px] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none"
            style={{ background:"rgba(255,255,255,.06)", border:"1.5px solid rgba(255,255,255,.1)" }} />
        </div>
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: cat===c ? GOLD : "rgba(255,255,255,.06)", color: cat===c ? BG : "#94a3b8", border: cat===c ? "none" : "1px solid rgba(255,255,255,.08)" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold" style={{ color:"#64748b" }}>{items.length} otèl jwenn</p>
          <button className="flex items-center gap-1 text-xs font-bold" style={{ color:"#64748b" }}>
            <Filter size={12} /> Filtre
          </button>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          {items.map(h => (
            <button key={h.id} className="text-left rounded-[20px] overflow-hidden transition-all active:scale-[.98]"
              style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
              {/* Image area */}
              <div className="relative flex items-center justify-center" style={{ height:140, background:"rgba(255,255,255,.03)" }}>
                <span style={{ fontSize:56 }}>{h.image}</span>
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-black"
                  style={{ background:`${GOLD}20`, color: GOLD, border:`1px solid ${GOLD}30` }}>{h.tag}</span>
                <div className="absolute top-3 right-3 flex gap-0.5">
                  {Array.from({ length: h.stars }).map((_, i) => <Star key={i} size={10} fill={GOLD} style={{ color: GOLD }} />)}
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-white leading-tight">{h.name}</h3>
                    <p className="flex items-center gap-1 mt-1 text-xs" style={{ color:"#64748b" }}>
                      <MapPin size={11} /> {h.city}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-xs font-black" style={{ color: GOLD }}>
                      {h.price.toLocaleString()} {h.currency}
                    </p>
                    <p className="text-[10px]" style={{ color:"#475569" }}>/ nwit</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star size={11} fill={GOLD} style={{ color: GOLD }} />
                      <span className="text-xs font-bold text-white">{h.rating}</span>
                      <span className="text-[10px]" style={{ color:"#475569" }}>({h.reviews})</span>
                    </div>
                    <div className="flex gap-2">
                      {h.amenities.map(a => (
                        <span key={a} className="p-1 rounded-md" style={{ background:"rgba(255,255,255,.06)", color:"#94a3b8" }}>
                          {AMENITY_ICONS[a]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black rounded-full px-3 py-1.5"
                    style={{ background: GOLD, color: BG }}>
                    Rezève <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
