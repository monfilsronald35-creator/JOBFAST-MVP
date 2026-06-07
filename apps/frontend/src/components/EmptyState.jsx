import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({
  title = "Pa gen done yo jwenn",
  message = "Pa gen anyen ki disponib pou moman sa a.",
  actionLabel,
  onAction,
  icon: IconComponent = FolderOpen,
}) {
  const hasAction = typeof onAction === "function" && Boolean(actionLabel);

  return (
    <section
      className="animate-fade-in flex w-full select-none flex-col items-center justify-center border border-dashed border-slate-800 bg-navy-800/10 p-8 text-center rounded-2xl"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="rounded-2xl border border-navy-800 bg-navy-800/20 p-4 mb-4 text-slate-600">
        <IconComponent className="h-8 w-8" strokeWidth={2} aria-hidden="true" />
      </div>

      <h2 className="text-sm font-black tracking-wide text-white">{title}</h2>

      <p className="mt-1.5 max-w-[240px] text-xs font-medium leading-relaxed text-slate-400">
        {message}
      </p>

      {hasAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 active:scale-95 rounded-xl bg-gold-400 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-navy-950 shadow-md shadow-gold-400/5 transition-all hover:bg-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}
