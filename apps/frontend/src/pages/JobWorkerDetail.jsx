import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Simulation yon baz de done travayè pou gwo echèl
const MOCK_WORKERS_DATABASE = {
  "1": {
    id: "1",
    name: "Ronald Monfils",
    role: "Boss",
    location: "Bavaro, Punta Cana",
    distance: "2.5 km de ou",
    status: "available",
    statusLabel: "Disponib",
    statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dotColor: "bg-emerald-500",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    skills: ["Mason", "Beton", "Tiling", "Plomberie"],
    about: "Mwen se yon boss konstriksyon ak 10+ lane eksperyans nan fè bèl travay solid ak fini pafè.",
    rating: 4.8,
    reviewsCount: 24,
    phone: "+50912345678"
  },
  "2": {
    id: "2",
    name: "Jean Jacques",
    role: "Mason / Chapantye",
    location: "Veron, Punta Cana",
    distance: "3.8 km de ou",
    status: "working",
    statusLabel: "Okipe",
    statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-500",
    avatar: "", 
    skills: ["Chapant", "Daal", "Fiti"],
    about: "Espesyalize nan kofraj ak chapant depi plizyè lanne nan zòn Punta Cana.",
    rating: 4.5,
    reviewsCount: 12,
    phone: "+50987654321"
  }
};

const JobWorkerDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Rale travayè a dinamikman selon ID ki nan URL la
  const worker = MOCK_WORKERS_DATABASE[id] || MOCK_WORKERS_DATABASE["1"];

  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reyajiste eta erè imaj la si ID travayè a chanje
  useEffect(() => {
    setImageError(false);
  }, [id]);

  // Pwoteksyon pou evite plantaj si done yo ta manke nan API a
  const currentRating = worker.rating || 0;
  const currentReviews = worker.reviewsCount || 0;
  const initials = worker.name ? worker.name.substring(0, 2) : "TW";

  return (
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col font-sans select-none pb-32">
      
      {/* 🟢 TOP NAVIGATION BAR */}
      <div className="px-5 pt-6 pb-3 max-w-md w-full mx-auto flex items-center justify-between z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-[#162238] border border-slate-800/80 rounded-xl text-slate-400 active:scale-95 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Pwofil Travayè</h2>

        <button 
          onClick={() => setIsSaved(!isSaved)}
          className="p-2.5 bg-[#162238] border border-slate-800/80 rounded-xl text-slate-400 active:scale-95 transition-transform"
        >
          <svg 
            className={`w-4 h-4 transition-colors ${isSaved ? "text-amber-400 fill-amber-400" : "text-slate-400"}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* 👤 SEKSYON PWOFIL PRENSIPAL (HEADER CARD) */}
      <div className="px-5 mt-4 max-w-md w-full mx-auto flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-[#162238] border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            {worker.avatar && !imageError ? (
              <img 
                src={worker.avatar} 
                alt={worker.name} 
                className="w-full h-full object-cover"
                onError={() => setImageError(true)} 
              />
            ) : (
              <span className="text-xl font-black uppercase tracking-wider text-slate-400">{initials}</span>
            )}
          </div>
        </div>

        <h1 className="text-xl font-black tracking-wide text-white">{worker.name}</h1>
        <p className="text-xs font-extrabold text-amber-400 mt-0.5 uppercase tracking-wider">{worker.role}</p>
        <p className="text-xs font-bold text-slate-400 mt-1">{worker.location}</p>
        
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mt-1">
          <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {worker.distance}
        </div>

        {/* Status Badge Dinamik - Tout klas yo jere depi nan baz de done a kounye a */}
        <div className={`mt-3.5 flex items-center gap-2 px-4 py-1.5 border ${worker.statusColor || "bg-[#162238] border-slate-800 text-slate-300"} rounded-full`}>
          <span className={`w-2 h-2 rounded-full ${worker.dotColor || "bg-slate-400"}`}></span>
          <span className="text-[10px] font-black uppercase tracking-wider">{worker.statusLabel}</span>
        </div>
      </div>

      {/* 📊 DETAY AK ENFÒMASYON YON APRE LÒT */}
      <div className="px-5 mt-8 max-w-md w-full mx-auto flex flex-col gap-6 flex-1 overflow-y-auto">
        
        {/* 🛠️ KONPETANS (SKILLS) */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Konpetans</h4>
          <div className="flex flex-wrap gap-2">
            {worker.skills && worker.skills.map((skill, index) => (
              <span 
                key={index} 
                className="px-3.5 py-1.5 bg-[#162238] border border-slate-800 text-xs font-bold text-slate-300 rounded-xl"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 📝 À PROPOS (BIO) */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">À Propos</h4>
          <div className="p-4 bg-[#162238]/60 border border-slate-800/60 rounded-2xl">
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {worker.about}
            </p>
          </div>
        </div>

        {/* ⭐ EVALYASYON (REVIEWS) */}
        <div className="flex flex-col gap-2.5">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Evalyasyon</h4>
          <div className="p-4 bg-[#162238]/60 border border-slate-800/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-amber-400">{currentRating.toFixed(1)}</span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-3.5 h-3.5 ${i < Math.floor(currentRating) ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">({currentReviews} evalyasyon)</span>
          </div>
        </div>

      </div>

      {/* 📞 BOUTON AKSYON YO (Fixed Bottom Bar - Message & Rele) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1528]/90 backdrop-blur-lg border-t border-slate-900/80 px-5 pt-4 pb-8 flex items-center gap-3 z-40 max-w-md mx-auto">
        
        <button 
          onClick={() => navigate(`/chat/${worker.id}`)}
          className="flex-1 py-3.5 bg-[#162238] border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-white hover:bg-[#1f2f4d] active:scale-95 transition-all shadow-lg"
        >
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>

        <a 
          href={`tel:${worker.phone}`}
          className="flex-1 py-3.5 bg-amber-400 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-black hover:bg-amber-500 active:scale-95 transition-all shadow-xl shadow-amber-400/10"
        >
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Rele
        </a>

      </div>

    </div>
  );
};

export default JobWorkerDetail;
