import React, { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { getRoleConfig } from '../../config/roleConfig';

function DefaultIcon(props) {
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

function EmptyState({ t }) {
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

const RoleCard = memo(function RoleCard({
  role,
  config,
  selected,
  onSelect,
  onKeyDown,
  onFocusRole,
  t,
  analytics,
  iconProps,
}) {
  const isSelected = selected === role;
  const Icon = config.icon || DefaultIcon;

  const handleClick = useCallback(
    (e) => {
      onSelect(e.currentTarget.dataset.role);
      analytics?.track?.('registration_role_selected', { role: e.currentTarget.dataset.role });
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
        <Icon className="h-8 w-8 text-amber-400" aria-hidden="true" {...iconProps} />
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

RoleCard.propTypes = {
  role: PropTypes.string.isRequired,
  config: PropTypes.shape({
    icon: PropTypes.elementType,
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onFocusRole: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  analytics: PropTypes.shape({
    track: PropTypes.func,
  }),
  iconProps: PropTypes.object,
};

export default memo(function Step1_CategorySelect({
  selected,
  onSelect,
  roles = [],
  t,
  loading = false,
  analytics,
  theme = {},
}) {
  const roleConfigs = useMemo(
    () =>
      (roles || [])
        .map((role) => {
          const config = getRoleConfig(role);
          return config ? { role, config } : null;
        })
        .filter(Boolean),
    [roles],
  );

  const selectedIndex = useMemo(
    () => Math.max(roleConfigs.findIndex((x) => x.role === selected), 0),
    [roleConfigs, selected],
  );

  const cardsRef = useRef([]);

  const handleSelect = useCallback(
    (role) => {
      if (role) onSelect(role);
    },
    [onSelect],
  );

  const moveFocus = useCallback((nextIndex) => {
    const node = cardsRef.current[nextIndex];
    if (node instanceof HTMLElement) {
      node.focus({ preventScroll: true });
    }
  }, []);

  const handleCardKeyDown = useCallback(
    (e) => {
      const currentIndex = Number(e.currentTarget.dataset.index || 0);
      const maxIndex = roleConfigs.length - 1;

      const nextStep = () => {
        const next = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        moveFocus(next);
      };

      const prevStep = () => {
        const prev = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        moveFocus(prev);
      };

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextStep();
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevStep();
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const role = e.currentTarget.dataset.role;
        if (role) handleSelect(role);
      }
    },
    [handleSelect, moveFocus, roleConfigs.length],
  );

  const handleCardFocus = useCallback((e) => {
    const index = Number(e.currentTarget.dataset.index || 0);
    const role = e.currentTarget.dataset.role;
    if (role) {
      cardsRef.current.index = index;
    }
  }, []);

  const cssVars = useMemo(
    () => ({
      '--c-primary': theme.primary || '#F59E0B',
      '--c-surface': theme.surface || '#0F172A',
      '--c-text': theme.text || '#F8FAFC',
      '--c-muted': theme.muted || '#94A3B8',
      '--c-border': theme.border || 'rgba(148,163,184,0.22)',
      '--c-border-strong': theme.borderStrong || 'rgba(148,163,184,0.42)',
      '--c-skeleton': theme.skeleton || 'rgba(148,163,184,0.14)',
    }),
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
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
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
            ref={(node) => {
              cardsRef.current[index] = node;
            }}
            role={role}
            config={config}
            selected={selected}
            onSelect={handleSelect}
            onKeyDown={handleCardKeyDown}
            onFocusRole={handleCardFocus}
            t={t}
            analytics={analytics}
          />
        ))}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.selected === next.selected &&
  prev.loading === next.loading &&
  prev.roles === next.roles &&
  prev.t === next.t &&
  prev.onSelect === next.onSelect
);

Step1_CategorySelect.propTypes = {
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string),
  t: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  analytics: PropTypes.shape({
    track: PropTypes.func,
  }),
  theme: PropTypes.shape({
    primary: PropTypes.string,
    surface: PropTypes.string,
    text: PropTypes.string,
    muted: PropTypes.string,
    border: PropTypes.string,
    borderStrong: PropTypes.string,
    skeleton: PropTypes.string,
  }),
};
