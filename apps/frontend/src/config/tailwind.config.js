import React, { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

// Mwen rekòmande pou mete sa nan yon dosye constants/status.js pou 
// re-itilize l nan lòt paj (ex: nan pwofil itilizatè a).
const STATUS_OPTIONS = [/* ... done ou yo ... */];

const AvailabilityStatus = () => {
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
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col font-sans select-none justify-between pb-8">
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-gray-800/60">
        <button onClick={() => navigate(-1)} className="p-2 bg-[#0F1E36] rounded-xl text-gray-400 hover:text-amber-500 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-extrabold tracking-wider uppercase text-gray-200">Estati Disponibilite</h1>
        <div className="w-9 h-9"></div>
      </div>

      {/* OPTIONS */}
      <div className="px-5 flex-1 py-6 flex flex-col gap-5 max-w-md mx-auto w-full">
        <p className="text-xs font-medium text-gray-400 leading-relaxed">
          Chwazi estati ou an tan reyèl pou sistèm AI JobFast la ka distribye travay yo avèk presizyon.
        </p>

        <div className="flex flex-col gap-3.5">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedStatus(option.id)}
              className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                selectedStatus === option.id 
                  ? "bg-[#0F1E36] border-amber-500" 
                  : "bg-[#0F1E36]/40 border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className={`p-2.5 rounded-xl border ${option.badgeClass}`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-bold ${selectedStatus === option.id ? "text-amber-500" : "text-white"}`}>
                  {option.title}
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ACTION BUTTON */}
      <div className="px-5 max-w-md mx-auto w-full">
        <Button
          loading={isSaving}
          onClick={handleSaveStatus}
          variant="primary"
          className="uppercase tracking-widest text-xs"
        >
          Mete estati a ajou
        </Button>
      </div>
    </div>
  );
};

export default memo(AvailabilityStatus);
