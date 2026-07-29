import { memo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const DOC_TYPES = [
  { id: 'national_id', label: 'Kat Nasyonal',          required: true  },
  { id: 'passport',    label: 'Paspot (opsyonèl)',      required: false },
  { id: 'diploma',     label: 'Diplòm / Sètifika',     required: false },
  { id: 'license',     label: 'Lisans Pwofesyonèl',    required: false },
];

interface Props {
  defaultValues?: Record<string, File>;
  onNext?: (files: Record<string, File>) => void;
  onBack?: () => void;
}

const Step6_Documents = memo(function Step6_Documents({ defaultValues, onNext, onBack }: Props) {
  const [files, setFiles] = useState<Record<string, File>>(defaultValues ?? {});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>(
    Object.fromEntries(DOC_TYPES.map((d) => [d.id, null]))
  );

  const handleFile = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFiles((prev) => ({ ...prev, [id]: file }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-[13px] text-slate-300 mb-6">Telechaje dokiman nesese yo (PDF oswa imaj).</p>
      <form onSubmit={(e) => { e.preventDefault(); onNext?.(files); }} className="space-y-3">
        {DOC_TYPES.map(({ id, label, required }) => (
          <div key={id}>
            <label className="block text-[11px] text-slate-400 mb-1">
              {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div onClick={() => inputRefs.current[id]?.click()}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-600 bg-slate-900/40 px-4 py-3 cursor-pointer hover:border-amber-400/60">
              <span className="text-xl">{files[id] ? '✅' : '📄'}</span>
              <span className="text-[11px] text-slate-300">{files[id] ? files[id]!.name : 'Klike pou chwazi fichye'}</span>
              <input ref={(el) => { inputRefs.current[id] = el; }} type="file" accept="image/*,.pdf"
                className="hidden" onChange={(e) => handleFile(id, e)} />
            </div>
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onBack} className="flex-1 rounded-2xl border border-slate-600 py-3 text-[12px] text-slate-300">Retounen</button>
          <button type="submit" className="flex-1 rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black">Kontinye</button>
        </div>
      </form>
    </motion.div>
  );
});

export default Step6_Documents;