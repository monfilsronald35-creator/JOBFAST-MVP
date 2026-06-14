import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export const ROUTES = {
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  EDIT_PROFILE: "/edit-profile",
  SETTINGS: "/settings",
  JOB_HISTORY: "/job-history",
  NOTIFICATIONS: "/notifications",
  SEARCH: "/search",
  POST_JOB: "/post-job",
  LOGIN: "/login",
};

const DEFAULT_USER = {
  id: "",
  avatar: "",
  coverPhoto: "",
  name: "",
  username: "",
  role: "",
  membership: "free",
  verified: false,
  online: true,
  location: "",
  phone: "",
  email: "",
  rating: 0,
  totalReviews: 0,
  jobsCompleted: 0,
  activeJobs: 0,
  totalEarnings: 0,
  walletBalance: 0,
  memberSince: "",
  bio: "",
  skills: [],
  languages: [],
  kycStatus: "pending",
};

function ProfileScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState(DEFAULT_USER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentActivity] = useState([
    'Travay "Fondasyon Kay" fini.',
    "Nouvo evalyasyon 5★ resevwa.",
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/profile/me", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setUser({ ...DEFAULT_USER, ...data });
      } catch (err) {
        setError("Erè pandan chajman profil la");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const skills = useMemo(() => user.skills || [], [user.skills]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-navy-900 p-5 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 pb-24 font-sans text-text-inverse select-none">
      <header className="rounded-b-[2rem] border-b border-navy-800/60 bg-navy-800/40 px-6 pb-6 pt-10 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
            Profil
          </h1>

          <button
            type="button"
            onClick={() => navigate(ROUTES.SETTINGS)}
            aria-label="Anviwònman"
            className="rounded-xl bg-navy-800 p-2.5 text-slate-300 transition-all hover:text-gold-400 active:scale-95 focus:outline-none focus:ring-4 focus:ring-gold-100/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Ronald"}
              alt={`Foto pwofil ${user.name}`}
              className="mb-4 h-24 w-24 rounded-full border-4 border-navy-800 shadow-lg"
            />

            <div className="absolute bottom-2 right-1">
              <div className="h-4 w-4 rounded-full border-2 border-navy-900 bg-green-500" />
            </div>

            <button
              type="button"
              aria-label="Modifye foto pwofil"
              className="absolute bottom-4 right-0 rounded-full bg-gold-500 p-1.5 text-navy-900 shadow-md transition-all hover:bg-gold-400 active:scale-95 focus:outline-none focus:ring-4 focus:ring-gold-500/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="mt-0.5 text-xs font-black uppercase tracking-widest text-gold-400">
            {user.role}
          </p>

          {user.verified ? (
            <div className="mt-2 flex items-center justify-center gap-1 text-emerald-400">
              ✓ Kont Verifye
            </div>
          ) : null}

          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            <span>{user.location}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl border border-navy-700 bg-navy-900/60 p-4">
          <div className="text-center">
            <p className="text-lg font-black text-white">{user.jobsCompleted}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Travay</p>
          </div>

          <div className="border-x border-navy-800 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-black text-white">{user.rating}</p>
              <svg className="h-3.5 w-3.5 fill-gold-400 text-gold-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evalyasyon</p>
          </div>

          <div className="text-center">
            <p className="pt-0.5 text-xs font-black text-white">{user.memberSince}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Depi</p>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-5 py-6">
        <section>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Wallet
          </h2>
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <p className="text-xs text-slate-400">Balans Disponib</p>
            <p className="mt-1 text-2xl font-black text-green-400">
              ${Number(user.walletBalance || 0).toLocaleString()}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">A Pwopo</h2>
          <p className="text-sm font-medium leading-relaxed text-slate-300">{user.bio}</p>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Konpetans</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-xl border border-navy-700 bg-navy-800/50 px-3 py-1.5 text-xs font-bold text-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div key={item} className="rounded-xl bg-navy-800/40 p-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.EDIT_PROFILE)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-navy-800/40 p-4 transition-all hover:border-slate-700 active:scale-[0.99]"
          >
            <span className="text-sm font-bold text-text-inverse">Modifye Pwofil</span>
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.JOB_HISTORY)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-navy-800/40 p-4 transition-all hover:border-slate-700 active:scale-[0.99]"
          >
            <span className="text-sm font-bold text-text-inverse">Istwa Travay</span>
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 transition-all hover:border-red-500/40 active:scale-[0.99]"
          >
            <span className="text-sm font-bold">Dekonekte</span>
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-between border-t border-slate-900 bg-navy-950/95 px-6 py-2 backdrop-blur-md">
        <button onClick={() => navigate(ROUTES.DASHBOARD)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Akey">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Akey</span>
        </button>

        <button onClick={() => navigate(ROUTES.SEARCH)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Rechèch">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Rechèch</span>
        </button>

        <button onClick={() => navigate(ROUTES.POST_JOB)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Paste">
          <div className="relative -mt-4 flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-navy-800 text-gold-400 shadow-lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider">Paste</span>
        </button>

        <button onClick={() => navigate(ROUTES.NOTIFICATIONS)} className="flex flex-col items-center gap-1 text-slate-500 transition-colors hover:text-gold-400" type="button" aria-label="Notifikasyon">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Notifikasyon</span>
        </button>

        <button onClick={() => navigate(ROUTES.PROFILE)} className="flex flex-col items-center gap-1 text-gold-400" type="button" aria-label="Profil aktyèl">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
        </button>
      </nav>
    </div>
  );
}

export default React.memo(ProfileScreen);
