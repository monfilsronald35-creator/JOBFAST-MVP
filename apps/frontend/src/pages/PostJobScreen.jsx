import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Kategori yo jan yo ye nan direktori ak makèt JobFast la
const JOB_CATEGORIES = [
  { id: "construction", label: "Construction" },
  { id: "services", label: "Services on Demand" },
  { id: "business", label: "Business Directory" },
  { id: "jobs", label: "General Jobs" }
];

const PostJobScreen = () => {
  const navigate = useNavigate();
  
  // Leta lokal pou fòm lan
  const [formData, setFormData] = useState({
    title: "",
    category: "construction",
    description: "",
    location: "Bavaro, Punta Cana", // Default valè selon zòn operasyon an
    budget: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Manke chanjman nan input yo
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(""); // Reyajiste erè a si itilizatè a ap tape
  };

  // Soumèt travay la bay Backend lan
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasyon sekirite anvan voye done
    if (!formData.title.trim() || !formData.description.trim() || !formData.budget) {
      setError("Tanpri ranpli tout chan ki nesesè yo.");
      return;
    }

    setIsLoading(true);
    try {
      // Isit la ou pral fè fetch la pou Render Backend ou a
      // const response = await fetch('https://ou-backend-url.render.com/api/jobs', { ... })
      
      console.log("Travay pibliye ak siksè:", formData);
      
      // Simile yon ti tan kout pou rezo a anvan n redireksyone itilizatè a
      setTimeout(() => {
        setIsLoading(false);
        navigate("/dashboard"); // Retounen sou Home Screen an
      }, 1000);

    } catch (err) {
      setIsLoading(false);
      setError("Gen yon pwoblèm ki pase, tanpri reyezi ankò.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1528] text-white flex flex-col font-sans select-none pb-12">
      
      {/* 🟢 TOP NAVIGATION BAR */}
      <div className="px-5 pt-6 pb-3 max-w-md w-full mx-auto flex items-center justify-between z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-[#162238] border border-slate-800/80 rounded-xl text-slate-400 active:scale-95 transition-transform"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Poste yon Travay</h2>
        
        {/* Ti espas balanse pou aliyman pafè */}
        <div className="w-9 h-9"></div>
      </div>

      {/* 📝 FÒM POU POSTE TRAVAY LA */}
      <form 
        onSubmit={handleSubmit}
        className="px-5 mt-4 max-w-md w-full mx-auto flex flex-col gap-5 flex-1 overflow-y-auto"
      >
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs font-bold text-red-400 animate-pulse">
            {error}
          </div>
        )}

        {/* 1️⃣ TIT TRAVAY (TITLE) */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tit Travay</label>
          <input 
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Eg. Mason"
            className="w-full px-4 py-3.5 bg-[#162238] border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
            required
          />
        </div>

        {/* 2️⃣ KATEGORI (CATEGORY) */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
          <div className="relative">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3.5 bg-[#162238] border border-slate-800 rounded-xl text-sm font-semibold text-white appearance-none focus:outline-none focus:border-amber-400/50 transition-colors"
            >
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#162238] text-white">
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3️⃣ DESKRIPSYON (DESCRIPTION) */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Deskripsyon</label>
          <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Ekri detay travay la..."
            rows={5}
            className="w-full px-4 py-3.5 bg-[#162238] border border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-400/50 transition-colors leading-relaxed"
            required
          />
        </div>

        {/* 4️⃣ KOTE TRAVAY LA AP FET (LOCATION) */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Kote</label>
          <div className="relative">
            <input 
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Kote travay la ye"
              className="w-full pl-11 pr-4 py-3.5 bg-[#162238] border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors"
              required
            />
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 5️⃣ BIDJÈ (BUDGET) */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Bidjè (USD)</label>
          <div className="relative flex items-center">
            {/* Nou ogmante padding bò gòch la bay pl-16 pou chif yo pa janm kole ak tèks la */}
            <input 
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="50"
              min="1"
              className="w-full pl-16 pr-4 py-3.5 bg-[#162238] border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              required
            />
            {/* Santre pafè nèt pou "USD" */}
            <div className="absolute left-4 flex items-center pointer-events-none text-slate-500 text-xs font-black uppercase tracking-wider">
              USD
            </div>
          </div>
        </div>

        {/* 🚀 BOUTON SUBMIT LA (POSTE) */}
        <div className="mt-4 pb-8">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-amber-400 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-black uppercase tracking-wider hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all shadow-xl shadow-amber-400/10"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Poste"
            )}
          </button>
        </div>

      </form>

    </div>
  );
};

export default PostJobScreen;
