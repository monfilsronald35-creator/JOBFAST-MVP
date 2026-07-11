import React from 'react';
import { useTranslation } from 'react-i18next';

const ROLES = [
  {
    id:    'worker',
    icon:  '👷',
    color: 'amber',
    ring:  'hover:border-amber-500/60 focus-visible:ring-amber-400/50 group-hover:text-amber-400',
    bg:    'group-hover:bg-amber-500/5',
  },
  {
    id:    'employer',
    icon:  '🏢',
    color: 'blue',
    ring:  'hover:border-blue-500/60 focus-visible:ring-blue-400/50 group-hover:text-blue-400',
    bg:    'group-hover:bg-blue-500/5',
  },
  {
    id:    'service_provider',
    icon:  '🤝',
    color: 'green',
    ring:  'hover:border-green-500/60 focus-visible:ring-green-400/50 group-hover:text-green-400',
    bg:    'group-hover:bg-green-500/5',
  },
];

export default function Step0_RoleSelect({ onSelect }) {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-3 mt-4">
      {ROLES.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onSelect(role)}
          className={`group flex items-center gap-4 w-full px-5 py-4 bg-[#0f172a] rounded-2xl border border-slate-800 ${role.ring} transition focus-visible:outline-none focus-visible:ring-2`}
        >
          <span className="text-3xl shrink-0 leading-none">{role.icon}</span>

          <div className={`flex-1 text-left transition ${role.bg}`}>
            <p className="text-base font-bold text-white leading-tight">
              {t(`registration.roles.${role.id}`)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(`registration.roles.${role.id}_desc`)}
            </p>
          </div>

          <span className="text-slate-500 text-sm shrink-0 transition group-hover:translate-x-0.5">
            →
          </span>
        </button>
      ))}
    </div>
  );
}
