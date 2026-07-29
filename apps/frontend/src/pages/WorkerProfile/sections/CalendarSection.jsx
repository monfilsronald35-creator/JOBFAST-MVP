import React from "react";
export default function CalendarSection({ data, navigate }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
      <h3 className="text-base font-black mb-4">📅 Kalandriye</h3>
      <p className="text-sm text-slate-400">Seksyon sa a ap disponib byento.</p>
    </div>
  );
}