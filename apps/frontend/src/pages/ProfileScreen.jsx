import React, { useState } from 'react';
import { 
  MapPin, Star, Edit3, Settings, 
  LogOut, ChevronRight, Home, Search, PlusSquare, Bell, User 
} from 'lucide-react';

const ProfileScreen = () => {
  const [user] = useState({
    name: 'Ronald Monfils',
    role: 'Boss',
    location: 'Bavaro, Punta Cana',
    rating: 4.8,
    jobsCompleted: 24,
    memberSince: 'Jan 2024',
    bio: 'Mwen se yon boss konstriksyon ak 10+ lane eksperyans.'
  });

  const skills = ['Mason', 'Beton', 'Tiling', 'Plonbye'];

  return (
    <div className="min-h-screen bg-[#0B1528] text-white flex flex-col max-w-md mx-auto shadow-2xl font-sans relative pb-24">
      
      {/* HEADER */}
      <header className="px-6 pt-10 pb-6 bg-[#0F1E36] rounded-b-[2rem] border-b border-gray-800 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Profil</h1>
          <button aria-label="Anviwònman" className="p-2 bg-[#132644] rounded-full hover:bg-gray-800 transition-all active:scale-95">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ronald" 
              alt="Profile" 
              className="w-24 h-24 rounded-full border-4 border-[#132644] mb-4 shadow-lg"
            />
            <button aria-label="Edit foto" className="absolute bottom-4 right-0 p-1.5 bg-amber-500 rounded-full text-[#0B1528] shadow-md hover:bg-amber-400 transition-all">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-amber-500 font-semibold uppercase text-xs tracking-widest mt-0.5">{user.role}</p>
          <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
            <MapPin className="w-4 h-4" />
            {user.location}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mt-8 bg-[#0B1528] p-4 rounded-2xl border border-gray-800">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{user.jobsCompleted}</p>
            <p className="text-[10px] text-gray-500 uppercase">Travay</p>
          </div>
          <div className="text-center border-l border-r border-gray-800">
            <div className="flex items-center justify-center gap-1">
              <p className="text-lg font-bold text-white">{user.rating}</p>
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-[10px] text-gray-500 uppercase">Evalyasyon</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white text-[12px] pt-1">{user.memberSince}</p>
            <p className="text-[10px] text-gray-500 uppercase">Manm depi</p>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="px-6 py-6 space-y-6">
        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">A Pwopo</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{user.bio}</p>
        </section>

        <section>
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Konpetans</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="px-3 py-1 bg-[#132644] text-white text-xs rounded-full border border-gray-700">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-[#0F1E36] rounded-xl border border-gray-800 hover:border-amber-500/50 transition active:scale-[0.98]">
            <span className="text-sm font-medium">Edit Pwofil</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-[#0F1E36] rounded-xl border border-gray-800 hover:border-amber-500/50 transition active:scale-[0.98]">
            <span className="text-sm font-medium">Istwa Travay</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-[#0F1E36] rounded-xl border border-gray-800 hover:border-red-500/50 transition text-red-400 active:scale-[0.98]">
            <span className="text-sm font-medium">Dekonekte</span>
            <LogOut className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* NAV BAR */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0F1E36] border-t border-gray-800 px-6 py-3 flex items-center justify-between text-gray-400 z-50">
        <button className="flex flex-col items-center gap-1"><Home className="w-5 h-5" /><span className="text-[10px]">Akeyi</span></button>
        <button className="flex flex-col items-center gap-1"><Search className="w-5 h-5" /><span className="text-[10px]">Rechèch</span></button>
        <button className="flex flex-col items-center gap-1"><PlusSquare className="w-5 h-5" /><span className="text-[10px]">Paste</span></button>
        <button className="flex flex-col items-center gap-1"><Bell className="w-5 h-5" /><span className="text-[10px]">Notif</span></button>
        <button className="flex flex-col items-center gap-1 text-amber-500 font-bold"><User className="w-5 h-5" /><span className="text-[10px]">Profil</span></button>
      </nav>
    </div>
  );
};

export default ProfileScreen;
