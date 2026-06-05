import React, { memo, useCallback, useState, useMemo } from "react";
import API from "../api/axios";

// Kategori yo rete menm jan
const CATEGORY_OPTIONS = {
  construction: ["Mason", "Carpenter", "Electrician", "Plumber", "Welder", "Boss", "Assistant", "Painter", "Foreman"],
  business: ["Company", "Restaurant", "Hospital", "Clinic", "Hotel", "Office", "Lawyer", "Mechanic"],
  service: ["Chef Lakay", "Plumber", "Doctor", "Nurse", "Taxi", "Delivery", "Cleaning", "Developer"]
};

const INITIAL_FORM = { title: "", description: "", type: "construction", category: "", city: "", country: "", phone: "" };

function CreatePost() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ success: "", error: "" });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value, ...(name === "type" ? { category: "" } : {}) }));
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await API.post("/posts/create", { ...form, createdAt: new Date().toISOString() });
      setStatus({ success: "Post created successfully!", error: "" });
      setForm({ ...INITIAL_FORM, type: form.type });
    } catch (error) {
      setStatus({ success: "", error: error.message || "Error creating post" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1528] text-white p-6 flex justify-center items-center font-sans">
      <section className="w-full max-w-md bg-[#0F1E36] p-8 rounded-[2rem] border border-gray-800 shadow-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Poste yon Travay</h1>
          <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Construction • Business • Services</p>
        </header>

        <div className="space-y-4">
          <select name="type" onChange={handleChange} value={form.type} className="w-full bg-[#0B1528] p-4 rounded-xl border border-gray-700 focus:border-amber-500 outline-none">
            <option value="construction">👷 Construction</option>
            <option value="business">🏢 Business</option>
            <option value="service">🚀 Service</option>
          </select>

          <select name="category" onChange={handleChange} value={form.category} className="w-full bg-[#0B1528] p-4 rounded-xl border border-gray-700 focus:border-amber-500 outline-none">
            <option value="">Seleksyone Kategori</option>
            {(CATEGORY_OPTIONS[form.type] || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <input name="title" placeholder="Tit Travay" onChange={handleChange} value={form.title} className="w-full bg-[#0B1528] p-4 rounded-xl border border-gray-700 outline-none" />
          
          <textarea name="description" placeholder="Deskripsyon..." onChange={handleChange} value={form.description} className="w-full bg-[#0B1528] p-4 rounded-xl border border-gray-700 outline-none h-24" />

          <div className="grid grid-cols-2 gap-4">
            <input name="city" placeholder="Vil" onChange={handleChange} value={form.city} className="bg-[#0B1528] p-4 rounded-xl border border-gray-700 outline-none" />
            <input name="phone" placeholder="Telefòn" onChange={handleChange} value={form.phone} className="bg-[#0B1528] p-4 rounded-xl border border-gray-700 outline-none" />
          </div>
        </div>

        {status.error && <p className="text-red-400 text-sm mt-4 text-center">{status.error}</p>}
        {status.success && <p className="text-green-400 text-sm mt-4 text-center">{status.success}</p>}

        <button 
          onClick={handleCreate}
          disabled={loading || !form.title || !form.category}
          className="w-full mt-8 py-4 bg-amber-500 hover:bg-amber-400 text-[#0B1528] font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? "Ap voye..." : "Poste Travay"}
        </button>
      </section>
    </main>
  );
}

export default memo(CreatePost);
