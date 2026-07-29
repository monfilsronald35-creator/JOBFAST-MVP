import React from "react";
export default function EditModal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#0f172a] rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="float-right text-slate-400 hover:text-white">✕</button>
        {children}
      </div>
    </div>
  );
}
