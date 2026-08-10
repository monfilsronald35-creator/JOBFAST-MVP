import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Check,
  UserRound,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BG = '#050B18';

type AccountTypeId = 'personal' | 'business';

interface AccountType {
  id: AccountTypeId;
  label: string;
  headline: string;
  desc1: string;
  desc2: string;
  badges: string[];
  preview: string;
  accent: string;
  glow: string;
  borderIdle: string;
  borderHover: string;
  bgIdle: string;
  bgHover: string;
  icon: LucideIcon;
}

const ACCOUNT_TYPES: AccountType[] = [
  {
    id: 'personal',
    label: 'For Individuals',
    headline: 'Find Jobs',
    desc1: 'Offer Services',
    desc2: 'Build Your Career',
    badges: [
      'AI Matching',
      'Verified Profile',
      'Global Opportunities',
    ],
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
    badges: [
      'Recruit Faster',
      'Company Dashboard',
      'Team Management',
    ],
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
    <section
      className="
        relative h-[236px] overflow-hidden rounded-[32px]
        border border-white/10 bg-white/5
        shadow-[0_24px_80px_rgba(0,0,0,.42)]
        backdrop-blur-[28px]
        md:h-[244px]
      "
    >
      <div className="absolute inset-0">
        <motion.img
          src="/assets/onboarding/account-type-hero.webp"
          alt="JOBFAST account selection"
          className="h-full w-full object-cover opacity-95"
          loading="eager"
          decoding="async"
          initial={{ scale: 1.02 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: 'easeOut' }}
        />

        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(180deg,rgba(5,11,18,0),rgba(5,11,18,0.88))]
          "
        />

        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_20%_20%,rgba(96,165,250,.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(250,204,21,.12),transparent_24%)]
          "
        />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-5 text-center md:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-white/50 md:text-[11px]">
          WELCOME TO JOBFAST
        </p>

        <h1 className="mt-2 text-[24px] font-black tracking-tight text-white md:text-[28px]">
          Choose your account type.
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/70 md:text-[15px]">
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

        <span className="text-[11px] text-white/45">
          16%
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,.6)]" />

        <div className="h-[2px] flex-1 rounded-full bg-white/30" />

        {[0, 1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />

            {i < 4 && (
              <div className="h-[2px] flex-1 rounded-full bg-white/10" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

interface RoleCardProps {
  item: AccountType;
  active: boolean;
  inactive: boolean;
  onSelect: (id: AccountTypeId) => void;
}

function RoleCard({
  item,
  active,
  inactive,
  onSelect,
}: RoleCardProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      role="radio"
      aria-checked={active}
      aria-label={item.label}
      className="
        group relative w-full overflow-hidden rounded-[32px]
        border text-left outline-none
        transition-all duration-300
        focus-visible:ring-2 focus-visible:ring-white/50
      "
      style={{
        opacity: inactive ? 0.72 : 1,
        borderColor: active
          ? item.borderHover
          : item.borderIdle,
        background: active
          ? item.bgHover
          : item.bgIdle,
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        boxShadow: active
          ? `0 0 0 1px ${item.borderHover}, 0 24px 80px rgba(0,0,0,.40)`
          : '0 18px 52px rgba(0,0,0,.22)',
      }}
    >
      <div
        className="
          relative grid gap-4 p-4
          md:grid-cols-[200px_1fr_auto]
          md:items-center md:p-5
        "
      >
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
          <img
            src={item.preview}
            alt={item.label}
            className="
              h-[155px] w-full object-cover
              transition-transform duration-300
              group-hover:scale-105
              md:h-[170px]
            "
            loading="lazy"
            decoding="async"
          />

          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.22))]" />
        </div>

        <div className="min-w-0">
          <div
            className="
              mb-3 inline-flex items-center gap-2 rounded-full
              border border-white/10 bg-white/5
              px-3 py-1 text-[11px] font-bold
              tracking-[0.24em] text-white/70
            "
          >
            <span style={{ color: item.accent }}>
              <Icon size={12} />
            </span>

            {item.label}
          </div>

          <p
            className="text-[22px] font-black tracking-tight md:text-[26px]"
            style={{
              color: active
                ? item.accent
                : '#F8FAFC',
            }}
          >
            {item.headline}
          </p>

          <p className="mt-2 text-sm leading-6 text-white/70 md:text-[15px]">
            {item.desc1}
          </p>

          <p className="text-sm leading-6 text-white/70 md:text-[15px]">
            {item.desc2}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.badges.map((badge) => (
              <span
                key={badge}
                className="
                  rounded-full border border-white/10
                  bg-white/5 px-3 py-1
                  text-[11px] font-medium text-white/75
                "
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end md:self-stretch">
          <div
            className="
              flex h-12 w-12 items-center justify-center
              rounded-full border border-white/10 bg-white/5
              transition-all duration-300
            "
            style={{
              color: active
                ? item.accent
                : '#94A3B8',
            }}
          >
            {active ? (
              <Check size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

interface Step0AccountTypeProps {
  onSelect?: (id: AccountTypeId) => void;
}

export default function Step0_AccountType({
  onSelect,
}: Step0AccountTypeProps) {
  const [selected, setSelected] =
    useState<AccountTypeId | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [initializing, setInitializing] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadExistingAccountType = async () => {
      try {
        setInitializing(true);
        setError(null);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (mounted) {
            setError(
              'Your session has expired. Please sign in again.'
            );
          }

          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (
          mounted &&
          profile?.account_type === 'personal'
        ) {
          setSelected('personal');
        }

        if (
          mounted &&
          profile?.account_type === 'business'
        ) {
          setSelected('business');
        }
      } catch (err) {
        console.error(
          '[JOBFAST] Account type initialization failed:',
          err
        );

        if (mounted) {
          setError(
            'Unable to load your account information. Please try again.'
          );
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    void loadExistingAccountType();

    return () => {
      mounted = false;
    };
  }, []);

  const handleContinue = async () => {
    if (!selected || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'AUTHENTICATION_REQUIRED'
        );
      }

      /*
       * IMPORTANT:
       * Sa mande pou profiles.id egal auth.users.id.
       *
       * Si schema ou itilize yon lòt primary key,
       * chanje "id" anba a selon schema reyèl ou.
       */
      const { error: saveError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            account_type: selected,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );

      if (saveError) {
        throw saveError;
      }

      /*
       * Nou verifye save la anvan nou kontinye.
       * Sa anpeche UI a montre Step 2
       * pandan database la pa gen done an.
       */
      const {
        data: verification,
        error: verificationError,
      } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .maybeSingle();

      if (verificationError) {
        throw verificationError;
      }

      if (
        verification?.account_type !== selected
      ) {
        throw new Error(
          'ACCOUNT_TYPE_SAVE_VERIFICATION_FAILED'
        );
      }

      onSelect?.(selected);
    } catch (err: any) {
      console.error(
        '[JOBFAST] Failed to save account type:',
        err
      );

      let message =
        'We could not save your account type. Please try again.';

      if (
        err?.message ===
        'AUTHENTICATION_REQUIRED'
      ) {
        message =
          'Your session has expired. Please sign in again.';
      }

      if (
        err?.code === '42501'
      ) {
        message =
          'You do not have permission to update your profile.';
      }

      if (
        err?.code === 'PGRST204'
      ) {
        message =
          'The account_type field is missing from your profiles table.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const continueLabel =
    selected === 'personal'
      ? 'Continue as Individual'
      : selected === 'business'
        ? 'Continue as Organization'
        : 'Continue';

  if (initializing) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center"
        style={{
          background: BG,
          color: '#fff',
        }}
      >
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Preparing your JOBFAST account...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full px-4 py-6 md:px-6 md:py-8"
      style={{
        background: BG,
        color: '#fff',
      }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Hero />

        <ProgressDots />

        {error && (
          <div
            role="alert"
            className="
              flex items-start gap-3 rounded-2xl
              border border-red-500/20
              bg-red-500/10 p-4
              text-sm text-red-300
            "
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        <div
          className="space-y-4"
          role="radiogroup"
          aria-label="Choose your JOBFAST account type"
        >
          {ACCOUNT_TYPES.map((type) => (
            <RoleCard
              key={type.id}
              item={type}
              active={selected === type.id}
              inactive={
                Boolean(selected) &&
                selected !== type.id
              }
              onSelect={setSelected}
            />
          ))}
        </div>

        <button
          type="button"
          disabled={!selected || loading}
          onClick={handleContinue}
          className="
            group mt-2 flex w-full items-center
            justify-center gap-2 rounded-full
            bg-white px-5 py-4
            text-sm font-black text-slate-950
            shadow-[0_18px_50px_rgba(255,255,255,.12)]
            transition-all
            active:scale-[0.99]
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          {loading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />
              Saving...
            </>
          ) : (
            <>
              {continueLabel}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="pb-2 text-center text-xs text-white/45">
          You can change your account type later.
        </p>
      </div>
    </div>
  );
}