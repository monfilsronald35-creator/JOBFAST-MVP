import { memo } from 'react';
import { motion } from 'framer-motion';

const DOCS = [
  { name: 'Q2 Financial Report.pdf',         size: '2.4 MB',  date: '2026-07-15' },
  { name: 'Employee Handbook v3.docx',        size: '840 KB',  date: '2026-06-01' },
  { name: 'Service Agreement Template.pdf',   size: '310 KB',  date: '2026-05-20' },
  { name: 'Compliance Checklist.xlsx',        size: '128 KB',  date: '2026-07-10' },
];

interface TabProps { user?: Record<string, unknown>; }

const DocumentCenterTab = memo(function DocumentCenterTab({ user: _user }: TabProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-white">Document Center</h2>
        <button type="button" className="rounded-2xl bg-amber-400 px-3 py-1.5 text-[10px] font-bold text-black">+ Upload</button>
      </div>
      <ul className="space-y-2">
        {DOCS.map(({ name, size, date }) => (
          <li key={name} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-lg">📄</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-white truncate">{name}</p>
              <p className="text-[9px] text-slate-400">{size} · {date}</p>
            </div>
            <button type="button" className="text-[10px] text-slate-400 hover:text-white">↓</button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
});

export default DocumentCenterTab;