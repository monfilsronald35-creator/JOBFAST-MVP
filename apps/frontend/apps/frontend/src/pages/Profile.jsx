import React, { useState, useCallback } from "react"; // Kòreksyon: "import" an miniskil
import { useNavigate } from "react-router-dom";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  Edit3, 
  Lock, 
  Bell,
  ArrowLeft,
  Star,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Settings,
  FileText
} from "lucide-react";

// Done statik pou itilizatè a (Evite re-render initil)
const USER_DATA = {
  name: "Jean-Robert Baptiste",
  role: "Premium Worker (Mason)",
  location: "Bavaro, Punta Cana",
  phone: "+1 (829) 555-0199",
  email: "jr.baptiste@jobfast.com",
  joinedDate: "Manm depi: Me 2026",
  isVerified: true,
  rating: 4.9,
  completedJobs: 128,
  activeJobs: 4,
};

// Estrikti Stats pou map()
const STATS = [
  {
    icon: Star,
    value: USER_DATA.rating,
    label: "Rating",
    color: "text-yellow-400",
  },
  {
    icon: CheckCircle2,
    value: USER_DATA.completedJobs,
    label: "Travay",
    color: "text-emerald-400",
  },
  {
    icon: Briefcase,
    value: USER_DATA.activeJobs,
    label: "Aktif",
    color: "text-blue-400",
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); 

  // Route fallback sekirize pou navigasyon
  const safeNavigate = useCallback((path) => {
    try {
      navigate(path);
    } catch (err) {
      console.error("Navigation failed", err);
    }
  }, [navigate]);

  // Lojik final pou dekonekte
  const confirmLogout = useCallback(() => {
    setShowLogoutModal(false);
    setLoggingOut(true);

    localStorage.clear();
    sessionStorage.clear();

    safeNavigate("/");
  }, [safeNavigate]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto select-none bg-[#070B14] px-6 py-10 font-sans text-white relative">
      
      {/* HEADER */}
      <header className="mx-auto mb-6 w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => safeNavigate(-1)} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition active:scale-95 cursor-pointer"
            aria-label="Tounen dèyè"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            Profil Mwen
          </h1>
        </div>
        <button 
          onClick={() => safeNavigate("/profile/edit")}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition active:scale-95 cursor-pointer"
          aria-label="Modifye profil"
        >
          <Edit3 className="w-4 h-4 text-yellow-400" />
        </button>
      </header>

      {/* USER CARD */}
      <div className="mx-auto w-full max-w-sm bg-[#0F172A] rounded-[28px] p-6 border border-white/5 shadow-xl mb-4 text-center relative overflow-hidden">
        
        {/* Badge Verifikasyon */}
        {USER_DATA.isVerified && (
          <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> VERIFYE
          </div>
        )}

        {/* AVATAR */}
        <div className="mx-auto w-20 h-20 bg-yellow-400/10 border-2 border-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-yellow-400/5">
          <User className="w-10 h-10 text-yellow-400" />
        </div>

        {/* DETAILS */}
        <h2 className="text-lg font-bold text-white tracking-wide">{USER_DATA.name}</h2>
        <p className="text-xs text-yellow-400/90 font-medium mt-0.5">{USER_DATA.role}</p>
        
        <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mt-2">
          <MapPin className="w-3.5 h-3.5 text-gray-500" />
          <span>{USER_DATA.location}</span>
        </div>

        <p className="text-[10px] text-gray-500 mt-4 italic">{USER_DATA.joinedDate}</p>

        {/* Profile Completion Progress Bar */}
        <div className="mt-5 border-t border-white/5 pt-4 text-left">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-medium">
            <span>Profil konplè</span>
            <span className="text-yellow-400 font-bold">85%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-[85%] bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* KAT ESTATISTIK */}
      <div className="mx-auto w-full max-w-sm grid grid-cols-3 gap-3 mb-6">
        {STATS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-[#0F172A] rounded-2xl p-3 text-center border border-white/5 shadow-md">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
              <p className="text-sm font-bold text-white">{item.value}</p>
              <p className="text-[10px] text-gray-500 font-medium">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS SECTION */}
      <div className="mx-auto w-full max-w-sm mb-5 animate-fade-in">
        <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-3">
          Aksyon Rapid
        </h3>

        <div className="space-y-3">
          <button
            onClick={() => safeNavigate("/my-jobs")}
            className="w-full bg-[#0F172A] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition cursor-pointer active:scale-[0.99] shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Travay Mwen</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Gade tout travay ou yo</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>

          <button
            onClick={() => safeNavigate("/profile/documents")}
            className="w-full bg-[#0F172A] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition cursor-pointer active:scale-[0.99] shadow-sm"
          >
            <div className="flex items-center gap-4">
              <FileText className="w-4 h-4 text-yellow-400" />
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Dokiman</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Verifye idantite w</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>

          <button
            onClick={() => safeNavigate("/profile/settings")}
            className="w-full bg-[#0F172A] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition cursor-pointer active:scale-[0.99] shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Settings className="w-4 h-4 text-purple-400" />
              <div className="text-left">
                <h3 className="text-xs font-bold text-white">Paramèt</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Kont ak preferans</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* SEGMENTED TABS */}
      <div className="mx-auto w-full max-w-sm flex bg-black/40 p-1 rounded-2xl mb-4 border border-white/5">
        <button
          onClick={() => setActiveTab("info")}
          aria-current={activeTab === "info" ? "page" : undefined}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "info"
              ? "bg-yellow-400 text-black shadow-md"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Enfo
        </button>
        <button
          onClick={() => setActiveTab("security")}
          aria-current={activeTab === "security" ? "page" : undefined}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "security"
              ? "bg-yellow-400 text-black shadow-md"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Sekirite
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto w-full max-w-sm flex-1 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {activeTab === "info" ? (
          /* INFO TAB */
          <div className="space-y-3 animate-fade-in">
            <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="p-2 bg-white/5 rounded-xl text-gray-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Telefòn</p>
                <p className="text-xs font-bold text-white mt-0.5">{USER_DATA.phone}</p>
              </div>
            </div>

            <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="p-2 bg-white/5 rounded-xl text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Imèl</p>
                <p className="text-xs font-bold text-white mt-0.5">{USER_DATA.email}</p>
              </div>
            </div>
          </div>
        ) : (
          /* SECURITY TAB */
          <div className="space-y-3 animate-fade-in">
            <button 
              onClick={() => safeNavigate("/profile/security")}
              className="w-full bg-[#0F172A] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition text-left cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-xl text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Chanje mo de pas</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Pwoteje kont ou pi byen</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>

            <button 
              onClick={() => safeNavigate("/profile/notifications")}
              className="w-full bg-[#0F172A] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex items-center justify-between transition text-left cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/5 rounded-xl text-gray-400 relative">
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Notifikasyon</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Mesaj ak alèt travay rapid</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* LOGOUT BUTTON */}
        <button
          onClick={() => setShowLogoutModal(true)} 
          disabled={loggingOut}
          className="w-full mt-8 py-3.5 rounded-2xl border border-rose-500/20 hover:bg-rose-500/5 text-rose-400 font-bold active:scale-[0.97] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4" />
          <span>{loggingOut ? "Dekonekte..." : "Dekonekte"}</span>
        </button>
      </main>

      {/* CUSTOM LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-[#0F172A] border border-white/10 rounded-[28px] p-6 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">Dekonekte Kont</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Èske ou vle dekonekte kont ou sou JobFast pou kounye a?
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition cursor-pointer active:scale-95"
              >
                Anile
              </button>
              <button
                onClick={confirmLogout}
                className="py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white transition cursor-pointer active:scale-95 shadow-lg shadow-rose-500/10"
              >
                Wi, Soti
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
