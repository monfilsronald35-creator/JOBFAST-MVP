import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
  forwardRef,
} from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { getRoleConfig, getProfessionsByRole } from '../../config/roleConfig';

function DefaultEmptyIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2l2.2 4.5L19 7.2l-3.5 3.4.8 4.9L12 13.9 7.7 15.5l.8-4.9L5 7.2l4.8-.7L12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SearchProfession({ value, onChange, t }) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium text-[var(--c-text)]" htmlFor="profession-search">
        {t('registration.search_profession', { defaultValue: 'Chèche pwofesyon' })}
      </label>
      <input
        id="profession-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('registration.search_placeholder', { defaultValue: 'Ekri yon non, kòd, oswa mo kle' })}
        className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm text-[var(--c-text)] outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0"
      />
    </div>
  );
}

SearchProfession.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 animate-pulse">
      <div className="mb-3 h-8 w-8 rounded-full bg-[var(--c-skeleton)]" />
      <div className="mb-2 h-4 w-36 rounded bg-[var(--c-skeleton)]" />
      <div className="h-3 w-full rounded bg-[var(--c-skeleton)]/80" />
      <div className="mt-2 h-3 w-5/6 rounded bg-[var(--c-skeleton)]/80" />
    </div>
  );
}

function EmptyState({ t, onBack }) {
  return (
    <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]/80 p-8 text-center">
      <DefaultEmptyIcon className="mx-auto mb-3 h-10 w-10 text-[var(--c-muted)]" />
      <p className="text-sm font-semibold text-[var(--c-text)]">
        {t('registration.no_professions', { defaultValue: 'Pa gen pwofesyon disponib' })}
      </p>
      <p className="mt-1 text-xs text-[var(--c-muted)]">
        {t('registration.try_back', { defaultValue: 'Retounen epi chwazi yon lòt kategori.' })}
      </p>

      {typeof onBack === 'function' ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)] focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0"
        >
          {t('common.back', { defaultValue: 'Retounen' })}
        </button>
      ) : null}
    </div>
  );
}

function getLocalizedLabel(item, language = 'ht') {
  if (!item) return '';
  if (typeof item === 'string') return item;

  const lang = language?.split('-')?.[0] || 'ht';
  return (
    item.translations?.[lang] ||
    item.translations?.ht ||
    item.translations?.en ||
    item.displayName ||
    item.label ||
    item.name ||
    item.title ||
    item.code ||
    item.id ||
    ''
  );
}

function isProfessionSelected(selected, role, professionId) {
  if (!selected) return false;
  if (typeof selected === 'string') return selected === `${role}:${professionId}`;
  return selected.role === role && selected.professionId === professionId;
}

const ProfessionCard = memo(
  forwardRef(function ProfessionCard(
    {
      profession,
      selectedState,
      onClick,
      onKeyDown,
      onFocusCard,
      onHoverCard,
      label,
      description,
      icon: Icon,
      t,
      index,
    },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        type="button"
        role="option"
        aria-selected={selectedState}
        aria-label={label}
        data-id={profession.id}
        data-index={index}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{ scale: selectedState ? 1.04 : 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onFocus={onFocusCard}
        onMouseEnter={onHoverCard}
        className={`
          rounded-xl border-2 p-5 text-left outline-none
          focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0
          ${selectedState
            ? 'border-[var(--c-primary)] bg-[var(--c-primary)]/10'
            : 'border-[var(--c-border)] bg-[var(--c-surface)]/70 hover:border-[var(--c-border-strong)]'}
        `}
      >
        <div className="mb-3 flex items-center justify-between">
          <Icon className="h-8 w-8 text-amber-400" aria-hidden="true" />
          {selectedState ? (
            <span className="rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold text-amber-300">
              {t('registration.selected', { defaultValue: 'Chwazi' })}
            </span>
          ) : null}
        </div>

        <h3 className="text-sm font-bold text-[var(--c-text)]">{label}</h3>

        {description ? (
          <p className="mt-2 text-xs leading-5 text-[var(--c-muted)]">{description}</p>
        ) : null}

        {profession.code ? (
          <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-muted)]">
            {profession.code}
          </p>
        ) : null}
      </motion.button>
    );
  }),
);

ProfessionCard.displayName = 'ProfessionCard';

ProfessionCard.propTypes = {
  profession: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
  }).isRequired,
  selectedState: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onFocusCard: PropTypes.func.isRequired,
  onHoverCard: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  t: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

function ProfessionGrid({
  role,
  selected,
  onSelect,
  loading = false,
  t,
  i18n,
  professionProvider,
  logger,
  onBack,
  onSearch,
  theme = {},
  analytics,
  enableSearch = true,
  pageSize = 24,
}) {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const cardsRef = useRef([]);
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const roleConfig = useMemo(() => {
    try {
      return role ? getRoleConfig(role) : null;
    } catch (error) {
      logger?.capture?.(error, { module: 'ProfessionGrid', role });
      return null;
    }
  }, [role, logger]);

  const rawProfessions = useMemo(() => {
    try {
      if (!role) return [];
      const provider = professionProvider || getProfessionsByRole;
      return provider(role);
    } catch (error) {
      logger?.capture?.(error, { module: 'ProfessionGrid', role });
      return [];
    }
  }, [role, professionProvider, logger]);

  const professions = useMemo(() => {
    const list = Array.isArray(rawProfessions) ? rawProfessions : [];
    const q = query.trim().toLowerCase();

    const filtered = !q
      ? list
      : list.filter((p) => {
          const haystack = [
            p.id,
            p.code,
            getLocalizedLabel(p, i18n?.language),
            getLocalizedLabel(p.description, i18n?.language),
          ]
            .join(' ')
            .toLowerCase();

          return haystack.includes(q);
        });

    return filtered.filter((item) => item?.id);
  }, [rawProfessions, query, i18n?.language]);

  const visibleProfessions = useMemo(
    () => professions.slice(0, visibleCount),
    [professions, visibleCount],
  );

  const localizedProfessions = useMemo(() => {
    return visibleProfessions.map((profession) => ({
      profession,
      label: getLocalizedLabel(profession, i18n?.language),
      description: getLocalizedLabel(profession.description, i18n?.language),
      icon: profession.icon || roleConfig?.icon || DefaultEmptyIcon,
    }));
  }, [visibleProfessions, i18n?.language, roleConfig]);

  const handleSelect = useCallback(
    (profession) => {
      if (loading || !profession?.id) return;
      onSelect?.({
        role,
        professionId: profession.id,
        professionCode: profession.code,
        category: profession.category ?? profession.profession ?? 'general',
      });
      analytics?.track?.('registration_profession_selected', {
        role,
        professionId: profession.id,
        professionCode: profession.code,
      });
    },
    [loading, onSelect, role, analytics],
  );

  const focusCard = useCallback((index) => {
    const node = cardsRef.current[index];
    if (node instanceof HTMLElement) node.focus({ preventScroll: true });
  }, []);

  const handleClick = useCallback(
    (e) => {
      const id = e.currentTarget.dataset.id;
      const profession = visibleProfessions.find((item) => item.id === id);
      if (profession) handleSelect(profession);
    },
    [handleSelect, visibleProfessions],
  );

  const handleKeyDown = useCallback(
    (e) => {
      const currentIndex = Number(e.currentTarget.dataset.index || 0);
      const maxIndex = visibleProfessions.length - 1;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        setActiveIndex(next);
        focusCard(next);
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        setActiveIndex(prev);
        focusCard(prev);
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
        focusCard(0);
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(maxIndex);
        focusCard(maxIndex);
        return;
      }

      if (e.key === 'PageDown') {
        e.preventDefault();
        const next = Math.min(currentIndex + 5, maxIndex);
        setActiveIndex(next);
        focusCard(next);
        return;
      }

      if (e.key === 'PageUp') {
        e.preventDefault();
        const prev = Math.max(currentIndex - 5, 0);
        setActiveIndex(prev);
        focusCard(prev);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = e.currentTarget.dataset.id;
        const profession = visibleProfessions.find((item) => item.id === id);
        if (profession) handleSelect(profession);
      }
    },
    [focusCard, handleSelect, visibleProfessions],
  );

  const handleFocusCard = useCallback((e) => {
    const index = Number(e.currentTarget.dataset.index || 0);
    setActiveIndex(index);
    const profession = visibleProfessions[index];
    if (profession) {
      analytics?.track?.('registration_profession_viewed', {
        role,
        professionId: profession.id,
        professionCode: profession.code,
      });
    }
  }, [analytics, role, visibleProfessions]);

  const handleHoverCard = useCallback((e) => {
    const index = Number(e.currentTarget.dataset.index || 0);
    const profession = visibleProfessions[index];
    if (profession) {
      analytics?.track?.('registration_profession_hover', {
        role,
        professionId: profession.id,
        professionCode: profession.code,
      });
    }
  }, [analytics, role, visibleProfessions]);

  useEffect(() => {
    const currentIndex = professions.findIndex((p) => isProfessionSelected(selected, role, p.id));
    if (currentIndex >= 0) {
      setActiveIndex(currentIndex);
      focusCard(currentIndex);
    }
  }, [focusCard, professions, role, selected]);

  useEffect(() => {
    analytics?.track?.('registration_profession_viewed', {
      role,
      count: visibleProfessions.length,
    });
  }, [analytics, role, visibleProfessions.length]);

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

  const activedescendant = visibleProfessions[activeIndex]
    ? `${role || 'role'}:${visibleProfessions[activeIndex].id}`
    : undefined;

  if (loading) {
    return (
      <div className="w-full" style={cssVars}>
        <p className="mb-4 text-center text-sm text-[var(--c-muted)]">
          {t('registration.choose_profession', { defaultValue: 'Chwazi yon pwofesyon' })}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!professions.length) {
    return (
      <div className="w-full" style={cssVars}>
        <p className="mb-4 text-center text-sm text-[var(--c-muted)]">
          {t('registration.choose_profession', { defaultValue: 'Chwazi yon pwofesyon' })}
        </p>
        <EmptyState t={t} onBack={onBack} />
      </div>
    );
  }

  return (
    <div className="w-full" style={cssVars}>
      {enableSearch ? (
        <SearchProfession value={query} onChange={(val) => { setQuery(val); setVisibleCount(pageSize); onSearch?.(val); }} t={t} />
      ) : null}

      <p className="mb-4 text-center text-sm text-[var(--c-muted)]">
        {t('registration.choose_profession', {
          role: getLocalizedLabel(roleConfig, i18n?.language) || role,
          defaultValue: 'Chwazi yon pwofesyon',
        })}
      </p>

      <div
        ref={listRef}
        role="listbox"
        aria-label={t('registration.profession_list', { defaultValue: 'Lis pwofesyon yo' })}
        aria-activedescendant={activedescendant}
        tabIndex={0}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {localizedProfessions.map(({ profession, label, description, icon: Icon }, index) => {
          const selectedState = isProfessionSelected(selected, role, profession.id);

          return (
            <ProfessionCard
              key={`${role}:${profession.id}`}
              ref={(node) => {
                cardsRef.current[index] = node;
              }}
              profession={profession}
              selectedState={selectedState}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              onFocusCard={handleFocusCard}
              onHoverCard={handleHoverCard}
              label={label}
              description={description}
              icon={Icon}
              t={t}
              index={index}
            />
          );
        })}
      </div>

      {visibleProfessions.length < professions.length ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => v + pageSize)}
            className="rounded-lg border border-[var(--c-border)] px-4 py-2 text-sm font-medium text-[var(--c-text)] focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-0"
          >
            {t('common.load_more', { defaultValue: 'Chaje plis' })}
          </button>
        </div>
      ) : null}
    </div>
  );
}

ProfessionGrid.propTypes = {
  role: PropTypes.string,
  selected: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      role: PropTypes.string,
      professionId: PropTypes.string,
    }),
  ]),
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  t: PropTypes.func.isRequired,
  i18n: PropTypes.shape({
    language: PropTypes.string,
  }),
  professionProvider: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  logger: PropTypes.shape({
    capture: PropTypes.func,
  }),
  onBack: PropTypes.func,
  onSearch: PropTypes.func,
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
  enableSearch: PropTypes.bool,
  pageSize: PropTypes.number,
};

export default memo(
  ProfessionGrid,
  (prev, next) =>
    prev.role === next.role &&
    prev.selected === next.selected &&
    prev.loading === next.loading &&
    prev.onSelect === next.onSelect &&
    prev.t === next.t &&
    prev.professionProvider === next.professionProvider &&
    prev.logger === next.logger &&
    prev.onBack === next.onBack &&
    prev.analytics === next.analytics &&
    prev.theme === next.theme &&
    prev.enableSearch === next.enableSearch &&
    prev.pageSize === next.pageSize,
);
