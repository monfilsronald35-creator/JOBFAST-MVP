import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CATEGORIES, PROFESSION_METADATA } from '../constants/categories';

function CategoryMarketplace() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [filterProfession, setFilterProfession] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const category = Object.values(CATEGORIES).find(c => c.id === categoryId);

  if (!category) {
    return (
      <main className="min-h-screen bg-navy-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Kategori pa jwenn</p>
          <button
            onClick={() => navigate('/')}
            className="bg-yellow-400 text-black px-4 py-2 rounded font-bold"
          >
            Retounen
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 p-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-2xl hover:opacity-70"
          >
            ⬅️
          </button>
          <div>
            <div className="text-4xl mb-2">{category.icon}</div>
            <h1 className="text-3xl font-bold">{category.label}</h1>
            <p className="text-gray-300">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6 border-b border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profession Filter */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Pwofesyon</label>
            <select
              value={filterProfession}
              onChange={(e) => setFilterProfession(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white focus:border-yellow-400 outline-none"
            >
              <option value="all">Tout Pwofesyon</option>
              {category.professions.map(prof => (
                <option key={prof} value={prof}>
                  {PROFESSION_METADATA[prof]?.label || prof}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Triye</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white focus:border-yellow-400 outline-none"
            >
              <option value="recent">Dèniè</option>
              <option value="rating">Top Yo</option>
              <option value="nearby">Ki Pre</option>
            </select>
          </div>

          {/* Location Search */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">Lokalizasyon</label>
            <input
              type="text"
              placeholder="Bavaro, Punta Cana..."
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sample Listings */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              onClick={() => navigate('/profile')}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-yellow-400 transition cursor-pointer transform hover:scale-105"
            >
              {/* Avatar */}
              <div className="h-32 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl font-bold">
                  {String.fromCharCode(65 + i)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-lg">Pwofesyonèl #{i}</h3>
                <p className="text-sm text-gray-400 mb-2">
                  {PROFESSION_METADATA[category.professions[i % category.professions.length]]?.label}
                </p>
                <p className="text-xs text-gray-500 mb-3">📍 Bavaro, Punta Cana</p>

                {/* Rating & Stats */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-yellow-400 text-sm">⭐ 5.0 ({i * 10} evals)</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Disponib</span>
                </div>

                {/* Bio */}
                <p className="text-xs text-gray-300 mb-3 line-clamp-2">
                  Eksperyans de {i} ane nan metye a. Travay kalite garantye ak pri rasonab.
                </p>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-yellow-400 text-black px-3 py-2 rounded text-xs font-bold hover:bg-yellow-300 transition">
                    📧 Kontakte
                  </button>
                  <button className="bg-gray-700 text-white px-3 py-2 rounded text-xs hover:bg-gray-600 transition">
                    ⭐ Evalye
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Pa kontan rezilta? Eseye:
            <br/>• Chanje filtè
            <br/>• Chèche yon lòt kategori
            <br/>• Pibliye yon demand travay
          </p>
        </div>
      </div>
    </main>
  );
}

export default CategoryMarketplace;
