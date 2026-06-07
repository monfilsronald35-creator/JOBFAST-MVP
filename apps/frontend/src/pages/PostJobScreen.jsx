import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const JOB_CATEGORIES = [
  { id: "construction", label: "Konstriksyon" },
  { id: "services", label: "Sèvis sou Demand" },
  { id: "business", label: "Anyè Biznis" },
  { id: "jobs", label: "Travay Jeneral" },
];

export default function PostJobScreen() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    category: "construction",
    description: "",
    location: "Bávaro, Punta Cana",
    budget: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.budget) {
      setError("Tanpri ranpli tout chan ki nesesè yo.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Travay pibliye ak siksè:", formData);

      setTimeout(() => {
        setIsLoading(false);
        navigate("/dashboard");
      }, 1000);
    } catch {
      setIsLoading(false);
      setError("Gen yon pwoblèm ki pase, tanpri reyezi ankò.");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-navy-900 pb-12 font-sans text-white select-none animate-fade-in">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-3 pt-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retounen"
          className="rounded-xl border border-navy-800 bg-navy-800/60 p-2.5 text-slate-400 transition-all active:scale-95 hover:text-gold-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Poste yon Travay</h2>
        <div className="h-9 w-9" />
      </div>

      <form onSubmit={handleSubmit} className="mx-auto mt-4 flex w-full max-w-md flex-1 flex-col gap-5 px-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-center text-xs font-bold text-red-400" aria-live="polite">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Tit Travay
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Eg. Mason, Plonbye..."
            className="w-full rounded-xl border border-navy-800 bg-navy-800/40 px-4 py-3.5 text-sm font-semibold text-white placeholder-slate-500 transition-all focus:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Kategori
          </label>
          <div className="relative">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full appearance-none rounded-xl border border-navy-800 bg-navy-800/40 px-4 py-3.5 text-sm font-semibold text-white transition-all focus:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
            >
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-navy-950 text-white">
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Deskripsyon
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ekri detay travay la ak tout kondisyon ou bezwen yo..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-navy-800 bg-navy-800/40 px-4 py-3.5 text-sm font-semibold text-white placeholder-slate-500 transition-all leading-relaxed focus:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="location" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Kote li ye
          </label>
          <div className="relative">
            <input
              id="location"
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Kote travay la ye"
              className="w-full rounded-xl border border-navy-800 bg-navy-800/40 py-3.5 pl-11 pr-4 text-sm font-semibold text-white placeholder-slate-500 transition-all focus:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
              required
            />
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <circle cx="12" cy="10" r="2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="budget" className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Bidjè Pwopoze (USD)
          </label>
          <div className="relative flex items-center">
            <input
              id="budget"
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="50"
              min="1"
              className="w-full rounded-xl border border-navy-800 bg-navy-800/40 py-3.5 pl-16 pr-4 text-sm font-semibold text-white placeholder-slate-500 transition-all [appearance:textfield] focus:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
            <div className="pointer-events-none absolute left-4 flex items-center text-xs font-black uppercase tracking-wider text-slate-500">
              USD
            </div>
          </div>
        </div>

        <div className="mt-4 pb-8">
          <button
            type="submit"
            disabled={isLoading}
            aria-disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-4 text-xs font-black uppercase tracking-wider text-navy-900 transition-all hover:bg-gold-400 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
            ) : (
              "Pibliye Pwojè a"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
