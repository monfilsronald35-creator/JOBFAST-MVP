/**
 * WorkerDashboard.jsx
 *
 * Worker-specific dashboard sections rendered inside Dashboard.jsx
 * for the 'worker' role.  This is a component, NOT a page — it has
 * no route and no layout of its own.  All data flows in via props
 * (jobs list, user from AuthContext) so there is zero duplication
 * of fetching logic that already lives in Dashboard.jsx.
 *
 * Tabs:
 *   overview  → handled by Dashboard.jsx (job list, preserved exactly)
 *   profile   → portfolio, skills, experience, completeness, verification
 *   schedule  → availability toggle, GPS location, service radius
 *   income    → earnings estimate, completed jobs, reviews
 *   trust     → trust score gauge, score breakdown, notifications preview
 */

import React, {
  useState, useCallback, useMemo, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, RefreshCcw, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

// ── Pure computations ────────────────────────────────────────

export function computeTrustScore(user) {
  const rating   = user?.stats?.rating    ?? 0;
  const jobs     = user?.stats?.totalJobs ?? 0;
  const complete = user?.profileCompleteness ?? 0;
  const verified = !!user?.verified;

  return Math.min(100, Math.round(
    40                               // base
    + (rating / 5) * 20              // 0–20 from rating
    + Math.min(jobs, 20) * 0.75      // 0–15 from jobs  (caps at 20 jobs)
    + (complete / 100) * 15          // 0–15 from completeness
    + (verified ? 10 : 0),           // 10 for verification
  ));
}

export function computeCompleteness(user) {
  const meta = user?.profileMetadata || {};
  const checks = [
    { done: !!user?.name,                                    tip: 'Ajoute non konplè ou' },
    { done: !!user?.email,                                   tip: 'Imèl verifye' },
    { done: !!(meta?.phone || user?.phone),                  tip: 'Ajoute nimewo telefòn ou' },
    { done: !!meta?.bio,                                     tip: 'Ekri yon bio pou pwofil ou' },
    { done: !!user?.profession,                              tip: 'Chwazi yon metye' },
    { done: !!(user?.location?.city || meta?.city),          tip: 'Ajoute lokasyon ou' },
    { done: (meta?.skills?.length ?? 0) > 0,                tip: 'Ajoute konpetans ou yo' },
    { done: (meta?.workPhotos?.length ?? 0) > 0,            tip: 'Ajoute foto travay ou' },
    { done: !!(meta?.yearsExperience ?? user?.experience),   tip: 'Espesifye eksperyans ou' },
  ];
  const done = checks.filter(c => c.done).length;
  return {
    pct:     Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.tip),
  };
}

// ── GPS hook for updating the worker's OWN stored location ────
// Distinct from SearchScreen's GPS (which locates the searcher).
// Here we update the worker's coordinates so others can find them.

function useWorkerGPS() {
  const [acquiring, setAcquiring] = useState(false);
  const [gpsError,  setGpsError]  = useState(null);

  const acquire = useCallback((onSuccess) => {
    if (!navigator.geolocation) {
      setGpsError('GPS pa disponib sou aparèy sa a');
      return;
    }
    setAcquiring(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAcquiring(false);
        onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setAcquiring(false);
        setGpsError('Pa ka jwenn lokasyon — pèmèt GPS');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { acquiring, gpsError, acquire };
}

// ── Availability mode definitions ────────────────────────────

const AVAIL_MODES = [
  { id: 'available',  label: 'Disponib',     emoji: '🟢', desc: 'Disponib pou travay nenpòt ki lè'  },
  { id: 'busy',       label: 'Okipe',        emoji: '🔵', desc: 'Ap travay kounye a, limite'          },
  { id: 'looking',    label: 'Chèche Travay', emoji: '🟡', desc: 'Chèche opòtinite aktivman'          },
  { id: 'vacation',   label: 'Vakans',       emoji: '🔴', desc: 'An vakans — pa disponib'             },
];

// ── Reusable UI atoms ────────────────────────────────────────

const Section = memo(function Section({ icon, title, action, children }) {
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              {icon && <span>{icon}</span>}
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
});

const MiniStat = memo(function MiniStat({ value, label, color = 'amber' }) {
  const colors = {
    amber: 'text-amber-500',
    green: 'text-emerald-400',
    blue:  'text-blue-400',
    rose:  'text-rose-400',
  };
  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-3 text-center">
      <div className={`text-xl font-bold ${colors[color] || colors.amber}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
});

// ── Overview supplement ───────────────────────────────────────
// Rendered at the TOP of the Overview tab, above the existing job list.
// Shows quick stats + trust bar + current availability badge.

export const OverviewSupplement = memo(function OverviewSupplement({ user }) {
  const trustScore = useMemo(() => computeTrustScore(user), [user]);
  const { pct }    = useMemo(() => computeCompleteness(user), [user]);
  const avail      = user?.availability || 'available';
  const availMode  = AVAIL_MODES.find(m => m.id === avail) || AVAIL_MODES[0];

  return (
    <div className="space-y-3">
      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat value={`⭐ ${(user?.stats?.rating ?? 5).toFixed(1)}`} label="Rating" />
        <MiniStat value={user?.stats?.totalJobs ?? 0} label="Travay Fini" color="green" />
        <MiniStat value={`${pct}%`} label="Pwofil" color="blue" />
      </div>

      {/* Trust bar + availability badge */}
      <div className="flex gap-3">
        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400">🛡️ Konfyans</span>
            <span className="text-[10px] font-bold text-amber-500">{trustScore}/100</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 px-3 py-2 flex items-center gap-2 shrink-0">
          <span className="text-lg">{availMode.emoji}</span>
          <span className="text-xs font-medium text-slate-200">{availMode.label}</span>
        </div>
      </div>
    </div>
  );
});

// ── PROFILE tab ───────────────────────────────────────────────

function ProfileTab({ user }) {
  const navigate   = useNavigate();
  const { login }  = useAuth();

  const { pct, missing } = useMemo(() => computeCompleteness(user), [user]);
  const meta     = user?.profileMetadata || {};
  const skills   = useMemo(() => meta?.skills || [], [meta]);
  const photos   = meta?.workPhotos || [];

  const [newSkill, setNewSkill] = useState('');
  const [saving,   setSaving]   = useState(false);

  const userId = user?._id || user?.id;

  const addSkill = useCallback(async () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;

    const updatedSkills = [...skills, trimmed];
    const updatedUser   = { ...user, profileMetadata: { ...meta, skills: updatedSkills } };

    setSaving(true);
    login(updatedUser); // optimistic
    setNewSkill('');

    try {
      await API.patch('/workers/profile', { userId, profileMetadata: { skills: updatedSkills } });
    } catch {
      // Keep optimistic for MVP; will sync on next load
    } finally {
      setSaving(false);
    }
  }, [newSkill, skills, meta, user, userId, login]);

  const removeSkill = useCallback(async (skill) => {
    const updatedSkills = skills.filter(s => s !== skill);
    const updatedUser   = { ...user, profileMetadata: { ...meta, skills: updatedSkills } };
    login(updatedUser);
    try {
      await API.patch('/workers/profile', { userId, profileMetadata: { skills: updatedSkills } });
    } catch { /* keep optimistic */ }
  }, [skills, meta, user, userId, login]);

  return (
    <div className="space-y-4">

      {/* Profile completeness */}
      <Section icon="📊" title="Konplè Pwofil">
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-400">Nivo konplè</span>
            <span className="text-xs font-bold text-emerald-400">{pct}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
        </div>
        {missing.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Pou amelyore</p>
            {missing.slice(0, 4).map(tip => (
              <div key={tip} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-amber-500 shrink-0">→</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Skills */}
      <Section
        icon="🎯"
        title="Konpetans"
        action={
          <button
            onClick={() => navigate('/edit-profile')}
            className="flex items-center gap-1 text-[10px] text-amber-400"
          >
            Pwofil <ChevronRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
          {skills.length === 0 && (
            <p className="text-xs text-slate-500">Pa gen konpetans ajoute</p>
          )}
          {skills.map(skill => (
            <span
              key={skill}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full"
            >
              <span className="text-xs text-amber-300">{skill}</span>
              <button
                onClick={() => removeSkill(skill)}
                className="text-slate-500 hover:text-rose-400 text-[10px] leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            placeholder="Ekri yon konpetans, appuye +"
            className="flex-1 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500/40"
          />
          <button
            onClick={addSkill}
            disabled={saving || !newSkill.trim()}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold disabled:opacity-40 transition"
          >
            +
          </button>
        </div>
      </Section>

      {/* Portfolio / work photos */}
      <Section
        icon="📸"
        title="Pòtfòlyo — Foto Travay"
        action={
          <button
            onClick={() => navigate('/edit-profile')}
            className="flex items-center gap-1 text-[10px] text-amber-400"
          >
            Ajoute <ChevronRight className="w-3 h-3" />
          </button>
        }
      >
        {photos.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-slate-500">
            <span className="text-3xl mb-2">📷</span>
            <p className="text-xs">Pa gen foto travay yo pou kounye a</p>
            <p className="text-[10px] mt-1 text-slate-600">Ajoute foto pou atire plis kliyan</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-800">
                <img src={photo} alt={`Travay ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Experience */}
      <Section icon="🎓" title="Eksperyans Pwofesyonèl">
        <dl className="space-y-2.5">
          {[
            ['Ane Eksperyans', `${meta?.yearsExperience ?? user?.experience ?? 0} an`],
            ['Metye',          user?.profession || '—'],
            ['Kategori',       user?.category   || '—'],
            ['Kont',           user?.accountType || '—'],
            ['Manm depi',      user?.stats?.memberSince || '—'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-xs font-semibold text-white">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Verification badges */}
      <Section icon="✅" title="Verifikasyon">
        <div className="space-y-2.5">
          {[
            { label: 'Imèl',        done: !!user?.email,                      icon: '📧' },
            { label: 'Telefòn',     done: !!(user?.phone || meta?.phone),     icon: '📱' },
            { label: 'Identite',    done: !!meta?.identityVerified,           icon: '🪪' },
            { label: 'Dokiman',     done: !!meta?.documentsVerified,          icon: '📄' },
          ].map(v => (
            <div key={v.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{v.icon}</span>
                <span className="text-xs text-slate-300">{v.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                v.done
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-700/80 text-slate-500'
              }`}>
                {v.done ? '✓ Verifye' : 'Pa verifye'}
              </span>
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}

// ── SCHEDULE tab ──────────────────────────────────────────────

function ScheduleTab({ user, jobs }) {
  const { login }                          = useAuth();
  const { acquiring, gpsError, acquire }   = useWorkerGPS();

  const currentAvail = user?.availability || 'available';
  const [saving,      setSaving]           = useState(false);
  const [locationMsg, setLocationMsg]      = useState(null);
  const [serviceRadius, setServiceRadius]  = useState(
    user?.location?.serviceRadius ?? 10,
  );

  const userId = user?._id || user?.id;

  const handleAvailabilityChange = useCallback(async (newAvail) => {
    if (newAvail === currentAvail) return;
    setSaving(true);
    login({ ...user, availability: newAvail }); // optimistic
    try {
      await API.patch('/workers/availability', { userId, availability: newAvail });
    } catch { /* keep optimistic for MVP */ } finally {
      setSaving(false);
    }
  }, [currentAvail, user, userId, login]);

  const handleGPSUpdate = useCallback(() => {
    acquire(async ({ lat, lng }) => {
      setLocationMsg(null);
      try {
        await API.patch('/workers/location', { userId, lat, lng, serviceRadius });
        const updatedLoc = {
          ...user?.location,
          coordinates: { latitude: lat, longitude: lng },
          lastUpdated:  new Date().toISOString(),
          serviceRadius,
        };
        login({ ...user, location: updatedLoc });
        setLocationMsg('✓ Lokasyon mete ajou');
        setTimeout(() => setLocationMsg(null), 3000);
      } catch {
        setLocationMsg('Erè mete ajou lokasyon');
      }
    });
  }, [acquire, user, userId, login, serviceRadius]);

  const city       = user?.location?.city || '';
  const state      = user?.location?.state || '';
  const lastUpdate = user?.location?.lastUpdated;

  return (
    <div className="space-y-4">

      {/* Availability selector */}
      <Section icon="🟢" title="Estati Disponibilite">
        {saving && <p className="text-[10px] text-amber-400 mb-2 animate-pulse">Ap sove...</p>}
        <div className="space-y-2">
          {AVAIL_MODES.map(mode => {
            const active = currentAvail === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleAvailabilityChange(mode.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                  active
                    ? 'border-amber-500/70 bg-amber-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <span className="text-xl shrink-0">{mode.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{mode.label}</div>
                  <div className="text-[10px] text-slate-400">{mode.desc}</div>
                </div>
                {active && <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* GPS location */}
      <Section
        icon="📍"
        title="Lokasyon GPS"
        action={
          <button
            onClick={handleGPSUpdate}
            disabled={acquiring}
            className="flex items-center gap-1 text-[10px] text-amber-400 disabled:opacity-40"
          >
            {acquiring ? 'Ap chèche...' : 'Mete ajou'}
            <RefreshCcw className="w-3 h-3" />
          </button>
        }
      >
        {gpsError  && <p className="text-[10px] text-rose-400    mb-2">{gpsError}</p>}
        {locationMsg && <p className="text-[10px] text-emerald-400 mb-2">{locationMsg}</p>}

        <dl className="space-y-2.5 mb-4">
          <div className="flex justify-between">
            <dt className="text-xs text-slate-400">Vil aktyèl</dt>
            <dd className="text-xs font-semibold text-white">{city || '—'}{state ? `, ${state}` : ''}</dd>
          </div>
          {lastUpdate && (
            <div className="flex justify-between">
              <dt className="text-xs text-slate-400">Dènye mete ajou</dt>
              <dd className="text-xs text-white">
                {new Date(lastUpdate).toLocaleDateString('fr-HT')}
              </dd>
            </div>
          )}
        </dl>

        {/* Service radius slider */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-slate-400">Reyon sèvis</span>
            <span className="text-xs font-bold text-amber-400">{serviceRadius} km</span>
          </div>
          <input
            type="range"
            min="1" max="50" step="1"
            value={serviceRadius}
            onChange={e => setServiceRadius(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>
      </Section>

      {/* Mini job calendar */}
      <Section icon="📋" title="Travay Disponib">
        {(jobs || []).length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Pa gen travay disponib kounye a</p>
        ) : (
          <div className="space-y-2">
            {(jobs || []).slice(0, 4).map((job, i) => (
              <div
                key={job.id || job._id || i}
                className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title || 'Travay'}</p>
                  <p className="text-[10px] text-slate-400">{job.company || '—'}</p>
                </div>
                <span className="text-xs font-bold text-amber-500 shrink-0 ml-2">
                  {job.price || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

    </div>
  );
}

// ── INCOME tab ────────────────────────────────────────────────

function IncomeTab({ user, jobs }) {
  const totalJobs  = user?.stats?.totalJobs ?? 0;
  const rating     = user?.stats?.rating    ?? 5;

  // Earnings are estimated from totalJobs × default daily rate.
  // Will be replaced by real payment data in a future phase.
  const RATE = 50; // USD per job
  const totalEst   = totalJobs * RATE;
  const monthEst   = Math.round(totalEst * 0.2);
  const weekEst    = Math.round(totalEst * 0.05);
  const successRate = totalJobs > 0 ? Math.round((rating / 5) * 100) : 0;

  return (
    <div className="space-y-4">

      {/* Earnings estimate */}
      <Section icon="💰" title="Estimasyon Revni">
        <p className="text-[10px] text-slate-500 mb-3">
          ✱ Estimasyon MVP — yo pral mete ajou ak done reyèl yo.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <MiniStat value={`$${totalEst}`}  label="Total"   color="amber" />
          <MiniStat value={`$${monthEst}`}  label="Mwa sa"  color="green" />
          <MiniStat value={`$${weekEst}`}   label="Semèn"   color="blue"  />
        </div>
      </Section>

      {/* Completed jobs stats */}
      <Section icon="✅" title="Travay Konplete">
        <dl className="space-y-2.5">
          {[
            ['Total konplete',  totalJobs],
            ['To siksè',        `${successRate}%`],
            ['Rating mwayen',   `⭐ ${rating.toFixed(1)}`],
            ['Reklamasyon',     '0'],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-xs font-bold text-white">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Recent job history */}
      <Section icon="📋" title="Istwa Travay">
        {(jobs || []).length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Pa gen istwa travay pou kounye a</p>
        ) : (
          <div className="space-y-2">
            {(jobs || []).slice(0, 5).map((job, i) => (
              <div
                key={job.id || job._id || i}
                className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title || 'Travay'}</p>
                  <p className="text-[10px] text-slate-400">{job.time || '—'}</p>
                </div>
                <span className="text-xs font-bold text-amber-500 shrink-0 ml-2">
                  {job.price || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Reviews */}
      <Section icon="⭐" title="Evalyasyon">
        <div className="flex flex-col items-center py-4">
          <div className="text-5xl font-black text-amber-400">{rating.toFixed(1)}</div>
          <div className="flex items-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                className={`text-xl ${n <= Math.round(rating) ? 'text-amber-400' : 'text-slate-700'}`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {totalJobs} evalyasyon • 0 reklamasyon
          </p>
          {totalJobs === 0 && (
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Evalyasyon yo pral parèt apre ou fini premye travay ou.
            </p>
          )}
        </div>
      </Section>

    </div>
  );
}

// ── TRUST tab ─────────────────────────────────────────────────

function TrustTab({ user }) {
  const navigate   = useNavigate();
  const trustScore = useMemo(() => computeTrustScore(user), [user]);
  const { pct }    = useMemo(() => computeCompleteness(user), [user]);

  const rating   = user?.stats?.rating    ?? 0;
  const jobs     = user?.stats?.totalJobs ?? 0;
  const verified = !!user?.verified;

  const scoreColor =
    trustScore >= 80 ? '#10b981' :
    trustScore >= 50 ? '#f59e0b' :
                       '#ef4444';

  const textColor =
    trustScore >= 80 ? 'text-emerald-400' :
    trustScore >= 50 ? 'text-amber-400'   :
                       'text-rose-400';

  const scoreLabel =
    trustScore >= 80 ? 'Ekselan — Ou pami meyè yo!' :
    trustScore >= 50 ? 'Bon — Kontinye amelyore' :
                       'Kòmanse bati konfyans ou';

  const breakdowns = [
    { label: 'Travay Fini',   pts: Math.round(Math.min(jobs, 20) * 0.75), max: 15, icon: '✅' },
    { label: 'Rating',        pts: Math.round((rating / 5) * 20),          max: 20, icon: '⭐' },
    { label: 'Pwofil Konplè', pts: Math.round((pct / 100) * 15),           max: 15, icon: '📊' },
    { label: 'Verifikasyon',  pts: verified ? 10 : 0,                       max: 10, icon: '✓'  },
    { label: 'Pwen Baz',      pts: 40,                                      max: 40, icon: '🏗️' },
  ];

  return (
    <div className="space-y-4">

      {/* Score gauge */}
      <Section>
        <div className="flex flex-col items-center py-4">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={scoreColor}
                strokeWidth="12"
                strokeDasharray={`${trustScore * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${textColor}`}>{trustScore}</span>
              <span className="text-[10px] text-slate-400">/100</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white mt-3">🛡️ Nivo Konfyans</h3>
          <p className="text-[10px] text-slate-400 mt-1">{scoreLabel}</p>
        </div>
      </Section>

      {/* Score breakdown */}
      <Section icon="📊" title="Detay Pwen yo">
        <div className="space-y-3">
          {breakdowns.map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">{b.icon} {b.label}</span>
                <span className="text-xs font-bold text-amber-400">{b.pts}/{b.max}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(b.pts / b.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Notification preview */}
      <Section
        icon="🔔"
        title="Notifikasyon"
        action={
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-1 text-[10px] text-amber-400"
          >
            Tout yo <ChevronRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-2">
          {[
            { icon: '💼', msg: 'Nouvo travay disponib bò kote ou',     time: 'Kounye a' },
            { icon: '⭐', msg: 'Pwofil ou parèt nan rechèch yo',        time: '5 min'    },
            { icon: '🔔', msg: 'Konplete pwofil ou pou plis vizibilite', time: '1 hr'    },
          ].map((n, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-xl">
              <span className="text-base shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{n.msg}</p>
                <p className="text-[10px] text-slate-400">{n.time}</p>
              </div>
            </div>
          ))}

          <button
            onClick={() => navigate('/notifications')}
            className="w-full mt-1 py-2.5 text-xs text-amber-400 font-medium text-center hover:bg-slate-800 rounded-xl transition"
          >
            Wè tout notifikasyon yo →
          </button>
        </div>
      </Section>

    </div>
  );
}

// ── Tab definition (exported for Dashboard.jsx tab bar) ───────

export const WORKER_TABS = [
  { id: 'overview',  label: 'Akeyi',    icon: '🏠' },
  { id: 'profile',   label: 'Pwofil',   icon: '👤' },
  { id: 'schedule',  label: 'Orè',      icon: '📅' },
  { id: 'income',    label: 'Revni',    icon: '💰' },
  { id: 'trust',     label: 'Konfyans', icon: '🛡️' },
];

// ── Default export: tab content router ────────────────────────
// Dashboard.jsx renders the 'overview' tab itself (backward compat).
// This component handles all other tabs.

export default function WorkerContent({ tab, user, jobs }) {
  switch (tab) {
    case 'profile':  return <ProfileTab  user={user} />;
    case 'schedule': return <ScheduleTab user={user} jobs={jobs || []} />;
    case 'income':   return <IncomeTab   user={user} jobs={jobs || []} />;
    case 'trust':    return <TrustTab    user={user} />;
    default:         return null;
  }
}