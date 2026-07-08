import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const skills = useMemo(() => user?.stats?.skills || [], [user]);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Chajman...
      </div>
    );
  }

  const avatarSrc =
    user.profileMetadata?.profilePhoto ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || "user")}`;

  const locationLabel =
    user.location?.city
      ? `${user.location.city}, ${user.location?.country || "Haiti"}`
      : user.location?.country || "Haiti";

  const rating = user.stats?.rating ?? 0;
  const jobsCompleted = user.stats?.totalJobs ?? 0;
  const memberSince = user.stats?.memberSince || "";
  const walletBalance = user.walletBalance ?? 0;
  const bio = user.profileMetadata?.bio || user.bio || "";

  return (
    <div className="w-full flex flex-col text-slate-100">
      <header className="rounded-b-2xl border-b border-slate-800/60 bg-slate-900/60 px-6 pb-6 pt-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
            Profil
          </h1>

          <button
            type="button"
            onClick={() => navigate(ROUTES.SETTINGS)}
            aria-label="Anviwònman"
            className="rounded-xl bg-slate-800 p-2.5 text-slate-300 transition-all hover:text-amber-400 active:scale-95 focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <img
              src={avatarSrc}
              alt={`Foto pwofil ${user.name}`}
              className="h-24 w-24 rounded-full border-4 border-slate-800 shadow-lg object-cover"
            />
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-slate-900 bg-green-500" />
          </div>

          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="mt-0.5 text-xs font-black uppercase tracking-widest text-amber-400">
            {user.profession || user.role}
          </p>

          {user.verified && (
            <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs">
              ✓ Kont Verifye
            </div>
          )}

          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            <span>{locationLabel}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
          <div className="text-center">
            <p className="text-lg font-black text-white">{jobsCompleted}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Travay</p>
          </div>
          <div className="border-x border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-black text-white">{rating}</p>
              <svg className="h-3.5 w-3.5 fill-amber-400 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evalyasyon</p>
          </div>
          <div className="text-center">
            <p className="pt-0.5 text-xs font-black text-white">{memberSince}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Depi</p>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-5 py-6">
        <section>
          <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Wallet</h2>
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
            <p className="text-xs text-slate-400">Balans Disponib</p>
            <p className="mt-1 text-2xl font-black text-green-400">
              ${Number(walletBalance).toLocaleString()}
            </p>
          </div>
        </section>

        {bio ? (
          <section>
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">A Pwopo</h2>
            <p className="text-sm font-medium leading-relaxed text-slate-300">{bio}</p>
          </section>
        ) : null}

        {skills.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Konpetans</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-bold text-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => navigate(ROUTES.JOB_HISTORY)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-slate-800/40 p-4 transition-all hover:border-slate-700 active:scale-[0.99]"
          >
            <span className="text-sm font-bold text-slate-100">Istwa Travay</span>
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/80 bg-slate-800/40 p-4 transition-all hover:border-slate-700 active:scale-[0.99]"
          >
            <span className="text-sm font-bold text-slate-100">Notifikasyon</span>
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
    </div>
  );
}

export default React.memo(ProfileScreen);
