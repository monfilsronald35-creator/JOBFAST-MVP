import React, { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getRoleConfig } from '../../config/roleConfig';

type TFunction = (key: string, opts?: Record<string, unknown>) => string;

interface RoleConfig {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  description: string;
}

function DefaultIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 animate-pulse">
      <div className="mb-3 h-8 w-8 rounded-full bg-[var(--c-skeleton)]" />
      <div className="mb-2 h-4 w-28 rounded bg-[var(--c-skeleton)]" />
      <div className="h-3 w-full rounded bg-[var(--c-skeleton)]/80" />
      <div className="mt-2 h-3 w-5/6 rounded bg-[var(--c-skeleton)]/80" />
    </div>
  );
}

function EmptyState({ t }: { t: TFunction }) {
  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/80 p-8 text-center">
      <p className="text-sm font-semibold text-[var(--c-text)]">
        {t('registration.no_roles', { defaultValue: 'Pa gen kategori disponib' })}
      </p>
      <p className="mt-1 text-xs text-[var(--c-muted)]">
        {t('registration.try_again_later', { defaultValue: 'Tanpri rekòmanse oswa eseye pita.' })}
      </p>
    </div>
  );
}

interface Analytics { track?: (event: string, data: Record<string, unknown>) => void }

interface RoleCardProps {
  role:        string;
  config:      RoleConfig;
  selected?:   string;
  onSelect:    (role: string) => void;
  onKeyDown:   (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onFocusRole: (e: React.FocusEvent<HTMLButtonElement>) => void;
  t:           TFunction;
  analytics?:  Analytics;
  iconProps?:  Record<string, unknown>;
}

const RoleCard = memo(function RoleCard({
  role, config, selected, onSelect, onKeyDown, onFocusRole, t, analytics, iconProps,
}: RoleCardProps) {
  const isSelected = selected === role;
  const Icon = config.icon ?? DefaultIcon;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>): void => {
      const r = e.currentTarget.dataset['role'];
      if (r) {
        onSelect(r);
        analytics?.track?.('registration_role_selected', { role: r });
      }
    },
    [onSelect, analytics],
  );

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={isSelected}
      data-role={role}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      onFocus={onFocusRole}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        rounded-xl border-2 p-5 text-left outline-none transition
        focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0
        ${isSelected
          ? 'border-[var(--c-primary)] bg-[var(--c-primary)]/10 shadow-[0_0_0_1px_rgba(250,204,21,.2)]'
          : 'border-[var(--c-border)] bg-[var(--c-surface)]/70 hover:border-[var(--c-border-strong)]'}
      `}
      style={{
        backgroundColor: isSelected ? 'color-mix(in srgb, var(--c-primary) 10%, var(--c-surface))' : undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Icon className="h-8 w-8 text-amber-400" aria-hidden="true" {...(iconProps as React.SVGProps<SVGSVGElement>)} />
        {isSelected ? (
          <span className="rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold text-amber-300">
            {t('registration.selected', { defaultValue: 'Chwazi' })}
          </span>
        ) : null}
      </div>

      <h3 className="text-sm font-bold text-[var(--c-text)]">
        {t(config.label)}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[var(--c-muted)]">
        {t(config.description)}
      </p>
    </motion.button>
  );
});

interface Theme {
  primary?:     string;
  surface?:     string;
  text?:        string;
  muted?:       string;
  border?:      string;
  borderStrong?: string;
  skeleton?:    string;
}

interface Step1Props {
  selected?:   string;
  onSelect:    (role: string) => void;
  roles?:      string[];
  t:           TFunction;
  loading?:    boolean;
  analytics?:  Analytics;
  theme?:      Theme;
}

export default memo(function Step1_CategorySelect({
  selected,
  onSelect,
  roles = [],
  t,
  loading = false,
  analytics,
  theme = {},
}: Step1Props) {
  const roleConfigs = useMemo(
    () =>
      (roles ?? [])
        .map((role) => {
          const config = getRoleConfig(role) as RoleConfig | null | undefined;
          return config ? { role, config } : null;
        })
        .filter((x): x is { role: string; config: RoleConfig } => x !== null),
    [roles],
  );

  const selectedIndex = useMemo(
    () => Math.max(roleConfigs.findIndex((x) => x.role === selected), 0),
    [roleConfigs, selected],
  );

  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = useCallback(
    (role: string): void => { if (role) onSelect(role); },
    [onSelect],
  );

  const moveFocus = useCallback((nextIndex: number): void => {
    const node = cardsRef.current[nextIndex];
    if (node instanceof HTMLElement) node.focus({ preventScroll: true });
  }, []);

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      const currentIndex = Number(e.currentTarget.dataset['index'] ?? 0);
      const maxIndex = roleConfigs.length - 1;

      const nextStep = () => {
        const next = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        moveFocus(next);
      };
      const prevStep = () => {
        const prev = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        moveFocus(prev);
      };

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextStep(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prevStep(); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const role = e.currentTarget.dataset['role'];
        if (role) handleSelect(role);
      }
    },
    [handleSelect, moveFocus, roleConfigs.length],
  );

  const handleCardFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>): void => {
    const role = e.currentTarget.dataset['role'];
    if (role) {
      const index = Number(e.currentTarget.dataset['index'] ?? 0);
      void index;
    }
  }, []);

  type CSSVars = React.CSSProperties & Record<`--c-${string}`, string>;
  const cssVars = useMemo(
    (): CSSVars => ({
      '--c-primary':      theme.primary      ?? '#F59E0B',
      '--c-surface':      theme.surface      ?? '#0F172A',
      '--c-text':         theme.text         ?? '#F8FAFC',
      '--c-muted':        theme.muted        ?? '#94A3B8',
      '--c-border':       theme.border       ?? 'rgba(148,163,184,0.22)',
      '--c-border-strong':theme.borderStrong ?? 'rgba(148,163,184,0.42)',
      '--c-skeleton':     theme.skeleton     ?? 'rgba(148,163,184,0.14)',
    } as CSSVars),
    [theme],
  );

  useEffect(() => {
    cardsRef.current = cardsRef.current.slice(0, roleConfigs.length);
  }, [roleConfigs.length]);

  if (loading) {
    return (
      <div className="w-full" style={cssVars}>
        <p className="mb-4 text-center text-sm text-[var(--c-muted)]">
          {t('registration.choose_account_type', { defaultValue: 'Chwazi kalite kont ou' })}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!roleConfigs.length) {
    return (
      <div className="w-full" style={cssVars}>
        <p className="mb-4 text-center text-sm text-[var(--c-muted)]">
          {t('registration.choose_account_type', { defaultValue: 'Chwazi kalite kont ou' })}
        </p>
        <EmptyState t={t} />
      </div>
    );
  }

  return (
    <div className="w-full" style={cssVars}>
      <p className="mb-4 text-center text-sm text-[var(--c-muted)]">
        {t('registration.choose_account_type', { defaultValue: 'Chwazi kalite kont ou' })}
      </p>

      <div
        role="radiogroup"
        aria-label={t('registration.choose_account_type', { defaultValue: 'Chwazi kalite kont ou' })}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {roleConfigs.map(({ role, config }, index) => (
          <RoleCard
            key={role}
            role={role}
            config={config}
            selected={selected}
            onSelect={handleSelect}
            onKeyDown={handleCardKeyDown}
            onFocusRole={handleCardFocus}
            t={t}
            analytics={analytics}
            ref={(node: HTMLButtonElement | null) => { cardsRef.current[index] = node; }}
          />
        ))}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.selected === next.selected &&
  prev.loading  === next.loading  &&
  prev.roles    === next.roles    &&
  prev.t        === next.t        &&
  prev.onSelect === next.onSelect
);