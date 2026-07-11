import React from 'react';
import { useTranslation } from 'react-i18next';

const TIERS = [
  {
    id: 'new_member',
    icon: '🌱',
    color: 'text-slate-400',
    bg: 'bg-slate-700/60 border-slate-600',
    minJobs: 0,
    maxJobs: 0,
    minRating: 0,
    showStars: false,
  },
  {
    id: 'verified_worker',
    icon: '✅',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/40',
    minJobs: 1,
    maxJobs: 9,
    minRating: 0,
    showStars: true,
  },
  {
    id: 'trusted_professional',
    icon: '⭐',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/40',
    minJobs: 10,
    maxJobs: Infinity,
    minRating: 4.5,
    showStars: true,
  },
];

function resolveTier(completedJobs = 0, rating = 0) {
  if (completedJobs >= 10 && rating >= 4.5) return TIERS[2];
  if (completedJobs >= 1) return TIERS[1];
  return TIERS[0];
}

export default function ReputationBadge({
  completedJobs = 0,
  rating = 0,
  reviewCount = 0,
  satisfactionPct = 0,
  size = 'sm',       // 'xs' | 'sm' | 'md' | 'card'
  showStats = false,
}) {
  const { t } = useTranslation();
  const tier = resolveTier(completedJobs, rating);

  const label = t(`reputation.${tier.id}`, { defaultValue:
    tier.id === 'new_member'           ? 'New Member'           :
    tier.id === 'verified_worker'      ? 'Verified Worker'      :
                                         'Trusted Professional'
  });

  if (size === 'xs') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${tier.bg} ${tier.color}`}>
        {tier.icon} {label}
      </span>
    );
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${tier.bg} ${tier.color}`}>
        {tier.icon} {label}
      </span>
    );
  }

  if (size === 'card') {
    return (
      <div className={`flex flex-col gap-2 p-4 rounded-2xl border ${tier.bg}`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tier.icon}</span>
          <div>
            <p className={`text-sm font-black ${tier.color}`}>{label}</p>
            <p className="text-xs text-slate-400">
              {completedJobs} {t('reputation.jobsDone', { defaultValue: 'travay konplè' })}
            </p>
          </div>
        </div>

        {tier.showStars && reviewCount > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {'⭐'.repeat(Math.round(rating))}
              <span className={`text-xs font-bold ml-1 ${tier.color}`}>{Number(rating).toFixed(1)}</span>
              <span className="text-xs text-slate-500">({reviewCount})</span>
            </div>
            {satisfactionPct > 0 && (
              <span className="text-xs text-green-400 font-bold">{satisfactionPct}% {t('reputation.satisfied', { defaultValue: 'satisfè' })}</span>
            )}
          </div>
        )}

        {tier.id === 'new_member' && (
          <p className="text-xs text-slate-500">
            {t('reputation.newMemberNote', { defaultValue: 'Fini premye travay ou pou jwenn badge Verified Worker' })}
          </p>
        )}

        {tier.id === 'verified_worker' && (
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-amber-400 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(completedJobs / 10 * 100, 100)}%` }} />
          </div>
        )}
        {tier.id === 'verified_worker' && (
          <p className="text-[10px] text-slate-500">
            {Math.max(0, 10 - completedJobs)} {t('reputation.jobsToTrusted', { defaultValue: 'travay anko pou Trusted Professional' })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${tier.bg}`}>
      <span className="text-lg">{tier.icon}</span>
      <div>
        <p className={`text-xs font-black ${tier.color}`}>{label}</p>
        {tier.showStars && reviewCount > 0 && (
          <p className="text-[10px] text-slate-400">
            {Number(rating).toFixed(1)} ⭐ · {reviewCount} {t('reputation.reviews', { defaultValue: 'revizyon' })}
          </p>
        )}
      </div>
    </div>
  );
}
