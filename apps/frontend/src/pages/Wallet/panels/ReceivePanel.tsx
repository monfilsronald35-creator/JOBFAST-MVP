import { memo } from 'react';
import { motion } from 'framer-motion';

interface UserProp { phone?: string; email?: string; }
interface Props { onClose: () => void; user?: UserProp; onInvoice?: () => void; }

const ReceivePanel = memo(function ReceivePanel({ onClose, user, onInvoice }: Props) {
  const phone = user?.phone ?? '+509 XXXX XXXX';
  const email = user?.email ?? 'user@jobfast.app';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-white">📥 Receive Money</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="h-40 w-40 rounded-2xl bg-white flex items-center justify-center">
          <p className="text-[10px] text-slate-900 text-center px-2">QR Code<br />(payment ID)</p>
        </div>

        <div className="w-full space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-[11px] text-slate-400">Phone</span>
            <span className="text-[11px] font-bold text-white">{phone}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <span className="text-[11px] text-slate-400">Email</span>
            <span className="text-[11px] font-bold text-white truncate ml-2">{email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onInvoice}
          className="w-full rounded-2xl border border-amber-400/40 bg-amber-400/10 py-2.5 text-[11px] font-bold text-amber-300"
        >
          Create Invoice instead
        </button>
      </div>
    </motion.div>
  );
});

export default ReceivePanel;