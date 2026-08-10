import { memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Props { onSelect?: (id: string) => void; }

const Step0_SelectAccount = memo(function Step0_SelectAccount({ onSelect }: Props) {
  const { t } = useTranslation();

  const TYPES = [
    {
      id: 'personal',
      icon: '👤',
      label: t('registration.step0.personal_label', 'Personal Account'),
      desc:  t('registration.step0.personal_desc',  'For individual workers, professionals and consumers.'),
    },
    {
      id: 'business',
      icon: '🏢',
      label: t('registration.step0.business_label', 'Business Account'),
      desc:  t('registration.step0.business_desc',  'For companies, restaurants, hotels and other organizations.'),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 py-4">
      <p className="text-center text-[13px] text-slate-300 mb-6">
        {t('registration.step0.prompt', 'What type of account do you want to create?')}
      </p>
      {TYPES.map(({ id, icon, label, desc }) => (
        <motion.button key={id} type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => onSelect?.(id)}
          className="w-full flex items-center gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 p-4 text-left hover:border-amber-400/60 transition-all">
          <span className="text-4xl">{icon}</span>
          <div>
            <p className="font-bold text-white">{label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
});

export default Step0_SelectAccount;
