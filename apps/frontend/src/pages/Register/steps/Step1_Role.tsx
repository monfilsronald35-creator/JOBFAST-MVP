import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props { accountType?: string; onSelect?: (id: string) => void; }

const Step1_Role = memo(function Step1_Role({ accountType, onSelect }: Props) {
  const { t } = useTranslation();

  const PERSONAL_ROLES = [
    { id: 'worker',  icon: '👷', label: t('registration.step1.worker_label',     'Worker'),    desc: t('registration.step1.worker_desc',     'Offer professional services') },
    { id: 'client',  icon: '👥', label: t('registration.step1.client_label',     'Client'),    desc: t('registration.step1.client_desc',     'Find services and work') },
    { id: 'tourist', icon: '✈️', label: t('registration.step1.tourist_label',    'Tourist'),   desc: t('registration.step1.tourist_desc',    'Visitor looking for tourist services') },
  ];
  const BUSINESS_ROLES = [
    { id: 'company',    icon: '🏢', label: t('registration.step1.company_label',    'Company'),    desc: t('registration.step1.company_desc',    'Company offering services') },
    { id: 'enterprise', icon: '🌐', label: t('registration.step1.enterprise_label', 'Enterprise'), desc: t('registration.step1.enterprise_desc', 'Large enterprise with multiple services') },
  ];

  const roles = accountType === 'business' ? BUSINESS_ROLES : PERSONAL_ROLES;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 py-4">
      <p className="text-center text-[13px] text-slate-300 mb-6">
        {t('registration.step1.prompt', 'What role will you play on JOBFAST?')}
      </p>
      {roles.map(({ id, icon, label, desc }) => (
        <motion.button key={id} type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => onSelect?.(id)}
          className="w-full flex items-center gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 p-4 text-left hover:border-amber-400/60 transition-all">
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="font-bold text-white">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
});

export default Step1_Role;
