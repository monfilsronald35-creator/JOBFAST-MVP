import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, Check, UserRound } from 'lucide-react';

const BG = '#050B18';

const ACCOUNT_TYPES = [
  {
    id: 'personal',
    label: 'For Individuals',
    headline: 'Find Jobs',
    desc1: 'Offer Services',
    desc2: 'Build Your Career',
    badges: ['AI Matching', 'Verified Profile', 'Global Opportunities'],
    preview: '/assets/onboarding/personal-8k.webp',
    accent: '#FACC15',
    glow: 'rgba(250,204,21,0.16)',
    borderIdle: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(250,204,21,0.42)',
    bgIdle: 'rgba(20,30,52,.56)',
    bgHover: 'rgba(20,30,52,.72)',
    icon: UserRound,
  },
  {
    id: 'business',
    label: 'For Organizations',
    headline: 'Hire Talent',
    desc1: 'Recruit Teams',
    desc2: 'Manage Your Company',
    badges: ['Recruit Faster', 'Company Dashboard', 'Team Management'],
    preview: '/assets/onboarding/business-8k.webp',
    accent: '#60A5FA',
    glow: 'rgba(96,165,250,0.16)',
    borderIdle: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(96,165,250,0.42)',
    bgIdle: 'rgba(20,30,52,.56)',
    bgHover: 'rgba(20,30,52,.72)',
    icon: Building2,
  },
];

function Hero() {
  return (
    <section className="relative h-[236px] overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,.42)] backdrop-blur-[28px] md:h-[244px]">
      <div className="absolute inset-0">
        <motion.img
          src="/assets/onboarding/account-type-hero.webp"
          alt="JOBFAST hero"
          className="h-full w-full object-cover opacity-95"
          loading="eager"
          decoding="async"
          initial={{ scale: 1.02 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(180deg,rgba(5,11,18,0.00),rgba(5,11,18,0.88))]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,.12)_40%,transparent_60%)] opacity-35 animate-[shine_6s_linear_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(250,204,21,.12),transparent_24%)]" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-5 text-center md:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/50 md:text-[11px]">
          WELCOME TO JOBFAST
        </p>
        <h1 className="mt-2 text-[24px] font-black tracking-tight text-white md:text-[28px]">
          Choose your account type.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/72 md:text-[15px]">
          Select the experience that best matches how you&apos;ll use JOBFAST.
        </p>
      </div>
    </section>
  );
}

function ProgressDots() {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/55">
          Step 1 of 6
        </p>
        <span className="text-[11px] text-white/45">16%</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,.6)]" />
        <div className="h-[2px] flex-1 rounded-full bg-white/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <div className="h-[2px] flex-1 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <div className="h-[2px] flex-1 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <div className="h-[2px] flex-1 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        <div className="h-[2px] flex-1 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function RoleCard({ item, active, inactive, onSelect }) {
  const Icon = item.icon;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(item.id)}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      className="group relative w-full overflow-hidden rounded-[32px] border text-left outline-none"
      style={{
        opacity: inactive ? 0.92 : 1,
        borderColor: active ? item.borderHover : item.borderIdle,
        background: active ? item.bgHover : item.bgIdle,
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        boxShadow: active
          ? `0 0 0 1px ${item.borderHover}, 0 24px 80px rgba(0,0,0,.40)`
          : '0 18px 52px rgba(0,0,0,.22)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at var(--x,30%) var(--y,20%), ${item.glow}, transparent 38%)` }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
        style={{ background: 'linear-gradient(115deg, transparent 33%, rgba(255,255,255,.10) 50%, transparent 67%)' }}
      />

      <div className={`relative grid gap-4 p-4 md:grid-cols-[200px_1fr_auto] md:items-center md:p-5 ${active ? 'translate-y-[-3px]' : ''}`}>
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
          <motion.img
            src={item.preview}
            alt={item.label}
            className="h-[155px] w-full object-cover md:h-[170px]"
            loading="lazy"
            decoding="async"
            whileHover={{ scale: 1.06, rotate: 0.4 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.22))]" />
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.14),transparent_30%)]" />
        </div>

        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold tracking-[0.24em] text-white/70">
            <motion.span animate={active ? { rotate: 5 } : { rotate: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }}>
              <Icon size={12} style={{ color: item.accent }} />
            </motion.span>
            {item.label}
          </div>

          <p className="text-[22px] font-black tracking-tight text-white md:text-[26px]" style={{ color: active ? item.accent : '#F8FAFC' }}>
            {item.headline}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/72 md:text-[15px]">{item.desc1}</p>
          <p className="text-sm leading-6 text-white/72 md:text-[15px]">{item.desc2}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/75"
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end md:self-stretch">
          <motion.div
            initial={false}
            animate={active ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 0.72 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5"
            style={{ color: active ? item.accent : '#94A3B8' }}
          >
            {active ? <Check size={18} /> : <ArrowRight size={18} />}
          </motion.div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[32px]"
        animate={active ? { opacity: 1 } : { opacity: 0.9 }}
        style={{
          boxShadow: active
            ? `inset 0 0 0 1px ${item.borderHover}, inset 0 0 55px ${item.glow}`
            : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      />
    </motion.button>
  );
}

export default function Step0_AccountType({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const active = useMemo(() => ACCOUNT_TYPES.find((x) => x.id === selected) || null, [selected]);

  const handleSelect = (id) => {
    setSelected(id);
  };

  const continueLabel =
    selected === 'personal'
      ? 'Continue as Individual'
      : selected === 'business'
        ? 'Continue as Organization'
        : 'Continue';

  return (
    <div className="min-h-screen w-full px-4 py-6 md:px-6 md:py-8" style={{ background: BG, color: '#fff' }}>
      <style>{`@keyframes shine { 0% { transform: translateX(-60%); } 100% { transform: translateX(160%); } }`}</style>

      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Hero />
        <ProgressDots />

        <div className="space-y-4">
          {ACCOUNT_TYPES.map((type) => (
            <RoleCard
              key={type.id}
              item={type}
              active={selected === type.id}
              inactive={selected && selected !== type.id}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {selected ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect?.(selected)}
            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-[0_18px_50px_rgba(255,255,255,.12)] transition active:scale-[0.99]"
          >
            {continueLabel}
            <motion.span
              animate={{ x: 3 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.8 }}
            >
              <ArrowRight size={18} />
            </motion.span>
          </motion.button>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white/35"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        )}

        <p className="pb-2 text-center text-xs text-white/45">
          Ou ka toujou chanje kalite kont ou pita.
        </p>
      </div>
    </div>
  );
}
