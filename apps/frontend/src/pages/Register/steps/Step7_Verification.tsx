import { memo, useState } from 'react';
import { motion } from 'framer-motion';

interface Prefs { language: string; notifications: boolean; smsAlerts: boolean; marketingEmails: boolean; }
interface Props { defaultValues?: Partial<Prefs>; onNext?: (prefs: Prefs) => void; onBack?: () => void; }

const ITEMS: { key: keyof Prefs; label: string }[] = [
  { key: 'notifications',   label: 'Notifikasyon Push' },
  { key: 'smsAlerts',       label: 'Alèt SMS' },
  { key: 'marketingEmails', label: 'Imèl Maketing' },
];

const Step7_Verification = memo(function Step7_Verification({ defaultValues, onNext, onBack }: Props) {
  const [prefs, setPrefs] = useState<Prefs>({
    language: 'ht', notifications: true, smsAlerts: false, marketingEmails: false,
    ...defaultValues,
  });

  const toggle = (key: keyof Prefs) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-[13px] text-slate-300 mb-6">Chwazi preferans komunikasyon ou yo.</p>
      <div className="space-y-3 mb-6">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Lang Pwefere</label>
          <select value={prefs.language} onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
            className="w-full rounded-2xl bg-black/40 border border-slate-700 px-4 py-3 text-[11px] text-slate-100 outline-none focus:border-amber-400">
            <option value="ht">Kreyòl Ayisyen</option>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
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
        <button type="button" onClick={onBack} className="flex-1 rounded-2xl border border-slate-600 py-3 text-[12px] text-slate-300">Retounen</button>
        <button type="button" onClick={() => onNext?.(prefs)} className="flex-1 rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black">Kontinye</button>
      </div>
    </motion.div>
  );
});

export default Step7_Verification;