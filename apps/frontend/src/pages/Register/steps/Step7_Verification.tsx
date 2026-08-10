import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Prefs { language: string; notifications: boolean; smsAlerts: boolean; marketingEmails: boolean; }
interface Props { defaultValues?: Partial<Prefs>; onNext?: (prefs: Prefs) => void; onBack?: () => void; }

const Step7_Verification = memo(function Step7_Verification({ defaultValues, onNext, onBack }: Props) {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Prefs>({
    language: 'ht', notifications: true, smsAlerts: false, marketingEmails: false,
    ...defaultValues,
  });

  const ITEMS: { key: keyof Prefs; label: string }[] = [
    { key: 'notifications',   label: t('registration.step7.push_notifications', 'Push Notifications') },
    { key: 'smsAlerts',       label: t('registration.step7.sms_alerts',          'SMS Alerts') },
    { key: 'marketingEmails', label: t('registration.step7.marketing_emails',    'Marketing Emails') },
  ];

  const toggle = (key: keyof Prefs) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-[13px] text-slate-300 mb-6">
        {t('registration.step7.prompt', 'Choose your communication preferences.')}
      </p>
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            {t('registration.step7.preferred_language', 'Preferred Language')}
          </label>
          <select value={prefs.language} onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
            className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400">
            <option value="ht">{t('registration.step7.lang_ht', 'Haitian Creole')}</option>
            <option value="fr">{t('registration.step7.lang_fr', 'French')}</option>
            <option value="en">{t('registration.step7.lang_en', 'English')}</option>
            <option value="es">{t('registration.step7.lang_es', 'Spanish')}</option>
          </select>
        </div>
        {ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/40 px-4 py-3">
            <span className="text-[12px] text-slate-200">{label}</span>
            <button type="button" onClick={() => toggle(key)}
              className={`relative h-6 w-11 rounded-full transition-colors ${prefs[key] ? 'bg-amber-400' : 'bg-slate-700'}`}>
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 rounded-2xl border border-slate-600 py-3 text-[12px] text-slate-300">
          {t('common.back', 'Back')}
        </button>
        <button type="button" onClick={() => onNext?.(prefs)}
          className="flex-1 rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black">
          {t('common.continue', 'Continue')}
        </button>
      </div>
    </motion.div>
  );
});

export default Step7_Verification;
