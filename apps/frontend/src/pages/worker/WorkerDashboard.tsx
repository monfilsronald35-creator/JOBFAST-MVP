/**
 * WorkerDashboard.tsx — Premium Enterprise v2.0
 *
 * Worker-specific dashboard sections rendered inside Dashboard.jsx
 * for the 'worker' role.  Sa rete yon component (pa gen route pa li),
 * tout done rive via props (user, jobs) jan li ye kounye a.
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

// ── Internal types ──────────────────────────────────────────────

type UserRecord = Record<string, unknown> | null;

interface WorkerStats {
  rating?: number;
  totalJobs?: number;
  todayRevenue?: number;
  nearbyJobs?: number;
  memberSince?: string;
}

interface WorkerProfileMeta {
  phone?: string;
  bio?: string;
  skills?: string[];
  workPhotos?: string[];
  yearsExperience?: number;
  identityVerified?: boolean;
  documentsVerified?: boolean;
  city?: string;
}

interface WorkerLocation {
  city?: string;
  state?: string;
  coordinates?: { latitude: number; longitude: number };
  serviceRadius?: number;
  lastUpdated?: string;
}

interface WorkerUser {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  email?: string;
  phone?: string;
  profession?: string;
  category?: string;
  accountType?: string;
  availability?: string;
  verified?: boolean;
  profileCompleteness?: number;
  experience?: number;
  stats?: WorkerStats;
  profileMetadata?: WorkerProfileMeta;
  location?: WorkerLocation;
}

interface JobItem {
  id?: string;
  _id?: string;
  title?: string;
  company?: string;
  price?: string;
  time?: string;
}

interface CompletenessResult {
  pct: number;
  missing: string[];
}

interface GPSCoords { lat: number; lng: number }
type OnGPSSuccess = (coords: GPSCoords) => void | Promise<void>;

const toW = (u: UserRecord): WorkerUser | null => u as WorkerUser | null;

// ── Pure computations ──────────────────────────────────────────

export function computeTrustScore(user: UserRecord): number {
  const wu = toW(user);
  const rating   = wu?.stats?.rating    ?? 0;
  const jobs     = wu?.stats?.totalJobs ?? 0;
  const complete = wu?.profileCompleteness ?? 0;
  const verified = !!wu?.verified;

  return Math.min(100, Math.round(
    40
    + (rating / 5) * 20
    + Math.min(jobs, 20) * 0.75
    + (complete / 100) * 15
    + (verified ? 10 : 0),
  ));
}

export function computeCompleteness(user: UserRecord): CompletenessResult {
  const wu   = toW(user);
  const meta = wu?.profileMetadata ?? {};
  const checks = [
    { done: !!wu?.name,                                   tip: 'worker.completeness.addName' },
    { done: !!wu?.email,                                  tip: 'worker.completeness.verifyEmail' },
    { done: !!(meta.phone ?? wu?.phone),                  tip: 'worker.completeness.addPhone' },
    { done: !!meta.bio,                                   tip: 'worker.completeness.addBio' },
    { done: !!wu?.profession,                             tip: 'worker.completeness.chooseProfession' },
    { done: !!(wu?.location?.city ?? meta.city),          tip: 'worker.completeness.addLocation' },
    { done: (meta.skills?.length ?? 0) > 0,               tip: 'worker.completeness.addSkills' },
    { done: (meta.workPhotos?.length ?? 0) > 0,           tip: 'worker.completeness.addWorkPhotos' },
    { done: !!(meta.yearsExperience ?? wu?.experience),   tip: 'worker.completeness.addExperience' },
  ];
  const done = checks.filter(c => c.done).length;
  return {
    pct:     Math.round((done / checks.length) * 100),
    missing: checks.filter(c => !c.done).map(c => c.tip),
  };
}

// ── GPS hook ──────────────────────────────────────────────────

function useWorkerGPS(): { acquiring: boolean; gpsError: string | null; acquire: (onSuccess: OnGPSSuccess) => void } {
  const { t } = useTranslation();
  const [acquiring, setAcquiring] = useState(false);
  const [gpsError,  setGpsError]  = useState<string | null>(null);

  const acquire = useCallback((onSuccess: OnGPSSuccess) => {
    if (!navigator.geolocation) {
      setGpsError(t('worker.gps.notAvailable', 'GPS not available on this device'));
      return;
    }
    setAcquiring(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAcquiring(false);
        void onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setAcquiring(false);
        setGpsError(t('worker.gps.permissionDenied', 'Cannot find location — allow GPS'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, [t]);

  return { acquiring, gpsError, acquire };
}

// ── Availability modes ─────────────────────────────────────────

const AVAIL_MODES = [
  { id: 'available', labelKey: 'worker.avail.available', descKey: 'worker.avail.availableDesc', emoji: '🟢' },
  { id: 'busy',      labelKey: 'worker.avail.busy',      descKey: 'worker.avail.busyDesc',      emoji: '🔵' },
  { id: 'looking',   labelKey: 'worker.avail.looking',   descKey: 'worker.avail.lookingDesc',   emoji: '🟡' },
  { id: 'vacation',  labelKey: 'worker.avail.vacation',  descKey: 'worker.avail.vacationDesc',  emoji: '🔴' },
] as const;

// ── Mini Design System ─────────────────────────────────────────

interface SectionProps {
  icon?: string;
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Section = memo(function Section({ icon, title, action, children }: SectionProps) {
  return (
    <motion.section
      className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.9)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 18 }}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              {icon && <span>{icon}</span>}
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
});

interface StatCardProps {
  value: string | number;
  label: string;
  color?: 'amber' | 'green' | 'blue' | 'rose';
}

const StatCard = memo(function StatCard({ value, label, color = 'amber' }: StatCardProps) {
  const colors: Record<string, string> = {
    amber: 'text-amber-400',
    green: 'text-emerald-400',
    blue:  'text-sky-400',
    rose:  'text-rose-400',
  };
  return (
    <motion.div
      className="bg-[#0f172a] rounded-xl border border-slate-800 px-3 py-3 text-center shadow-[0_10px_30px_rgba(15,23,42,0.8)]"
      whileHover={{ y: -2 }}
    >
      <div className={`text-xl font-bold ${colors[color] ?? colors['amber']}`}>{value}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </motion.div>
  );
});

const PillBadge = memo(function PillBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-900/80 border border-slate-700/60 px-2.5 py-0.5 text-[10px] text-slate-300">
      {label}
    </span>
  );
});

const HeroCard = memo(function HeroCard({ user }: { user: UserRecord }) {
  const { t } = useTranslation();
  const wu         = toW(user);
  const name       = wu?.name ?? wu?.firstName ?? t('worker.defaultName', 'Worker');
  const trustScore = useMemo(() => computeTrustScore(user), [user]);
  const { pct }    = useMemo(() => computeCompleteness(user), [user]);
  const todayRev   = wu?.stats?.todayRevenue ?? 0;
  const nearbyJobs = wu?.stats?.nearbyJobs   ?? 0;

  return (
    <motion.div
      className="relative rounded-3xl p-5 border border-slate-700/70 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/90 backdrop-blur-2xl shadow-[0_40px_120px_rgba(15,23,42,0.98)] overflow-hidden"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      <div className="absolute -top-20 -left-10 w-48 h-48 bg-amber-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-10 w-52 h-52 bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em]">
            {t('worker.heroGreeting', { name, defaultValue: 'Good morning {{name}}' })}
          </p>
          <h2 className="text-lg sm:text-xl font-semibold text-white leading-tight">
            {t('worker.heroDashboardTitle', 'JOBFAST Worker Dashboard')}
          </h2>
          <p className="text-[11px] text-slate-300 max-w-md">
            {t('worker.heroSubtitle', 'AI is helping you find the best jobs, increase income, and build trust with clients.')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <PillBadge label={t('worker.aiScore', { score: trustScore, defaultValue: 'AI Score: {{score}}/100' })} />
            <PillBadge label={t('worker.profilePct', { pct, defaultValue: 'Profile: {{pct}}%' })} />
            <PillBadge label={t('worker.todayRevenue', { amount: todayRev, defaultValue: "Today's earnings: ${{amount}}" })} />
            <PillBadge label={t('worker.nearbyJobsLabel', { count: nearbyJobs, defaultValue: 'Nearby jobs: {{count}}' })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:w-56">
          <StatCard value={`${trustScore}/100`} label={t('worker.trustLevel', 'Trust level')}     color="green" />
          <StatCard value={`${pct}%`}           label={t('worker.profileComplete', 'Profile complete')} color="blue"  />
          <StatCard value={`$${todayRev}`}       label={t('worker.today', 'Today')}                color="amber" />
          <StatCard value={nearbyJobs}           label={t('worker.nearbyJobs', 'Nearby jobs')}    color="rose"  />
        </div>
      </div>
    </motion.div>
  );
});

// ── OverviewSupplement ─────────────────────────────────────────

export const OverviewSupplement = memo(function OverviewSupplement({ user }: { user: UserRecord }) {
  const { t }      = useTranslation();
  const wu         = toW(user);
  const trustScore = useMemo(() => computeTrustScore(user), [user]);
  const { pct }    = useMemo(() => computeCompleteness(user), [user]);
  const avail      = wu?.availability ?? 'available';
  const availMode  = AVAIL_MODES.find(m => m.id === avail) ?? AVAIL_MODES[0]!;

  return (
    <div className="space-y-4">
      <HeroCard user={user} />

      <Section>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <StatCard value={`⭐ ${(wu?.stats?.rating ?? 5).toFixed(1)}`} label={t('worker.rating', 'Rating')} />
          <StatCard value={wu?.stats?.totalJobs ?? 0}                   label={t('worker.jobsDone', 'Jobs')} color="green" />
          <StatCard value={`${pct}%`}                                    label={t('worker.tab.profile', 'Profile')} color="blue" />
        </div>

        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400">🛡️ {t('worker.trustLabel', 'Trust')}</span>
              <span className="text-[10px] font-bold text-amber-400">{trustScore}/100</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-400 to-sky-400"
                style={{ width: `${trustScore}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${trustScore}%` }}
                transition={{ type: 'spring', stiffness: 160, damping: 22 }}
              />
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 px-3 py-2 flex items-center gap-2 shrink-0">
            <span className="text-lg">{availMode.emoji}</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200">{t(availMode.labelKey, availMode.id)}</span>
              <span className="text-[10px] text-slate-500">{t('worker.currentStatus', 'Your current status')}</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
});

// ── PROFILE tab ────────────────────────────────────────────────

function ProfileTab({ user }: { user: UserRecord }) {
  const { t }      = useTranslation();
  const navigate   = useNavigate();
  const { login }  = useAuth();
  const wu         = toW(user);

  const { pct, missing } = useMemo(() => computeCompleteness(user), [user]);
  const meta   = wu?.profileMetadata ?? {};
  const skills = useMemo(() => meta.skills ?? [], [meta]);
  const photos = meta.workPhotos ?? [];

  const [newSkill, setNewSkill] = useState('');
  const [saving,   setSaving]   = useState(false);

  const userId = wu?._id ?? wu?.id;

  const addSkill = useCallback(async () => {
    const trimmed = newSkill.trim();
    if (!trimmed || skills.includes(trimmed)) return;

    const updatedSkills = [...skills, trimmed];
    const updatedUser   = { ...(user ?? {}), profileMetadata: { ...meta, skills: updatedSkills } };

    setSaving(true);
    login(updatedUser);
    setNewSkill('');

    try {
      await API.patch('/workers/profile', { userId, profileMetadata: { skills: updatedSkills } });
    } catch {
      // MVP: optimistic only, backend sync next load
    } finally {
      setSaving(false);
    }
  }, [newSkill, skills, meta, user, userId, login]);

  const removeSkill = useCallback(async (skill: string) => {
    const updatedSkills = skills.filter(s => s !== skill);
    const updatedUser   = { ...(user ?? {}), profileMetadata: { ...meta, skills: updatedSkills } };
    login(updatedUser);
    try {
      await API.patch('/workers/profile', { userId, profileMetadata: { skills: updatedSkills } });
    } catch { /* keep optimistic */ }
  }, [skills, meta, user, userId, login]);

  return (
    <div className="space-y-4">
      <Section icon="📊" title={t('worker.profileCompleteness', 'Profile Completeness')}>
        <div className="mb-3">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-400">{t('worker.completenessLevel', 'Completeness level')}</span>
            <span className="text-xs font-bold text-emerald-400">{pct}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {missing.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">{t('worker.toImprove', 'To improve')}</p>
            {missing.slice(0, 4).map(tip => (
              <div key={tip} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-amber-500 shrink-0">→</span>
                <span>{t(tip, tip)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        icon="🎯"
        title={t('worker.skills', 'Skills')}
        action={
          <button onClick={() => navigate('/edit-profile')} className="flex items-center gap-1 text-[10px] text-amber-400">
            {t('worker.tab.profile', 'Profile')} <ChevronRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="flex flex-wrap gap-2 mb-3 min-h-[24px]">
          {skills.length === 0 && <p className="text-xs text-slate-500">{t('worker.noSkills', 'No skills added')}</p>}
          {skills.map(skill => (
            <motion.span key={skill} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full" whileHover={{ y: -1 }}>
              <span className="text-xs text-amber-300">{skill}</span>
              <button onClick={() => void removeSkill(skill)} className="text-slate-500 hover:text-rose-400 text-[10px] leading-none">×</button>
            </motion.span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void addSkill(); }}
            placeholder={t('worker.skillPlaceholder', 'Type a skill, press +')}
            className="flex-1 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-amber-500/40"
          />
          <button
            onClick={() => void addSkill()}
            disabled={saving || !newSkill.trim()}
            className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold disabled:opacity-40 transition"
          >
            +
          </button>
        </div>
      </Section>

      <Section
        icon="📸"
        title={t('worker.portfolioTitle', 'Portfolio — Work Photos')}
        action={
          <button onClick={() => navigate('/edit-profile')} className="flex items-center gap-1 text-[10px] text-amber-400">
            {t('worker.add', 'Add')} <ChevronRight className="w-3 h-3" />
          </button>
        }
      >
        {photos.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-slate-500">
            <span className="text-3xl mb-2">📷</span>
            <p className="text-xs">{t('worker.noWorkPhotos', 'No work photos yet')}</p>
            <p className="text-[10px] mt-1 text-slate-600">{t('worker.addPhotosHint', 'Add photos to attract more clients')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-800">
                <img src={photo} alt={t('worker.workPhotoAlt', { n: i + 1, defaultValue: 'Work {{n}}' })} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section icon="🎓" title={t('worker.professionalExp', 'Professional Experience')}>
        <dl className="space-y-2.5">
          {([
            [t('worker.yearsExp', 'Years of Experience'), `${meta.yearsExperience ?? wu?.experience ?? 0} ${t('worker.yearsExp', 'yrs')}`],
            [t('worker.trade', 'Trade'),                  wu?.profession   ?? '—'],
            [t('worker.category', 'Category'),            wu?.category     ?? '—'],
            [t('worker.accountType', 'Account'),          wu?.accountType  ?? '—'],
            [t('worker.memberSince', 'Member since'),     wu?.stats?.memberSince ?? '—'],
          ] as [string, string][]).map(([label, val]) => (
            <div key={label} className="flex justify-between items-center">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-xs font-semibold text-white">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section icon="✅" title={t('worker.verification', 'Verification')}>
        <div className="space-y-2.5">
          {[
            { labelKey: 'worker.verif.email',     done: !!wu?.email,                       icon: '📧' },
            { labelKey: 'worker.verif.phone',      done: !!(wu?.phone ?? meta.phone),        icon: '📱' },
            { labelKey: 'worker.verif.identity',   done: !!meta.identityVerified,            icon: '🪪' },
            { labelKey: 'worker.verif.documents',  done: !!meta.documentsVerified,           icon: '📄' },
          ].map(v => (
            <div key={v.labelKey} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{v.icon}</span>
                <span className="text-xs text-slate-300">{t(v.labelKey, v.labelKey)}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.done ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/80 text-slate-500'}`}>
                {v.done ? t('worker.isVerified', '✓ Verified') : t('worker.notVerified', 'Not verified')}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── SCHEDULE tab ───────────────────────────────────────────────

function ScheduleTab({ user, jobs }: { user: UserRecord; jobs: JobItem[] }) {
  const { t }                              = useTranslation();
  const { login }                          = useAuth();
  const { acquiring, gpsError, acquire }   = useWorkerGPS();
  const wu = toW(user);

  const currentAvail = wu?.availability ?? 'available';
  const [saving,      setSaving]          = useState(false);
  const [locationMsg, setLocationMsg]     = useState<string | null>(null);
  const [serviceRadius, setServiceRadius] = useState(wu?.location?.serviceRadius ?? 10);

  const userId = wu?._id ?? wu?.id;

  const handleAvailabilityChange = useCallback(async (newAvail: string) => {
    if (newAvail === currentAvail) return;
    setSaving(true);
    login({ ...(user ?? {}), availability: newAvail });
    try {
      await API.patch('/workers/availability', { userId, availability: newAvail });
    } catch {
      // MVP: backend sync later
    } finally {
      setSaving(false);
    }
  }, [currentAvail, user, userId, login]);

  const handleGPSUpdate = useCallback(() => {
    acquire(async ({ lat, lng }) => {
      setLocationMsg(null);
      try {
        await API.patch('/workers/location', { userId, lat, lng, serviceRadius });
        const updatedLoc = {
          ...(wu?.location ?? {}),
          coordinates: { latitude: lat, longitude: lng },
          lastUpdated: new Date().toISOString(),
          serviceRadius,
        };
        login({ ...(user ?? {}), location: updatedLoc });
        setLocationMsg(t('worker.gps.locationUpdated', '✓ Location updated'));
        setTimeout(() => setLocationMsg(null), 3000);
      } catch {
        setLocationMsg(t('worker.gps.locationError', 'Error updating location'));
      }
    });
  }, [acquire, user, wu, userId, login, serviceRadius, t]);

  const city       = wu?.location?.city       ?? '';
  const state      = wu?.location?.state      ?? '';
  const lastUpdate = wu?.location?.lastUpdated;

  return (
    <div className="space-y-4">
      <Section icon="🟢" title={t('worker.availabilityStatus', 'Availability Status')}>
        {saving && <p className="text-[10px] text-amber-400 mb-2 animate-pulse">{t('common.processing', 'Processing...')}</p>}
        <div className="space-y-2">
          {AVAIL_MODES.map(mode => {
            const active = currentAvail === mode.id;
            return (
              <motion.button
                key={mode.id}
                onClick={() => void handleAvailabilityChange(mode.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
                  active
                    ? 'border-amber-500/70 bg-amber-500/10 shadow-[0_14px_40px_rgba(251,191,36,0.25)]'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-xl shrink-0">{mode.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{t(mode.labelKey, mode.id)}</div>
                  <div className="text-[10px] text-slate-400">{t(mode.descKey, mode.id)}</div>
                </div>
                {active && <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />}
              </motion.button>
            );
          })}
        </div>
      </Section>

      <Section
        icon="📍"
        title={t('worker.gpsLocation', 'GPS Location')}
        action={
          <button onClick={handleGPSUpdate} disabled={acquiring} className="flex items-center gap-1 text-[10px] text-amber-400 disabled:opacity-40">
            {acquiring ? t('worker.gps.acquiring', 'Locating...') : t('worker.gps.update', 'Update')}
            <RefreshCcw className="w-3 h-3" />
          </button>
        }
      >
        {gpsError    && <p className="text-[10px] text-rose-400    mb-2">{gpsError}</p>}
        {locationMsg && <p className="text-[10px] text-emerald-400 mb-2">{locationMsg}</p>}

        <dl className="space-y-2.5 mb-4">
          <div className="flex justify-between">
            <dt className="text-xs text-slate-400">{t('worker.currentCity', 'Current city')}</dt>
            <dd className="text-xs font-semibold text-white">{city || '—'}{state ? `, ${state}` : ''}</dd>
          </div>
          {lastUpdate && (
            <div className="flex justify-between">
              <dt className="text-xs text-slate-400">{t('worker.lastUpdate', 'Last updated')}</dt>
              <dd className="text-xs text-white">{new Date(lastUpdate).toLocaleDateString('fr-HT')}</dd>
            </div>
          )}
        </dl>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-slate-400">{t('worker.serviceRadius', 'Service radius')}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">{serviceRadius} km</span>
              <button
                type="button"
                onClick={() => { void API.patch('/workers/radius', { userId, serviceRadius }).catch(() => {}); }}
                className="text-[10px] text-emerald-400 font-bold border border-emerald-500/30 px-1.5 py-0.5 rounded-md hover:bg-emerald-500/10 transition"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </div>
          <input
            type="range" min="1" max="50" step="1"
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

      <Section icon="📋" title={t('worker.availableJobs', 'Available Jobs')}>
        {jobs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">{t('worker.noJobsAvailable', 'No jobs available right now')}</p>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 4).map((job, i) => (
              <motion.div key={job.id ?? job._id ?? i} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl" whileHover={{ y: -1 }}>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title ?? t('worker.job', 'Job')}</p>
                  <p className="text-[10px] text-slate-400">{job.company ?? '—'}</p>
                </div>
                <span className="text-xs font-bold text-amber-500 shrink-0 ml-2">{job.price ?? '—'}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ── INCOME tab ─────────────────────────────────────────────────

function IncomeTab({ user, jobs }: { user: UserRecord; jobs: JobItem[] }) {
  const { t }       = useTranslation();
  const wu          = toW(user);
  const totalJobs   = wu?.stats?.totalJobs ?? 0;
  const rating      = wu?.stats?.rating    ?? 5;
  const RATE        = 50;
  const totalEst    = totalJobs * RATE;
  const monthEst    = Math.round(totalEst * 0.2);
  const weekEst     = Math.round(totalEst * 0.05);
  const successRate = totalJobs > 0 ? Math.round((rating / 5) * 100) : 0;

  return (
    <div className="space-y-4">
      <Section icon="💰" title={t('worker.incomeEstimate', 'Income Estimate')}>
        <p className="text-[10px] text-slate-500 mb-3">{t('worker.incomeEstimateNote', '✱ Estimate — will be updated with real data.')}</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={`$${totalEst}`} label={t('worker.income.total', 'Total')}       color="amber" />
          <StatCard value={`$${monthEst}`} label={t('worker.income.thisMonth', 'This month')} color="green" />
          <StatCard value={`$${weekEst}`}  label={t('worker.income.thisWeek', 'This week')}  color="blue"  />
        </div>
      </Section>

      <Section icon="✅" title={t('worker.completedJobs', 'Completed Jobs')}>
        <dl className="space-y-2.5">
          {([
            [t('worker.income.totalCompleted', 'Total completed'), totalJobs],
            [t('worker.income.successRate', 'Success rate'),       `${successRate}%`],
            [t('worker.income.avgRating', 'Average rating'),       `⭐ ${rating.toFixed(1)}`],
            [t('worker.income.complaints', 'Complaints'),          '0'],
          ] as [string, string | number][]).map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-xs font-bold text-white">{val}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section icon="📋" title={t('worker.jobHistory', 'Job History')}>
        {jobs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">{t('worker.noJobHistory', 'No job history yet')}</p>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job, i) => (
              <motion.div key={job.id ?? job._id ?? i} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl" whileHover={{ y: -1 }}>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{job.title ?? t('worker.job', 'Job')}</p>
                  <p className="text-[10px] text-slate-400">{job.time ?? '—'}</p>
                </div>
                <span className="text-xs font-bold text-amber-500 shrink-0 ml-2">{job.price ?? '—'}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      <Section icon="⭐" title={t('worker.ratings', 'Ratings')}>
        <div className="flex flex-col items-center py-4">
          <div className="text-5xl font-black text-amber-400">{rating.toFixed(1)}</div>
          <div className="flex items-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className={`text-xl ${n <= Math.round(rating) ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            {t('worker.ratingsCount', { count: totalJobs, defaultValue: '{{count}} reviews • 0 complaints' })}
          </p>
          {totalJobs === 0 && (
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              {t('worker.ratingsFirstJob', 'Ratings will appear after you complete your first job.')}
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}

// ── TRUST tab ──────────────────────────────────────────────────

function TrustTab({ user }: { user: UserRecord }) {
  const { t }      = useTranslation();
  const navigate   = useNavigate();
  const wu         = toW(user);
  const trustScore = useMemo(() => computeTrustScore(user), [user]);
  const { pct }    = useMemo(() => computeCompleteness(user), [user]);

  const rating   = wu?.stats?.rating    ?? 0;
  const jobs     = wu?.stats?.totalJobs ?? 0;
  const verified = !!wu?.verified;

  const scoreColor = trustScore >= 80 ? '#10b981' : trustScore >= 50 ? '#f59e0b' : '#ef4444';
  const textColor  = trustScore >= 80 ? 'text-emerald-400' : trustScore >= 50 ? 'text-amber-400' : 'text-rose-400';
  const scoreLabel = trustScore >= 80
    ? t('worker.trust.excellent', 'Excellent — You\'re among the best!')
    : trustScore >= 50
    ? t('worker.trust.good', 'Good — Keep improving')
    : t('worker.trust.start', 'Start building your trust');

  const breakdowns = [
    { label: t('worker.jobsDone', 'Jobs'),                     pts: Math.round(Math.min(jobs, 20) * 0.75), max: 15, icon: '✅' },
    { label: t('worker.rating', 'Rating'),                     pts: Math.round((rating / 5) * 20),          max: 20, icon: '⭐' },
    { label: t('worker.profileComplete', 'Profile complete'),  pts: Math.round((pct / 100) * 15),           max: 15, icon: '📊' },
    { label: t('worker.verification', 'Verification'),         pts: verified ? 10 : 0,                      max: 10, icon: '✓'  },
    { label: t('worker.trust.basePoints', 'Base Points'),      pts: 40,                                     max: 40, icon: '🏗️' },
  ];

  const notifications = [
    { icon: '💼', msgKey: 'worker.notif.newJob',         timeKey: 'worker.notif.now' },
    { icon: '⭐', msgKey: 'worker.notif.profileVisible', timeKey: 'worker.notif.fiveMin' },
    { icon: '🔔', msgKey: 'worker.notif.completeProfile',timeKey: 'worker.notif.oneHr' },
  ];

  return (
    <div className="space-y-4">
      <Section>
        <div className="flex flex-col items-center py-4">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="12" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="12" strokeDasharray={`${trustScore * 2.51} 251`} strokeLinecap="round" className="transition-all" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${textColor}`}>{trustScore}</span>
              <span className="text-[10px] text-slate-400">/100</span>
            </div>
          </div>
          <h3 className="text-sm font-bold text-white mt-3">🛡️ {t('worker.trustLevel', 'Trust Level')}</h3>
          <p className="text-[10px] text-slate-400 mt-1 text-center max-w-xs">{scoreLabel}</p>
        </div>
      </Section>

      <Section icon="📊" title={t('worker.trust.pointDetails', 'Point Breakdown')}>
        <div className="space-y-3">
          {breakdowns.map(b => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">{b.icon} {b.label}</span>
                <span className="text-xs font-bold text-amber-400">{b.pts}/{b.max}</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(b.pts / b.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        icon="🔔"
        title={t('notifications.title', 'Notifications')}
        action={
          <button onClick={() => navigate('/notifications')} className="flex items-center gap-1 text-[10px] text-amber-400">
            {t('worker.trust.viewAll', 'View all')} <ChevronRight className="w-3 h-3" />
          </button>
        }
      >
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div key={i} className="flex items-center gap-3 p-2.5 bg-slate-800/50 rounded-xl" whileHover={{ y: -1 }}>
              <span className="text-base shrink-0">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{t(n.msgKey, n.msgKey)}</p>
                <p className="text-[10px] text-slate-400">{t(n.timeKey, n.timeKey)}</p>
              </div>
            </motion.div>
          ))}
          <button onClick={() => navigate('/notifications')} className="w-full mt-1 py-2.5 text-xs text-amber-400 font-medium text-center hover:bg-slate-800 rounded-xl transition">
            {t('worker.trust.viewAllNotif', 'View all notifications →')}
          </button>
        </div>
      </Section>
    </div>
  );
}

// ── Tab meta ───────────────────────────────────────────────────

export const WORKER_TABS = [
  { id: 'overview',  labelKey: 'worker.tab.overview',  icon: '🏠' },
  { id: 'profile',   labelKey: 'worker.tab.profile',   icon: '👤' },
  { id: 'schedule',  labelKey: 'worker.tab.schedule',  icon: '📅' },
  { id: 'income',    labelKey: 'worker.tab.income',    icon: '💰' },
  { id: 'trust',     labelKey: 'worker.tab.trust',     icon: '🛡️' },
] as const;

// ── Main export: tab content router ────────────────────────────

interface WorkerContentProps {
  tab: string;
  user: UserRecord;
  jobs?: JobItem[];
}

export default function WorkerContent({ tab, user, jobs = [] }: WorkerContentProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
        className="space-y-4"
      >
        {tab === 'profile'  && <ProfileTab  user={user} />}
        {tab === 'schedule' && <ScheduleTab user={user} jobs={jobs} />}
        {tab === 'income'   && <IncomeTab   user={user} jobs={jobs} />}
        {tab === 'trust'    && <TrustTab    user={user} />}
        {/* overview tab rete ranje pa Dashboard.tsx; OverviewSupplement ajoute pi wo a */}
      </motion.div>
    </AnimatePresence>
  );
}
