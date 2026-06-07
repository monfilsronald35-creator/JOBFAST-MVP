import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Button from "../components/Button";

const STATUS_OPTIONS = [
  {
    id: "available",
    title: "DISPONIB",
    description: "Mwen disponib pou travay toupre m. AI va distribye òf rapid.",
    icon: CheckCircle,
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
  },
  {
    id: "busy",
    title: "OKIPE",
    description: "Mwen gen travay kounye a. Mwen pa resevwa nouvo òf pou yon ti moman.",
    icon: Clock,
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400"
  },
  {
    id: "unavailable",
    title: "PA DISPONIB",
    description: "Mwen pa disponib pou yon peryòd. Pwofil la p ap vizib nan rechèch yo.",
    icon: AlertCircle,
    badgeClass: "border-rose-500/30 bg-rose-500/10 text-rose-400"
  }
];

export default function AvailabilityStatus() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState("available");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveStatus = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-full flex-col animate-fade-in select-none bg-navy-900 pb-10 font-sans text-white justify-between">
      
      <header className="border-b border-slate-800/60 mx-auto flex max-w-sm w-full items-center justify-between px-5 pb-4 pt-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retounen nan paj anvan an"
          className="rounded-xl border border-slate-800/40 bg-navy-800/40 p-2.5 text-slate-400 transition-all hover:text-white active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <h1 className="text-xs font-black tracking-widest uppercase text-slate-200">Estatu Disponibilite</h1>
        <div className="h-9 w-9" />
      </header>

      <main className="flex-1 flex flex-col gap-6 px-5 py-6 max-w-sm mx-auto w-full">
        <p className="leading-relaxed px-1 text-xs font-medium text-slate-400">
          Chwazi estati ou an tan reyèl pou sistèm AI JobFast la ka distribye travay ak opòtinite yo avèk presizyon.
        </p>

        <div className="flex flex-col gap-3">
          {STATUS_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedStatus === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => setSelectedStatus(option.id)}
                aria-label={`Mete estati a kòm ${option.title}`}
                aria-current={isSelected ? "true" : undefined}
                className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.99] focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20 ${
                  isSelected 
                    ? "border-gold-400 bg-navy-800/30 shadow-md shadow-gold-400/5" 
                    : "border-slate-800/60 bg-navy-800/10 hover:border-slate-700"
                }`}
              >
                <div className={`rounded-xl border p-2.5 shrink-0 ${option.badgeClass}`}>
                  <IconComponent className="h-4 w-4" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-xs font-black tracking-wide uppercase ${isSelected ? "text-gold-400" : "text-white"}`}>
                    {option.title}
                  </h3>
                  <p className="mt-1 text-[10px] font-medium leading-normal text-slate-400">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="mx-auto max-w-sm w-full px-5">
        <Button
          loading={isSaving}
          onClick={handleSaveStatus}
          variant="primary"
          className="w-full py-4 active:scale-[0.98] bg-gold-400 rounded-2xl font-black text-xs uppercase tracking-widest text-navy-950 shadow-lg shadow-gold-400/5 transition-all hover:bg-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
        >
          Mete estati a ajou
        </Button>
      </footer>
    </div>
  );
}
