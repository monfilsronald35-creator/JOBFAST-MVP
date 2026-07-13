import React, {
  useEffect, useState, useCallback, useRef, memo, useMemo,
} from "react";
import { Star, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { isEmployerRole, getRoleConfig } from "../config/roleConfig";
import CompanyContent, {
  COMPANY_TABS, CompanyOverviewSupplement,
} from "./company/CompanyDashboard";
import EnterpriseContent, {
  ENTERPRISE_TABS, EnterpriseOverviewSupplement,
} from "./enterprise/EnterpriseDashboard";

// ── Design tokens ──────────────────────────────────────────────────
const BG     = "#050B18";
const CARD   = "#0d1526";
const BORDER = "#1F2937";
const GOLD   = "#FACC15";

// ── Role accent colors (matches roleConfig color names → hex) ──
const ROLE_ACCENT = {
  restaurant:      "#F97316",
  hotel:           "#06B6D4",
  hospital:        "#EF4444",
  clinic:          "#14B8A6",
  tourism:         "#A855F7",
  rental:          "#10B981",
  office:          "#64748B",
  service_provider:"#FACC15",
  admin:           "#F43F5E",
  super_admin:     "#F43F5E",
};

// ── Section id → nav path map for GenericRoleDashboard ─────────
const SECTION_PATHS = {
  todays_orders:         "/orders",
  reservations:          "/reservations",
  menu_overview:         "/menu",
  top_customers:         "/customers",
  room_status:           "/rooms",
  todays_checkins:       "/reservations",
  housekeeping:          "/housekeeping",
  guest_requests:        "/guests",
  emergency_status:      "/emergency",
  todays_appointments:   "/appointments",
  doctors_on_duty:       "/doctors",
  patient_stats:         "/patients",
  patient_list:          "/patients",
  doctors:               "/doctors",
  clinic_reviews:        "/reviews",
  active_tours:          "/tours",
  bookings:              "/bookings",
  tourists:              "/tourists",
  reviews:               "/reviews",
  my_services:           "/provider-dashboard",
  upcoming_jobs:         "/search",
  clients:               "/search",
  my_rating:             "/settings",
  staff_overview:        "/staff",
  schedule:              "/schedule",
  services:              "/services",
  office_stats:          "/reports",
  properties:            "/properties",
  active_leases:         "/properties",
  maintenance:           "/properties",
  open_jobs:             "/jobs",
  employee_overview:     "/employees",
  applications:          "/recruitment",
  team_activity:         "/reports",
  branches:              "/branches",
  contracts:             "/contracts",
  enterprise_stats:      "/reports",
  platform_stats:        "/admin",
  recent_users:          "/admin/users",
  open_reports:          "/admin/support",
  system_health:         "/admin",
};

// ── Exact quick-action grids per business role ─────────────────────
// e = emoji, l = label, p = path
const ROLE_QUICK_ACTIONS = {
  hotel: [
    { e:"💰", l:"Bous",         p:"/wallet"       },
    { e:"🛏️", l:"Rezèvasyon",  p:"/reservations" },
    { e:"🏨", l:"Chanm",        p:"/rooms"        },
    { e:"👷", l:"Anplwaye",     p:"/employees"    },
    { e:"🛒", l:"Makèt",        p:"/market"       },
    { e:"📢", l:"Pwomosyon",    p:"/promotions"   },
    { e:"⭐", l:"Evalyasyon",   p:"/reviews"      },
  ],
  hospital: [
    { e:"📅", l:"Randevou",     p:"/appointments" },
    { e:"👨‍⚕️",l:"Doktè",      p:"/doctors"      },
    { e:"👥", l:"Pasyan",       p:"/patients"     },
    { e:"💰", l:"Pèman",        p:"/wallet"       },
    { e:"🔬", l:"Laboratwa",    p:"/lab"          },
    { e:"🚨", l:"Dijans",       p:"/emergency"    },
    { e:"🏥", l:"Asirans",      p:"/insurance"    },
  ],
  restaurant: [
    { e:"🛒", l:"Kòmand",       p:"/orders"       },
    { e:"📅", l:"Rezèvasyon",   p:"/reservations" },
    { e:"🍳", l:"Kwizin",       p:"/kitchen"      },
    { e:"🚀", l:"Livrezon",     p:"/delivery"     },
    { e:"👷", l:"Pèsonèl",      p:"/staff"        },
    { e:"📦", l:"Envantè",      p:"/inventory"    },
    { e:"💰", l:"Pèman",        p:"/wallet"       },
  ],
  clinic: [
    { e:"📅", l:"Randevou",     p:"/appointments" },
    { e:"👨‍⚕️",l:"Doktè",      p:"/doctors"      },
    { e:"👥", l:"Pasyan",       p:"/patients"     },
    { e:"💰", l:"Pèman",        p:"/wallet"       },
    { e:"⭐", l:"Evalyasyon",   p:"/reviews"      },
  ],
  marketplace: [
    { e:"📦", l:"Pwodwi",       p:"/products"     },
    { e:"🛒", l:"Kòmand",       p:"/orders"       },
    { e:"👥", l:"Kliyan",       p:"/customers"    },
    { e:"💰", l:"Bous",         p:"/wallet"       },
    { e:"🚚", l:"Ekspedisyon",  p:"/shipping"     },
    { e:"📢", l:"Pwomosyon",    p:"/promotions"   },
  ],
  tourism: [
    { e:"🗺️", l:"Tou",         p:"/tours"        },
    { e:"📅", l:"Rezèvasyon",   p:"/bookings"     },
    { e:"✈️", l:"Touris",       p:"/tourists"     },
    { e:"💰", l:"Pèman",        p:"/wallet"       },
    { e:"⭐", l:"Evalyasyon",   p:"/reviews"      },
    { e:"📢", l:"Pwomosyon",    p:"/promotions"   },
  ],
  rental: [
    { e:"🏠", l:"Pwopiete",     p:"/properties"   },
    { e:"📄", l:"Kontra",       p:"/contracts"    },
    { e:"👥", l:"Lokatè",       p:"/tenants"      },
    { e:"💰", l:"Pèman",        p:"/wallet"       },
    { e:"🔧", l:"Antretyen",    p:"/maintenance"  },
  ],
  office: [
    { e:"👥", l:"Pèsonèl",      p:"/staff"        },
    { e:"📅", l:"Orè",          p:"/schedule"     },
    { e:"🔧", l:"Sèvis",        p:"/services"     },
    { e:"💰", l:"Pèman",        p:"/wallet"       },
    { e:"📊", l:"Rapò",         p:"/reports"      },
  ],
  service_provider: [
    { e:"🔧", l:"Sèvis Mwen",   p:"/provider-dashboard" },
    { e:"📅", l:"Travay Pwochèn",p:"/bookings"    },
    { e:"👥", l:"Kliyan",       p:"/search"       },
    { e:"💰", l:"Bous",         p:"/wallet"       },
    { e:"⭐", l:"Rating Mwen",  p:"/settings"     },
  ],
  admin: [
    { e:"📊", l:"Estatistik",   p:"/admin"            },
    { e:"👥", l:"Itilizatè",    p:"/admin/users"      },
    { e:"💼", l:"Travay",       p:"/admin/jobs"       },
    { e:"💬", l:"Sipò",         p:"/admin/support"    },
    { e:"⚙️", l:"Paramèt",     p:"/admin/settings"   },
  ],
  super_admin: [
    { e:"📊", l:"Estatistik",   p:"/admin"            },
    { e:"👥", l:"Itilizatè",    p:"/admin/users"      },
    { e:"💼", l:"Travay",       p:"/admin/jobs"       },
    { e:"💬", l:"Sipò",         p:"/admin/support"    },
    { e:"⚙️", l:"Paramèt",     p:"/admin/settings"   },
  ],
};

// ── Job cache ──────────────────────────────────────────────────────
let jobsCache = null;
let cacheTime  = 0;
const CACHE_TTL = 15000;

const SERVICES = [
  { icon: "⚡", label: "Elektrisyen",   path: "/search?q=electrician"  },
  { icon: "🔧", label: "Mekanik",       path: "/search?q=mechanic"     },
  { icon: "🩺", label: "Doktè",         path: "/search?q=doctor"       },
  { icon: "⚖️", label: "Avoka",         path: "/search?q=lawyer"       },
  { icon: "🧹", label: "Netwayaj",      path: "/search?q=cleaning"     },
  { icon: "🔨", label: "Plombye",       path: "/search?q=plumber"      },
  { icon: "🏗",  label: "Konstriksyon", path: "/search?q=construction" },
  { icon: "🚗", label: "Chofè",         path: "/search?q=driver"       },
];

// ════════════════════════════════════════════════════════════════
// STORIES MODAL
// ════════════════════════════════════════════════════════════════
function StoriesModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl pb-safe"
        style={{ background: "#070e1c", border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: BORDER }}>
          <p className="font-black text-white">📖 Stories</p>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: CARD }}>
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-3xl mb-3">📸</p>
          <p className="text-sm font-bold text-slate-400">Pa gen stories pou kounye a</p>
          <p className="text-xs text-slate-600 mt-1">Stories yo pral parèt isit la</p>
        </div>
      </div>
    </div>
  );
}

// ── Vertical job list item ─────────────────────────────────────────
const JobListCard = memo(function JobListCard({ job, navigate, city: userCity }) {
  const photo   = job.companyLogo || job.profileMetadata?.profilePhoto
    || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(job.company || "J")}&backgroundColor=111827`;
  const title   = job.title || job.profession || "Position";
  const company = job.company || job.name || "";
  const salary  = job.salary || job.budget || job.rate;
  const city    = job.location?.city || job.city || userCity || "";
  const userId  = job.userId || job._id || job.id;

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border"
      style={{ background: CARD, borderColor: BORDER }}>
      <img src={photo} alt={company}
        className="w-11 h-11 rounded-xl object-cover shrink-0 border"
        style={{ borderColor: BORDER }}
        onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/initials/svg?seed=J"; }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-white truncate leading-tight">{title}</p>
        <p className="text-[10px] text-slate-500 truncate mt-0.5">{company}{city ? ` · 📍 ${city}` : ""}</p>
        {salary && <p className="text-[11px] font-black text-amber-400 mt-0.5">{salary}</p>}
      </div>
      <button type="button"
        onClick={() => navigate(`/u/${userId}`, { state: { profile: job } })}
        className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-black text-slate-950 active:scale-95 transition"
        style={{ background: GOLD }}>
        Apply
      </button>
    </div>
  );
});

// ── Vertical worker list item ──────────────────────────────────────
const WorkerListCard = memo(function WorkerListCard({ worker, navigate }) {
  const photo      = worker.profileMetadata?.profilePhoto || worker.photo
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(worker.name || "w")}`;
  const profession = worker.profession || worker.role || "";
  const rating     = worker.rating || worker.stats?.rating;
  const city       = worker.location?.city || worker.city || "";
  const userId     = worker._id || worker.id;

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border"
      style={{ background: CARD, borderColor: BORDER }}>
      <div className="relative shrink-0">
        <img src={photo} alt={worker.name}
          className="w-11 h-11 rounded-xl object-cover border-2"
          style={{ borderColor: `${GOLD}50` }}
          onError={e => { e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=w"; }} />
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 bg-green-500"
          style={{ borderColor: CARD }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-white truncate">{worker.name}</p>
        <p className="text-[10px] text-slate-500 truncate mt-0.5">{profession}{city ? ` · 📍 ${city}` : ""}</p>
        {rating && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span className="text-[9px] text-amber-400 font-bold">{Number(rating).toFixed(1)}</span>
          </div>
        )}
      </div>
      <button type="button"
        onClick={() => navigate(`/u/${userId}`, { state: { profile: worker } })}
        className="shrink-0 px-3 py-2 rounded-xl text-[11px] font-black text-slate-950 active:scale-95 transition"
        style={{ background: GOLD }}>
        Hire
      </button>
    </div>
  );
});

// ════════════════════════════════════════════════════════════════
// WORKER DASHBOARD
// ════════════════════════════════════════════════════════════════
function JobFastHome({ user, geo, jobs, loading, members, navigate, isEmployer }) {
  const city      = geo.city || "Haiti";
  const firstName = user?.name?.split(" ")[0] || user?.firstName || "";
  const hour      = new Date().getHours();
  const greeting  = hour >= 5 && hour < 12 ? "Bonjou" : "Bonswa";

  const [storiesOpen, setStoriesOpen] = useState(false);
  const [available,   setAvailable]   = useState(true);

  const workerMembers = useMemo(() =>
    members
      .filter(m => !["company","business","enterprise","employer","hotel",
        "restaurant","hospital","clinic","tourism","marketplace"].includes(m.role))
      .slice(0, 3),
  [members]);

  const topJobs = jobs.slice(0, 3);

  const WORKER_NAV = [
    { e:"🔍", l:"Jwenn Travay",   p:"/search"   },
    { e:"💼", l:"Aplikasyon",     p:"/my-jobs"  },
    { e:"📅", l:"Orè Jodi a",    p:"/booking"  },
    { e:"💰", l:"Bous",          p:"/wallet"   },
    { e:"💬", l:"Mesaj",         p:"/chat"     },
  ];

  const EMPLOYER_NAV = [
    { e:"➕", l:"Poste Travay",  p:"/post-job"    },
    { e:"👷", l:"Rekrite",       p:"/search"      },
    { e:"📋", l:"Aplikasyon",    p:"/recruitment" },
    { e:"💰", l:"Salè",          p:"/wallet"      },
    { e:"📊", l:"Rapò",          p:"/reports"     },
  ];

  const quickNav = isEmployer ? EMPLOYER_NAV : WORKER_NAV;

  return (
    <div className="pb-28" style={{ background: BG }}>
      {storiesOpen && <StoriesModal onClose={() => setStoriesOpen(false)} />}

      {/* ── GREETING + AVAILABILITY ──────────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-slate-400 font-medium leading-none">
              {greeting}{firstName ? `, ${firstName}` : ""} 👋
            </p>
            <p className="text-[20px] font-black text-white mt-1 leading-tight">
              {isEmployer ? "Jere ekip ou jodi a" : "Kisa w ap chèche jodi a?"}
            </p>
          </div>
          {!isEmployer && (
            <button type="button" onClick={() => setAvailable(a => !a)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border mt-1 transition-all active:scale-95"
              style={{
                background:   available ? '#052e16' : `${CARD}`,
                borderColor:  available ? '#16a34a' : BORDER,
              }}>
              <span className={`w-2 h-2 rounded-full ${available ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-black ${available ? 'text-green-400' : 'text-slate-500'}`}>
                {available ? 'Disponib' : 'Okipe'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── 5-ITEM QUICK NAV (horizontal scroll) ─────────────────── */}
      <div className="px-4 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {quickNav.map(({ e, l, p }) => (
            <button key={l} type="button" onClick={() => navigate(p)}
              className="shrink-0 flex flex-col items-center gap-1 pt-3 pb-2.5 rounded-2xl border text-[9px] font-black text-white active:scale-95 transition"
              style={{ background: CARD, borderColor: BORDER, minWidth: 62 }}>
              <span className="text-[19px] leading-none">{e}</span>
              <span className="px-1 text-center leading-tight">{l}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SEARCH BAR ────────────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <button type="button" onClick={() => navigate("/search")}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98]"
          style={{ background: CARD, borderColor: "#2a3548" }}>
          <span className="text-slate-500 text-base">🔍</span>
          <span className="text-sm text-slate-500 flex-1 text-left">
            {isEmployer ? "Chèche travayè, pwofesyon..." : "Djòb, sèvis, opòtinite..."}
          </span>
          <span className="text-[10px] font-black text-amber-400 px-2.5 py-1 rounded-lg"
            style={{ background: `${GOLD}18` }}>
            Chèche
          </span>
        </button>
      </div>

      {/* ── STORIES ───────────────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <button type="button" onClick={() => setStoriesOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all active:scale-95"
          style={{ background: CARD, borderColor: "#2a3548" }}>
          <span className="text-sm">📖</span>
          <span className="text-[12px] font-black text-slate-300">Stories</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
        </button>
      </div>

      {/* ── RECOMMENDED JOBS (workers only) ───────────────────────── */}
      {!isEmployer && (loading || topJobs.length > 0) && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">⭐ Travay Rekòmande</p>
            <button type="button" onClick={() => navigate("/search")}
              className="text-[11px] font-bold text-amber-400 active:opacity-70 flex items-center gap-0.5">
              Wè Tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: CARD }} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {topJobs.map((job, i) => (
                <JobListCard key={job._id || job.id || i} job={job} navigate={navigate} city={city} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NEARBY JOBS CTA (workers only) ────────────────────────── */}
      {!isEmployer && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">📍 Travay Pre Ou</p>
            <button type="button" onClick={() => navigate("/search")}
              className="text-[11px] font-bold text-amber-400 active:opacity-70 flex items-center gap-0.5">
              Chèche <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <button type="button" onClick={() => navigate("/search")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border active:scale-[0.98] transition"
            style={{ background: CARD, borderColor: BORDER }}>
            <span className="text-2xl">📍</span>
            <div className="flex-1 text-left">
              <p className="text-[12px] font-black text-white">Chèche travay nan {city}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Travay disponib bò kote ou</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* ── RECENT PAYMENTS (workers only) ────────────────────────── */}
      {!isEmployer && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">💰 Pèman Resan</p>
            <button type="button" onClick={() => navigate("/wallet")}
              className="text-[11px] font-bold text-amber-400 active:opacity-70 flex items-center gap-0.5">
              Bous <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4 rounded-2xl border flex items-center justify-between"
            style={{ background: CARD, borderColor: BORDER }}>
            <div>
              <p className="text-[13px] font-black text-white">Wè tout pèman ou yo</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Revni, salè, transfè</p>
            </div>
            <button type="button" onClick={() => navigate("/wallet")}
              className="text-[11px] font-black px-3 py-1.5 rounded-xl active:scale-95 transition"
              style={{ background: `${GOLD}22`, color: GOLD }}>
              Ouvri →
            </button>
          </div>
        </div>
      )}

      {/* ── UPCOMING WORK (workers only) ──────────────────────────── */}
      {!isEmployer && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">📅 Travay Pwochèn</p>
            <button type="button" onClick={() => navigate("/booking")}
              className="text-[11px] font-bold text-amber-400 active:opacity-70 flex items-center gap-0.5">
              Orè <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="py-8 rounded-2xl border text-center"
            style={{ background: CARD, borderColor: BORDER }}>
            <p className="text-2xl mb-2">📅</p>
            <p className="text-[12px] font-black text-slate-400">Pa gen travay pwograme</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Aksepte yon ofèt pou wè li isit la</p>
          </div>
        </div>
      )}

      {/* ── RECOMMENDED WORKERS (employers only) ─────────────────── */}
      {isEmployer && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">⭐ Travayè Rekòmande</p>
            <button type="button" onClick={() => navigate("/search")}
              className="text-[11px] font-bold text-amber-400 active:opacity-70 flex items-center gap-0.5">
              Wè Tout <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {workerMembers.length > 0 ? (
            <div className="space-y-2">
              {workerMembers.map((w, i) => (
                <WorkerListCard key={w._id || w.id || i} worker={w} navigate={navigate} />
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => navigate("/search")}
              className="w-full py-6 rounded-2xl border text-center active:scale-[0.98] transition"
              style={{ background: CARD, borderColor: BORDER }}>
              <p className="text-2xl mb-1">👷</p>
              <p className="text-[12px] font-black text-slate-400">Chèche travayè disponib</p>
            </button>
          )}
        </div>
      )}

      {/* ── SERVICES GRID (workers only) ──────────────────────────── */}
      {!isEmployer && (
        <div className="px-4 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
            ⚡ Sèvis Pre Ou
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SERVICES.map(s => (
              <button key={s.label} type="button" onClick={() => navigate(s.path)}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all active:scale-95"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-[17px] leading-none">{s.icon}</span>
                <span className="text-[7.5px] font-black text-slate-400 text-center leading-tight px-0.5">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// GENERIC ROLE DASHBOARD — config-driven for all business roles
// ════════════════════════════════════════════════════════════════
function GenericRoleDashboard({ user, roleKey, navigate }) {
  const config     = getRoleConfig(roleKey);
  const { subtitle, widgets } = config.dashboard;
  const firstName  = user?.name?.split(" ")[0] || "";
  const accent     = ROLE_ACCENT[roleKey] || GOLD;
  const hour       = new Date().getHours();
  const salutation = hour >= 5 && hour < 12 ? "Bonjou" : "Bonswa";
  const quickActions = ROLE_QUICK_ACTIONS[roleKey] || [];

  return (
    <div className="pb-28" style={{ background: BG }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2"
          style={{ background: `${accent}22`, color: accent }}>
          {config.label}
        </span>
        <p className="text-[13px] text-slate-400 font-medium leading-none">
          {salutation}{firstName ? `, ${firstName}` : ""} 👋
        </p>
        <p className="text-[20px] font-black text-white mt-1 leading-tight">{subtitle}</p>
      </div>

      {/* ── KPI WIDGETS ────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-3 gap-2">
          {widgets.map(w => (
            <div key={w.id} className="flex flex-col items-center justify-center p-3 rounded-2xl border text-center"
              style={{ background: CARD, borderColor: BORDER }}>
              <p className="text-[24px] font-black leading-none" style={{ color: accent }}>—</p>
              <p className="text-[8px] font-bold text-slate-500 mt-1 leading-tight px-1">{w.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK NAV (horizontal scroll, role-specific) ────── */}
      {quickActions.length > 0 && (
        <div className="px-4 mb-5">
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {quickActions.map(({ e, l, p }) => (
              <button key={l} type="button" onClick={() => navigate(p)}
                className="shrink-0 flex flex-col items-center gap-1 pt-3 pb-2.5 rounded-2xl border text-[9px] font-black text-white active:scale-95 transition"
                style={{ background: CARD, borderColor: BORDER, minWidth: 62 }}>
                <span className="text-[19px] leading-none">{e}</span>
                <span className="px-1 text-center leading-tight">{l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── SEARCH ─────────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <button type="button" onClick={() => navigate("/search")}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98]"
          style={{ background: CARD, borderColor: "#2a3548" }}>
          <span className="text-slate-500 text-base">🔍</span>
          <span className="text-sm text-slate-500 flex-1 text-left">{config.searchBehavior.placeholder}</span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg"
            style={{ background: `${accent}20`, color: accent }}>
            Chèche
          </span>
        </button>
      </div>

      {/* ── 4-COLUMN ICON GRID (role-specific actions) ─────── */}
      {quickActions.length > 0 && (
        <div className="px-4 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2.5">⚡ Aksyon Rapid</p>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map(({ e, l, p }) => (
              <button key={l + "-grid"} type="button" onClick={() => navigate(p)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border active:scale-95 transition"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-[20px] leading-none">{e}</span>
                <span className="text-[8px] font-black text-slate-400 text-center leading-tight px-0.5">{l}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── RECRUIT WORKERS CTA ────────────────────────────── */}
      <div className="px-4 mb-6">
        <div className="p-4 rounded-2xl border" style={{ background: CARD, borderColor: BORDER }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">👷 Rekrite Travayè</p>
          <p className="text-[11px] text-slate-400 mb-3">Jwenn travayè eksperyanse pou biznis ou a.</p>
          <button type="button" onClick={() => navigate("/search")}
            className="w-full py-2.5 rounded-xl text-[12px] font-black text-slate-950 active:scale-95 transition"
            style={{ background: GOLD }}>
            Chèche Travayè →
          </button>
        </div>
      </div>

      {/* ── SHARED TOOLS ───────────────────────────────────── */}
      <div className="px-4 mb-6">
        <div className="flex gap-2">
          {[
            { e: "💬", l: "Mesaj",  p: "/chat"          },
            { e: "💰", l: "Bous",   p: "/wallet"        },
            { e: "🔔", l: "Notif",  p: "/notifications" },
          ].map(({ e, l, p }) => (
            <button key={p} type="button" onClick={() => navigate(p)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border text-[10px] font-black text-white active:scale-95 transition"
              style={{ background: CARD, borderColor: BORDER }}>
              <span className="text-lg">{e}</span>
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DASHBOARD ROOT — role router
// ════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const roleKey   = user?.role ?? "worker";
  const isEmployer_ = isEmployerRole(roleKey);

  const isCompanyRole    = roleKey === "company" || roleKey === "business";
  const isEnterpriseRole = roleKey === "enterprise";
  const [companyTab,    setCompanyTab]    = useState("overview");
  const [enterpriseTab, setEnterpriseTab] = useState("overview");

  const [geo, setGeo] = useState({
    lat:  user?.location?.coordinates?.latitude  || 18.5432,
    lng:  user?.location?.coordinates?.longitude || -72.3395,
    city: user?.location?.city || "Haiti",
  });

  const [jobs,    setJobs]    = useState(jobsCache || []);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  const mountedRef = useRef(true);
  const abortRef   = useRef(null);
  useEffect(() => () => { mountedRef.current = false; abortRef.current?.abort(); }, []);

  // Fetch jobs (workers only)
  useEffect(() => {
    if (isEmployer_) return;
    const now = Date.now();
    if (jobsCache && now - cacheTime < CACHE_TTL) { setJobs(jobsCache); return; }
    setLoading(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    API.get("/jobs", { signal: ctrl.signal })
      .then(res => {
        if (!mountedRef.current) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        jobsCache = data; cacheTime = Date.now();
        setJobs(data);
      })
      .catch(() => {})
      .finally(() => { if (mountedRef.current) setLoading(false); });
  }, [isEmployer_]);

  // Fetch community members
  useEffect(() => {
    let alive = true;
    API.get("/community/members?limit=50", { timeout: 15000 })
      .then(res => {
        if (!alive) return;
        setMembers(Array.isArray(res?.data?.data) ? res.data.data : []);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      let city = geo.city;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { "Accept-Language": "fr,ht,es" } }
        );
        const d = await r.json();
        city = d.address?.city || d.address?.town || d.address?.village || city;
      } catch {}
      if (mountedRef.current) setGeo({ lat, lng, city });
    }, () => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Company dashboard ──────────────────────────────────────────
  if (isCompanyRole) {
    return (
      <div className="space-y-4 pb-8" style={{ background: BG }}>
        <div className="p-5 rounded-2xl border mx-4 mt-2" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-base font-black text-white">Bienveni{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Konpayi Dashboard</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          {COMPANY_TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setCompanyTab(tab.id)}
              aria-pressed={companyTab === tab.id}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                companyTab === tab.id ? "text-slate-950" : "text-slate-400"
              }`}
              style={companyTab === tab.id ? { background: GOLD } : { background: CARD, border: `1px solid ${BORDER}` }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {companyTab === "overview"
          ? <div className="space-y-4 px-4"><CompanyOverviewSupplement user={user} /></div>
          : <CompanyContent tab={companyTab} user={user} />}
      </div>
    );
  }

  // ── Enterprise dashboard ───────────────────────────────────────
  if (isEnterpriseRole) {
    return (
      <div className="space-y-4 pb-8" style={{ background: BG }}>
        <div className="p-5 rounded-2xl border mx-4 mt-2" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-base font-black text-white">Bienveni{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Enterprise Dashboard</p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          {ENTERPRISE_TABS.map(tab => (
            <button key={tab.id} type="button" onClick={() => setEnterpriseTab(tab.id)}
              aria-pressed={enterpriseTab === tab.id}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                enterpriseTab === tab.id ? "text-slate-950" : "text-slate-400"
              }`}
              style={enterpriseTab === tab.id ? { background: GOLD } : { background: CARD, border: `1px solid ${BORDER}` }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {enterpriseTab === "overview"
          ? <div className="space-y-4 px-4"><EnterpriseOverviewSupplement user={user} /></div>
          : <EnterpriseContent tab={enterpriseTab} user={user} />}
      </div>
    );
  }

  // ── Business roles with config-driven dashboards ──────────────
  const GENERIC_ROLES = new Set([
    "hotel", "restaurant", "hospital", "clinic",
    "tourism", "rental", "office", "service_provider",
    "marketplace", "admin", "super_admin",
  ]);
  if (GENERIC_ROLES.has(roleKey)) {
    return <GenericRoleDashboard user={user} roleKey={roleKey} navigate={navigate} />;
  }

  // ── Main home (workers + employers) ───────────────────────────
  return (
    <JobFastHome
      user={user}
      geo={geo}
      jobs={jobs}
      loading={loading}
      members={members}
      navigate={navigate}
      isEmployer={isEmployer_}
    />
  );
}
