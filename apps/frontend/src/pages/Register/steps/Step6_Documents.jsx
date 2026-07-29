import React, { memo, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const DOC_TYPES = [
  { id: 'national_id', label: 'Kat Nasyonal', required: true },
  { id: 'passport', label: 'Paspò (opsyonèl)', required: false },
  { id: 'diploma', label: 'Diplòm / Sètifika', required: false },
  { id: 'license', label: 'Lisans Pwofesyonèl', required: false },
];

const Step6_Documents = memo(function Step6_Documents({ defaultValues, onNext, onBack }) {
  const [files, setFiles] = useState(defaultValues ?? {});
  const inputRefs = {};

  DOC_TYPES.forEach(({ id }) => {
    inputRefs[id] = useRef(null);
  });

  const handleFile = (id, e) => {
    const file = e.target.files?.[0];
    if (file) setFiles(prev => ({ ...prev, [id]: file }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext?.(files);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-[13px] text-slate-300 mb-6">
        Telechaje dokiman nesese yo (PDF oswa imaj).
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {DOC_TYPES.map(({ id, label, required }) => (
          <div key={id}>
            <label className="block text-[11px] text-slate-400 mb-1">
              {label} {required && <span className="text-red-400">*</span>}
            </label>
            <div
              onClick={() => inputRefs[id].current?.click()}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-600 bg-slate-900/40 px-4 py-3 cursor-pointer hover:border-amber-400/60"
            >
              <span className="text-xl">{files[id] ? '✅' : '📄'}</span>
              <span className="text-[11px] text-slate-300">
                {files[id] ? files[id].name : 'Klike pou chwazi fichye'}
              </span>
              <input
                ref={inputRefs[id]}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => handleFile(id, e)}
              />
            </div>
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onBack} className="flex-1 rounded-2xl border border-slate-600 py-3 text-[12px] text-slate-300">
            Retounen
          </button>
          <button type="submit" className="flex-1 rounded-2xl bg-amber-400 py-3 text-[12px] font-black text-black">
            Kontinye
          </button>
        </div>
      </form>
    </motion.div>
  );
});

export default Step6_Documents;