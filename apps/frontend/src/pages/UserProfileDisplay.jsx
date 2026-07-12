import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, PROFESSION_METADATA } from '../constants/categories';
import AvatarUpload from '../components/AvatarUpload';

function UserProfileDisplay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayUser, setDisplayUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);

  if (!displayUser) {
    return (
      <main className="min-h-screen bg-navy-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Karge pwofil...</p>
        </div>
      </main>
    );
  }

  const category = Object.values(CATEGORIES).find(c => c.id === displayUser.category);
  const profession = PROFESSION_METADATA[displayUser.profession];

  const getProfilePhoto = () => {
    if (displayUser.profileMetadata?.profilePhoto) {
      return displayUser.profileMetadata.profilePhoto;
    }
    return null;
  };

  const getInitialLetter = () => {
    return (displayUser.name || 'U').charAt(0).toUpperCase();
  };

  const profilePhoto = getProfilePhoto();

  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Cover Photo */}
      <div className="h-40 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 relative">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 right-4 bg-yellow-400 text-black px-4 py-2 rounded font-bold hover:bg-yellow-300 transition"
        >
          {isEditing ? '✓ Fini' : '✏️ Modifye'}
        </button>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-20 relative z-10">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={displayUser.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-5xl font-bold border-4 border-yellow-400 shadow-lg">
              {getInitialLetter()}
            </div>
          )}
        </div>

        {/* Main Info Card */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{displayUser.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-2 text-gray-300">
              <span className="text-2xl">{category?.icon}</span>
              <span className="font-semibold">{profession?.label || displayUser.profession}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">📍 {displayUser.location || 'Punta Cana, Haiti'}</p>
          </div>

          {/* Rating & Stats */}
          <div className="grid grid-cols-3 gap-4 text-center py-4 border-y border-gray-700 mb-4">
            <div>
              <div className="text-2xl font-bold text-yellow-400">⭐ 5.0</div>
              <div className="text-xs text-gray-400">Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold">0</div>
              <div className="text-xs text-gray-400">Travay</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{displayUser.profileCompleteness || 0}%</div>
              <div className="text-xs text-gray-400">Konplè</div>
            </div>
          </div>

          {/* Bio */}
          {displayUser.profileMetadata?.bio && (
            <div className="mb-4">
              <h3 className="text-sm font-bold text-yellow-400 mb-2">Bio</h3>
              <p className="text-sm text-gray-300">{displayUser.profileMetadata.bio}</p>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-gray-700/30 rounded p-4 space-y-2">
            <h3 className="text-sm font-bold text-yellow-400 mb-3">Enfòmasyon Kontak</h3>
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span>📧</span>
                <span className="text-gray-300">{displayUser.email}</span>
              </div>
              {displayUser.phone && (
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span className="text-gray-300">{displayUser.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Details */}
        {Object.keys(displayUser.profileMetadata || {}).length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-yellow-400 mb-4">Detay Pwofesyonèl</h2>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(displayUser.profileMetadata).map(([key, value]) => {
                if (key === 'profilePhoto' || key === 'bio' || !value) return null;
                return (
                  <div key={key}>
                    <div className="text-xs text-gray-400 font-semibold uppercase">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="text-sm text-gray-200 mt-1">
                      {typeof value === 'boolean' ? (value ? '✓ Wi' : '✗ Non') : String(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Info */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">Kategori</h2>
          <div className="bg-gray-700/30 rounded p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{category?.icon}</span>
              <div>
                <h3 className="font-bold">{category?.label}</h3>
                <p className="text-sm text-gray-400">{category?.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button onClick={() => navigate('/chat')}
            className="bg-yellow-400 text-black px-4 py-3 rounded font-bold hover:bg-yellow-300 transition">
            💬 Mesaj
          </button>
          <button onClick={() => navigate(`/rating/${displayUser._id || displayUser.id || ''}`)}
            className="bg-green-600 text-white px-4 py-3 rounded font-bold hover:bg-green-700 transition">
            ⭐ Evalye
          </button>
        </div>
      </div>
    </main>
  );
}

export default UserProfileDisplay;
