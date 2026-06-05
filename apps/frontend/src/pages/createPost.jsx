import React, { memo, useCallback, useState } from "react";
import API from "../api/axios";
import Input from "../components/Input";
import Button from "../components/Button";

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
    setStatus({ success: "", error: "" });
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

        <div className="space-y-1">
          {/* Tip Travay */}
          <label className="block text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">Tip</label>
          <select name="type" onChange={handleChange} value={form.type} className="w-full bg-[#0B1528] border border-gray-700 p-4 rounded-xl mb-4 focus:border-amber-500 outline-none">
            <option value="construction">👷 Construction</option>
            <option value="business">🏢 Business</option>
            <option value="service">🚀 Service</option>
          </select>

          {/* Kategori */}
          <label className="block text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">Kategori</label>
          <select name="category" onChange={handleChange} value={form.category} className="w-full bg-[#0B1528] border border-gray-700 p-4 rounded-xl mb-4 focus:border-amber-500 outline-none">
            <option value="">Seleksyone Kategori</option>
            {(CATEGORY_OPTIONS[form.type] || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <Input label="Tit Travay" name="title" placeholder="Eg: Mason pou kay..." value={form.title} onChange={handleChange} />
          <Input as="textarea" label="Deskripsyon" name="description" placeholder="Di nou detay travay la..." value={form.description} onChange={handleChange} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vil" name="city" placeholder="Eg: Santo Domingo" value={form.city} onChange={handleChange} />
            <Input label="Telefòn" name="phone" placeholder="Eg: +1..." value={form.phone} onChange={handleChange} />
          </div>
        </div>

        {status.error && <p className="text-red-400 text-xs mt-2 text-center">{status.error}</p>}
        {status.success && <p className="text-green-400 text-xs mt-2 text-center">{status.success}</p>}

        <Button 
          loading={loading} 
          onClick={handleCreate} 
          disabled={!form.title || !form.category}
          className="mt-6"
        >
          Poste Travay
        </Button>
      </section>
    </main>
  );
}

export default memo(CreatePost);
