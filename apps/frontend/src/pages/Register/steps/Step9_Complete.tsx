import { memo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Step9_Complete = memo(function Step9_Complete() {
  const { t } = useTranslation();
  useEffect(() => { /* completion animation hook */ }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center gap-6 py-12 text-center">
      <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ delay: 0.3, duration: 0.6 }} className="text-7xl">
        🎉
      </motion.div>
      <div>
        <h2 className="text-2xl font-black text-white">
          {t('registration.step9.title', 'Account Created!')}
        </h2>
        <p className="mt-2 text-[13px] text-slate-300 max-w-xs">
          {t('registration.step9.subtitle', 'Welcome to JOBFAST. Your profile is ready. You can start finding work or offering services now.')}
        </p>
      </div>
      <div className="w-full max-w-sm space-y-2">
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-[11px] text-emerald-300">
          <span>✓</span> {t('registration.step9.account_created', 'Account created successfully')}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-[11px] text-emerald-300">
          <span>✓</span> {t('registration.step9.email_sent', 'Confirmation email sent')}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[11px] text-amber-300">
          <span>⏳</span> {t('registration.step9.doc_verification', 'Document verification in progress (1-24 hours)')}
        </div>
      </div>
    </motion.div>
  );
});

export default Step9_Complete;
