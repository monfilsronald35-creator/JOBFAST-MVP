import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants/categories';

function HomeMarketplace() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    // Will navigate to category-specific page
    navigate(`/marketplace/${categoryId}`);
  };

  const handlePostJob = () => {
    navigate('/post-job');
  };

  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 p-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">JOBFAST</h1>
          <p className="text-gray-300">Platfòm entènasyonal pou biznis, sèvis, ak opòtinite</p>
        </div>
      </div>

      {/* Quick Action */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={handlePostJob}
          className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-300 transition flex items-center justify-center gap-2"
        >
          ➕ Pibliye Travay oswa Sèvis
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Chèche travayè, biznis, oswa sèvis..."
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none"
          />
          <button className="absolute right-3 top-3 text-xl">🔍</button>
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Chwazi Yon Kategori</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(CATEGORIES).map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="p-6 rounded-lg border-2 border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-yellow-400 transition transform hover:scale-105 text-left"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="text-xl font-bold mb-2">{category.label}</h3>
              <p className="text-sm text-gray-400 mb-4">{category.description}</p>
              <div className="text-xs text-yellow-400 font-semibold">
                {category.professions.length} pwofesyon →
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-800/30 py-12 mt-8">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Kijan Li Travay</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* For Job Seekers */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3 text-blue-400">👷</div>
              <h3 className="text-lg font-bold mb-3">Pou Moun kap Chèche Travay</h3>
              <ol className="text-sm text-gray-300 space-y-2">
                <li>✓ Kreye pwofil ou</li>
                <li>✓ Chwazi kategori ak metye</li>
                <li>✓ Ranpli detay pwofesyonèl</li>
                <li>✓ Resevwa notifikasyon pou travay</li>
                <li>✓ Konekte avèk kliyans</li>
              </ol>
            </div>

            {/* For Businesses */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3 text-green-400">🏢</div>
              <h3 className="text-lg font-bold mb-3">Pou Konpayi</h3>
              <ol className="text-sm text-gray-300 space-y-2">
                <li>✓ Enskripsyon gratis</li>
                <li>✓ Kreye pwofil biznis</li>
                <li>✓ Pivlisize sèvis ou</li>
                <li>✓ Jwenn kliyan lokal</li>
                <li>✓ Dirèk kominikasyon</li>
              </ol>
            </div>

            {/* For Tourists */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3 text-purple-400">✈️</div>
              <h3 className="text-lg font-bold mb-3">Pou Touris</h3>
              <ol className="text-sm text-gray-300 space-y-2">
                <li>✓ Chèche Hotel ak Gid</li>
                <li>✓ Rezève Transport</li>
                <li>✓ Bon Manje Lokal</li>
                <li>✓ Aktivite ak Ekskursyon</li>
                <li>✓ Konekte avèk Moun Lokal</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Listings (Placeholder) */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Lis Dèniè</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg overflow-hidden hover:border-yellow-400 border border-gray-700 transition cursor-pointer">
              <div className="h-40 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex items-center justify-center text-gray-600">
                [Imaj]
              </div>
              <div className="p-4">
                <h3 className="font-bold">Dèniè Lis #{i}</h3>
                <p className="text-sm text-gray-400">Bavaro, Punta Cana</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-yellow-400">⭐ 5.0</span>
                  <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded">Vizit</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 py-12 my-8">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-2xl font-bold mb-4">Kòmanse Tou Senpli</h2>
          <p className="text-gray-300 mb-6">JOBFAST se platfòm gratis pou tout moun. Enskripsyon an minit, epi kòmanse chèche oswa publiye travay/sèvis tou swe.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition"
            >
              Kreye Kont Kounye a
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-gray-700 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-600 transition"
            >
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-6 text-center text-sm text-gray-400">
        <p>© 2024 JOBFAST. Tout dwa rezève. | Platform entènasyonal pou moun nan tout mond</p>
      </footer>
    </main>
  );
}

export default HomeMarketplace;
