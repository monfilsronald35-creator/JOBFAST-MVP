import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  UserRound,
  Wrench,
  Laptop2,
  ShieldCheck,
  Sparkles,
  BriefcaseBusiness,
  Hammer,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// IMPORTANT:
// Use the existing shared Supabase client in your JOBFAST project.
// Do NOT create a new Supabase client inside this component.
import { supabase } from '@/lib/supabase';

const BG = '#050B18';

const CURRENT_STEP = 2;
const TOTAL_STEPS = 6;

/**
 * ---------------------------------------------------------------------------
 * DOMAIN TYPES
 * ---------------------------------------------------------------------------
 */

const PERSONAL_ROLE_IDS = [
  'worker',
  'service_provider',
  'freelancer',
] as const;

type PersonalRoleId = (typeof PERSONAL_ROLE_IDS)[number];

function isPersonalRoleId(
  value: unknown,
): value is PersonalRoleId {
  return (
    typeof value === 'string' &&
    (PERSONAL_ROLE_IDS as readonly string[]).includes(value)
  );
}

/**
 * ---------------------------------------------------------------------------
 * I18N CONTRACT
 * ---------------------------------------------------------------------------
 *
 * The component does not depend on a specific i18n library.
 *
 * Your actual JOBFAST translation system can inject:
 *
 *   t(key, fallback)
 *
 * Example with i18next:
 *
 *   t={(key, fallback) => i18n.t(key, { defaultValue: fallback })}
 *
 * This keeps the component independent from the translation engine.
 */

export type TranslationFn = (
  key: string,
  fallback: string,
) => string;

const defaultT: TranslationFn = (
  _key,
  fallback,
) => fallback;

/**
 * ---------------------------------------------------------------------------
 * ROLE CONFIGURATION
 * ---------------------------------------------------------------------------
 */

interface PersonalRoleConfig {
  id: PersonalRoleId;

  labelKey: string;
  headlineKey: string;
  desc1Key: string;
  desc2Key: string;

  badgeKeys: string[];
  badgeFallbacks: string[];

  labelFallback: string;
  headlineFallback: string;
  desc1Fallback: string;
  desc2Fallback: string;

  preview: string;

  accent: string;
  glow: string;
  borderIdle: string;
  borderHover: string;
  bgIdle: string;
  bgHover: string;

  icon: LucideIcon;
  badgeIcons: LucideIcon[];
}

const PERSONAL_ROLES: readonly PersonalRoleConfig[] = [
  {
    id: 'worker',

    labelKey: 'onboarding.roles.worker.label',
    headlineKey: 'onboarding.roles.worker.headline',
    desc1Key: 'onboarding.roles.worker.desc1',
    desc2Key: 'onboarding.roles.worker.desc2',

    badgeKeys: [
      'onboarding.roles.worker.badges.verifiedProfile',
      'onboarding.roles.worker.badges.fastApplications',
      'onboarding.roles.worker.badges.globalOpportunities',
    ],

    badgeFallbacks: [
      'Verified Profile',
      'Fast Applications',
      'Global Opportunities',
    ],

    labelFallback: 'For Job Seekers',
    headlineFallback: 'Find Work',
    desc1Fallback: 'Apply Fast',
    desc2Fallback: 'Get Hired Globally',

    preview: '/assets/onboarding/worker-8k.webp',

    accent: '#FACC15',
    glow: 'rgba(250,204,21,0.16)',
    borderIdle: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(250,204,21,0.42)',
    bgIdle: 'rgba(20,30,52,.56)',
    bgHover: 'rgba(20,30,52,.72)',

    icon: UserRound,
    badgeIcons: [
      ShieldCheck,
      Sparkles,
      BriefcaseBusiness,
    ],
  },

  {
    id: 'service_provider',

    labelKey: 'onboarding.roles.serviceProvider.label',
    headlineKey: 'onboarding.roles.serviceProvider.headline',
    desc1Key: 'onboarding.roles.serviceProvider.desc1',
    desc2Key: 'onboarding.roles.serviceProvider.desc2',

    badgeKeys: [
      'onboarding.roles.serviceProvider.badges.trustedClients',
      'onboarding.roles.serviceProvider.badges.flexibleWork',
      'onboarding.roles.serviceProvider.badges.secureRequests',
    ],

    badgeFallbacks: [
      'Trusted Clients',
      'Flexible Work',
      'Secure Requests',
    ],

    labelFallback: 'For Service Providers',
    headlineFallback: 'Offer Services',
    desc1Fallback: 'Show Your Skills',
    desc2Fallback: 'Work With Trusted Clients',

    preview:
      '/assets/onboarding/service-provider-8k.webp',

    accent: '#34D399',
    glow: 'rgba(52,211,153,0.16)',
    borderIdle: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(52,211,153,0.42)',
    bgIdle: 'rgba(20,30,52,.56)',
    bgHover: 'rgba(20,30,52,.72)',

    icon: Wrench,
    badgeIcons: [
      ShieldCheck,
      Sparkles,
      Hammer,
    ],
  },

  {
    id: 'freelancer',

    labelKey: 'onboarding.roles.freelancer.label',
    headlineKey: 'onboarding.roles.freelancer.headline',
    desc1Key: 'onboarding.roles.freelancer.desc1',
    desc2Key: 'onboarding.roles.freelancer.desc2',

    badgeKeys: [
      'onboarding.roles.freelancer.badges.remoteProjects',
      'onboarding.roles.freelancer.badges.professionalProfile',
      'onboarding.roles.freelancer.badges.growNetwork',
    ],

    badgeFallbacks: [
      'Remote Projects',
      'Professional Profile',
      'Grow Network',
    ],

    labelFallback: 'For Freelancers',
    headlineFallback: 'Build Your Brand',
    desc1Fallback: 'Create Offers',
    desc2Fallback: 'Grow Your Network',

    preview:
      '/assets/onboarding/freelancer-8k.webp',

    accent: '#A78BFA',
    glow: 'rgba(167,139,250,0.16)',
    borderIdle: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(167,139,250,0.42)',
    bgIdle: 'rgba(20,30,52,.56)',
    bgHover: 'rgba(20,30,52,.72)',

    icon: Laptop2,
    badgeIcons: [
      Sparkles,
      ShieldCheck,
      BriefcaseBusiness,
    ],
  },
];

/**
 * ---------------------------------------------------------------------------
 * ERROR NORMALIZATION
 * ---------------------------------------------------------------------------
 */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/**
 * ---------------------------------------------------------------------------
 * HERO
 * ---------------------------------------------------------------------------
 */

interface HeroProps {
  t: TranslationFn;
}

const Hero = memo(function Hero({
  t,
}: HeroProps) {
  return (
    <section
      aria-labelledby="personal-role-title"
      className="
        relative h-[236px] overflow-hidden
        rounded-[32px] border border-white/10
        bg-white/5
        shadow-[0_24px_80px_rgba(0,0,0,.42)]
        backdrop-blur-[28px]
        md:h-[244px]
      "
    >
      <div className="absolute inset-0">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0"
          animate={{
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            background:
              'radial-gradient(circle at top, #1e293b, transparent 40%)',
          }}
        />

        <motion.img
          src="/assets/onboarding/personal-role-hero.webp"
          alt=""
          aria-hidden="true"
          className="
            h-full w-full object-cover
            opacity-95
          "
          loading="eager"
          decoding="async"
          initial={{ scale: 1.02 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 12,
            ease: 'easeOut',
          }}
        />

        <div
          aria-hidden="true"
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_35%),linear-gradient(180deg,rgba(5,11,18,0.00),rgba(5,11,18,0.88))]
          "
        />
      </div>

      <div
        className="
          relative flex h-full flex-col
          items-center justify-center
          px-5 text-center md:px-8
        "
      >
        <p
          className="
            text-[10px] font-bold uppercase
            tracking-[0.34em] text-white/50
            md:text-[11px]
          "
        >
          {t(
            'onboarding.personalRole.eyebrow',
            'WELCOME TO THE FUTURE OF WORK',
          )}
        </p>

        <h1
          id="personal-role-title"
          className="
            mt-2 text-[24px] font-black
            tracking-tight text-white
            md:text-[28px]
          "
        >
          {t(
            'onboarding.personalRole.title',
            'Build your future with JOBFAST',
          )}
        </h1>

        <p
          className="
            mx-auto mt-3 max-w-2xl
            text-sm leading-6 text-white/72
            md:text-[15px]
          "
        >
          {t(
            'onboarding.personalRole.subtitle',
            'Connect. Work. Grow.',
          )}
        </p>
      </div>
    </section>
  );
});

/**
 * ---------------------------------------------------------------------------
 * PROGRESS
 * ---------------------------------------------------------------------------
 */

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
  t: TranslationFn;
}

const ProgressDots = memo(function ProgressDots({
  currentStep,
  totalSteps,
  t,
}: ProgressDotsProps) {
  const safeTotal = Math.max(1, totalSteps);

  const safeStep = Math.min(
    Math.max(1, currentStep),
    safeTotal,
  );

  const percentage = Math.round(
    (safeStep / safeTotal) * 100,
  );

  return (
    <div
      className="
        rounded-[24px]
        border border-white/10
        bg-white/5
        px-5 py-4
        backdrop-blur-2xl
      "
      aria-label={t(
        'onboarding.progress.label',
        `Step ${safeStep} of ${safeTotal}`,
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className="
            text-[11px] font-bold uppercase
            tracking-[0.32em] text-white/55
          "
        >
          {t(
            'onboarding.progress.step',
            `Step ${safeStep} of ${safeTotal}`,
          )}
        </p>

        <span className="text-[11px] text-white/45">
          {percentage}%
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {Array.from({
          length: safeTotal,
        }).map((_, index) => {
          const step = index + 1;

          const completed =
            step <= safeStep;

          return (
            <React.Fragment key={step}>
              <span
                aria-hidden="true"
                className={[
                  'h-2.5 w-2.5 rounded-full transition-all',
                  completed
                    ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,.6)]'
                    : 'bg-white/20',
                ].join(' ')}
              />

              {step < safeTotal && (
                <div
                  aria-hidden="true"
                  className={[
                    'h-[2px] flex-1 rounded-full transition-all',
                    step < safeStep
                      ? 'bg-white/40'
                      : 'bg-white/10',
                  ].join(' ')}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});

/**
 * ---------------------------------------------------------------------------
 * ROLE CARD
 * ---------------------------------------------------------------------------
 */

interface RoleCardProps {
  item: PersonalRoleConfig;
  active: boolean;
  inactive: boolean;
  disabled: boolean;
  t: TranslationFn;
  onSelect: (roleId: PersonalRoleId) => void;
}

const RoleCard = memo(function RoleCard({
  item,
  active,
  inactive,
  disabled,
  t,
  onSelect,
}: RoleCardProps) {
  const Icon = item.icon;

  const label = t(
    item.labelKey,
    item.labelFallback,
  );

  const headline = t(
    item.headlineKey,
    item.headlineFallback,
  );

  const desc1 = t(
    item.desc1Key,
    item.desc1Fallback,
  );

  const desc2 = t(
    item.desc2Key,
    item.desc2Fallback,
  );

  const handleClick = () => {
    if (disabled) return;
    onSelect(item.id);
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      aria-disabled={disabled}
      onClick={handleClick}
      whileHover={
        disabled
          ? undefined
          : {
              y: -8,
              scale: 1.025,
              rotateX: 2,
            }
      }
      whileTap={
        disabled
          ? undefined
          : {
              scale: 0.98,
            }
      }
      animate={{
        opacity: inactive ? 0.55 : 1,
        scale: active ? 1.03 : 1,
      }}
      className="
        group relative w-full overflow-hidden
        rounded-[32px] border text-left
        outline-none
        transition-opacity
        focus-visible:ring-2
        focus-visible:ring-white/80
        disabled:cursor-not-allowed
      "
      style={{
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
          
        transformStyle: 'preserve-3d',
        perspective: '1200px',
      }}
    >
      {/* Glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          opacity-0 transition-opacity duration-300
          group-hover:opacity-100
        "
        style={{
          background: `radial-gradient(
            circle at 30% 20%,
            ${item.glow},
            transparent 38%
          )`,
        }}
      />

      <div
        className="
          relative grid gap-4 p-4
          md:grid-cols-[220px_1fr_auto]
          md:items-center md:p-5
        "
      >
        {/* IMAGE */}
        <div
          className="
            relative overflow-hidden
            rounded-[24px]
            border border-white/10
            bg-black/30
          "
        >
          <motion.img
            src={item.preview}
            alt=""
            aria-hidden="true"
            className="
              h-[180px] w-full object-cover
              md:h-[220px]
            "
            loading="lazy"
            sizes="
              (max-width: 768px) 100vw,
              600px
            "
            decoding="async"
            onError={(event) => {
              const image =
                event.currentTarget;

              // Do not depend on a second fallback asset.
              image.style.display = 'none';
            }}
            whileHover={
              disabled
                ? undefined
                : {
                    scale: 1.08,
                    y: -4,
                    rotate: 0.4,
                  }
            }
            transition={{
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* Visual fallback if image fails */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute inset-0
              flex items-center justify-center
              bg-[radial-gradient(circle_at_center,rgba(255,255,255,.10),transparent_55%)]
            "
          >
            <Icon
              size={46}
              strokeWidth={1.5}
              style={{
                color: item.accent,
              }}
            />
          </div>

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute inset-0
              bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.25))]
            "
          />
        </div>

        {/* CONTENT */}
        <div className="min-w-0">
          <div
            className="
              mb-3 inline-flex items-center
              gap-2 rounded-full
              border border-white/10
              bg-white/5 px-3 py-1
              text-[11px] font-bold
              tracking-[0.24em]
              text-white/70
            "
          >
            <motion.span
              animate={
                active
                  ? { rotate: 5 }
                  : { rotate: 0 }
              }
              transition={{
                type: 'spring',
                stiffness: 240,
                damping: 18,
              }}
            >
              <Icon
                size={12}
                style={{
                  color: item.accent,
                }}
              />
            </motion.span>

            {label}
          </div>

          <p
            className="
              text-[22px] font-black
              tracking-tight
              md:text-[26px]
            "
            style={{
              color: active
                ? item.accent
                : '#F8FAFC',
            }}
          >
            {headline}
          </p>

          <p
            className="
              mt-2 text-sm leading-6
              text-white/72
              md:text-[15px]
            "
          >
            {desc1}
          </p>

          <p
            className="
              text-sm leading-6
              text-white/72
              md:text-[15px]
            "
          >
            {desc2}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.badgeKeys.map(
              (badgeKey, index) => {
                const BadgeIcon =
                  item.badgeIcons[index] ??
                  ShieldCheck;

                const badge = t(
                  badgeKey,
                  item.badgeFallbacks[index] ??
                    '',
                );

                return (
                  <span
                    key={badgeKey}
                    className="
                      inline-flex items-center
                      gap-1.5 rounded-full
                      border border-white/10
                      bg-white/5
                      px-3 py-1
                      text-[11px]
                      font-medium
                      text-white/75
                    "
                  >
                    <BadgeIcon
                      size={12}
                      style={{
                        color: item.accent,
                      }}
                    />

                    {badge}
                  </span>
                );
              },
            )}
          </div>
        </div>

        {/* STATUS */}
        <div className="flex items-center justify-end md:self-stretch">
          <motion.div
            initial={false}
            animate={{
              scale: active ? 1 : 1,
              opacity: active ? 1 : 0.72,
            }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 22,
            }}
            className="
              flex h-12 w-12
              items-center justify-center
              rounded-full
              border border-white/10
              bg-white/5
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
          </motion.div>
        </div>
      </div>

      {/* Active border */}
      <motion.div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          rounded-[32px]
        "
        animate={{
          opacity: active ? 1 : 0.9,
        }}
        style={{
          boxShadow: active
            ? `
              inset 0 0 0 1px ${item.borderHover},
              inset 0 0 55px ${item.glow}
            `
            : 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      />
    </motion.button>
  );
});

/**
 * ---------------------------------------------------------------------------
 * MAIN COMPONENT
 * ---------------------------------------------------------------------------
 */

export interface Step0bPersonalRoleProps {
  onSelect?: (
    roleId: PersonalRoleId,
  ) => void;

  /**
   * Translation function supplied by JOBFAST's
   * global internationalization layer.
   */
  t?: TranslationFn;

  /**
   * Allows the parent onboarding engine to
   * control which step is currently displayed.
   */
  currentStep?: number;

  totalSteps?: number;
}

export default function Step0bPersonalRole({
  onSelect,
  t = defaultT,
  currentStep = CURRENT_STEP,
  totalSteps = TOTAL_STEPS,
}: Step0bPersonalRoleProps) {
  const [selected, setSelected] =
    useState<PersonalRoleId | null>(null);

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Prevents a profile-loading request from
   * overwriting a selection made by the user.
   */
  const [hasUserSelected, setHasUserSelected] =
    useState(false);

  /**
   * -------------------------------------------------------------------------
   * LOAD EXISTING PROFILE
   * -------------------------------------------------------------------------
   */

  const loadProfile = useCallback(
    async () => {
      setLoadingProfile(true);
      setError(null);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error(
            t(
              'auth.sessionExpired',
              'Your session has expired. Please sign in again.',
            ),
          );
        }

        const {
          data,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select(
            'account_type, personal_role',
          )
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        /**
         * This step belongs only to personal accounts.
         */
        if (
          data?.account_type &&
          data.account_type !== 'personal'
        ) {
          throw new Error(
            t(
              'onboarding.personalRole.invalidAccountType',
              'This onboarding step is only available for personal accounts.',
            ),
          );
        }

        /**
         * Never trust arbitrary database values
         * directly inside UI state.
         */
        if (
          isPersonalRoleId(
            data?.personal_role,
          )
        ) {
          setSelected((current) =>
            hasUserSelected
              ? current
              : data.personal_role,
          );
        }
      } catch (err) {
        console.error(
          '[JOBFAST][PersonalRole][LoadProfile]',
          err,
        );

        setError(
          getErrorMessage(
            err,
            t(
              'onboarding.personalRole.loadError',
              'We could not load your profile. Please try again.',
            ),
          ),
        );
      } finally {
        setLoadingProfile(false);
      }
    },
    [hasUserSelected, t],
  );

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  /**
   * -------------------------------------------------------------------------
   * ROLE SELECTION
   * -------------------------------------------------------------------------
   */

  const handleSelect = useCallback(
    (roleId: PersonalRoleId) => {
      if (
        loading ||
        loadingProfile
      ) {
        return;
      }

      setError(null);
      setHasUserSelected(true);
      setSelected(roleId);
    },
    [loading, loadingProfile],
  );

  /**
   * -------------------------------------------------------------------------
   * CONTINUE
   * -------------------------------------------------------------------------
   */

  const handleContinue =
    useCallback(async () => {
      if (
        !selected ||
        loading ||
        loadingProfile
      ) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        /**
         * Always obtain the authenticated
         * Supabase user immediately before
         * writing the profile.
         */
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          throw new Error(
            t(
              'auth.sessionExpired',
              'Your session has expired. Please sign in again.',
            ),
          );
        }

        /**
         * Defense-in-depth:
         * make sure selected value is one of
         * the roles allowed by this screen.
         */
        if (!isPersonalRoleId(selected)) {
          throw new Error(
            t(
              'onboarding.personalRole.invalidSelection',
              'Invalid role selection.',
            ),
          );
        }

        /**
         * Verify the account is still personal.
         *
         * This prevents accidentally writing
         * personal_role to a business account.
         */
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
          profile?.account_type &&
          profile.account_type !== 'personal'
        ) {
          throw new Error(
            t(
              'onboarding.personalRole.invalidAccountType',
              'This role is only available for personal accounts.',
            ),
          );
        }

        /**
         * Persist ONLY the domain value.
         *
         * Never send:
         * accent
         * glow
         * preview
         * icons
         * UI metadata
         */
        const {
          error: updateError,
        } = await supabase
          .from('profiles')
          .update({
            personal_role: selected,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        /**
         * Navigation/domain event.
         *
         * Parent receives ONLY the role ID.
         */
        onSelect?.(selected);
      } catch (err) {
        console.error(
          '[JOBFAST][PersonalRole][Save]',
          err,
        );

        setError(
          getErrorMessage(
            err,
            t(
              'onboarding.personalRole.saveError',
              'Unable to save your selection. Please try again.',
            ),
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      selected,
      loading,
      loadingProfile,
      onSelect,
      t,
    ]);

  /**
   * -------------------------------------------------------------------------
   * DERIVED UI
   * -------------------------------------------------------------------------
   */

  const continueLabel = useMemo(() => {
    switch (selected) {
      case 'worker':
        return t(
          'onboarding.roles.worker.continue',
          'Continue as Job Seeker',
        );

      case 'service_provider':
        return t(
          'onboarding.roles.serviceProvider.continue',
          'Continue as Service Provider',
        );

      case 'freelancer':
        return t(
          'onboarding.roles.freelancer.continue',
          'Continue as Freelancer',
        );

      default:
        return t(
          'common.continue',
          'Continue',
        );
    }
  }, [selected, t]);

  /**
   * -------------------------------------------------------------------------
   * RENDER
   * -------------------------------------------------------------------------
   */

  return (
    <div
      className="
        relative min-h-screen w-full
        overflow-hidden
        px-4 py-6
        md:px-6 md:py-8
      "
      style={{
        background: BG,
        color: '#fff',
      }}
    >
      {/* Background */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(circle at top, #1e293b, transparent 40%)',
        }}
      />

      <div
        className="
          relative mx-auto w-full
          max-w-3xl space-y-5
        "
      >
        {/* HERO */}
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
        >
          <Hero t={t} />
        </motion.div>

        {/* PROGRESS */}
        <motion.div
          initial={{
            opacity: 0,
            y: 24,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.08,
            ease: 'easeOut',
          }}
            >
          <ProgressDots
            currentStep={currentStep}
            totalSteps={totalSteps}
            t={t}
          />
        </motion.div>

        {/* ERROR */}
        {error && (
          <motion.div
            role="alert"
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              flex items-start gap-3
              rounded-2xl
              border border-red-500/30
              bg-red-500/10
              p-4
              text-sm text-red-300
            "
          >
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {t(
                  'common.somethingWentWrong',
                  'Something went wrong',
                )}
              </p>

              <p className="mt-1 text-red-300/80">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadProfile()
                }
                disabled={loadingProfile}
                className="
                  mt-3 inline-flex
                  items-center gap-2
                  rounded-full
                  border border-red-400/30
                  bg-red-400/10
                  px-3 py-1.5
                  text-xs font-bold
                  text-red-200
                  transition
                  hover:bg-red-400/20
                  disabled:opacity-50
                "
              >
                <RefreshCw
                  size={13}
                  className={
                    loadingProfile
                      ? 'animate-spin'
                      : ''
                  }
                />

                {t(
                  'common.retry',
                  'Retry',
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* PROFILE LOADING */}
        {loadingProfile ? (
          <div
            className="
              flex min-h-[280px]
              items-center justify-center
              rounded-[32px]
              border border-white/10
              bg-white/5
              backdrop-blur-2xl
            "
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2
                size={28}
                className="animate-spin text-white/70"
              />

              <span className="text-sm text-white/50">
                {t(
                  'onboarding.personalRole.loading',
                  'Loading your profile...',
                )}
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* ROLES */}
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.14,
                ease: 'easeOut',
              }}
              className="space-y-4"
            >
              {PERSONAL_ROLES.map(
                (role, index) => (
                  <motion.div
                    key={role.id}
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.45,
                      delay:
                        0.12 +
                        index * 0.08,
                      ease: 'easeOut',
                    }}
                  >
                    <RoleCard
                      item={role}
                      active={
                        selected === role.id
                      }
                      inactive={
                        !!selected &&
                        selected !== role.id
                      }
                      disabled={
                        loading ||
                        loadingProfile
                      }
                      t={t}
                      onSelect={
                        handleSelect
                      }
                    />
                  </motion.div>
                ),
              )}
            </motion.div>

            {/* CONTINUE */}
            {selected ? (
              <motion.button
                type="button"
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                onClick={handleContinue}
                disabled={loading}
                aria-busy={loading}
                className="
                  group mt-2
                  flex w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-white
                  px-5 py-4
                  text-sm font-black
                  text-slate-950
                  shadow-[0_18px_50px_rgba(255,255,255,.12)]
                  transition
                  active:scale-[0.99]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    {t(
                      'common.saving',
                      'Saving...',
                    )}
                  </>
                ) : (
                  <>
                    {continueLabel}

                    <motion.span
                      animate={{ x: 3 }}
                      transition={{
                        repeat: Infinity,
                        repeatType: 'reverse',
                        duration: 0.8,
                      }}
                    >
                      <ArrowRight
                        size={18}
                      />
                    </motion.span>
                  </>
                )}
              </motion.button>
            ) : (
              <button
                type="button"
                disabled
                className="
                  flex w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  border border-white/10
                  bg-white/5
                  px-5 py-4
                  text-sm font-black
                  text-white/35
                "
              >
                {t(
                  'common.continue',
                  'Continue',
                )}

                <ArrowRight size={18} />
              </button>
            )}
          </>
        )}

        <p
          className="
            pb-2 text-center
            text-xs text-white/45
          "
        >
          {t(
            'onboarding.personalRole.changeLater',
            'You can always change your role later.',
          )}
        </p>
      </div>
    </div>
  );
}