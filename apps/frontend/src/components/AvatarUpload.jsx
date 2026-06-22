import React, { useState, useCallback, useRef } from 'react';

function AvatarUpload({ onPhotoChange, initialPhoto, userName = 'User' }) {
  const [preview, setPreview] = useState(initialPhoto);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const getInitialLetter = () => {
    return userName.charAt(0).toUpperCase();
  };

  const handlePhotoSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Foto a twò gwo. Maksimòm 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Tanpri chwazi yon imaj (PNG, JPG, GIF)');
      return;
    }

    setLoading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        setPreview(result);
        onPhotoChange(file, result);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file:', err);
      alert('Erè ann nan chaje foto a');
    } finally {
      setLoading(false);
    }
  }, [onPhotoChange]);

  const handleClick = () => {
    if (!loading) {
      fileInputRef.current?.click();
    }
  };

  if (preview) {
    return (
      <div className="relative w-32 h-32 mx-auto mb-4">
        <img
          src={preview}
          alt="Profile"
          className="w-full h-full rounded-full object-cover border-4 border-yellow-400"
        />
        <button
          onClick={handleClick}
          disabled={loading}
          className="absolute bottom-0 right-0 bg-yellow-400 text-black rounded-full p-2 hover:bg-yellow-300 transition"
          title="Chanje foto"
        >
          📷
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
          disabled={loading}
        />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-4xl font-bold text-white hover:shadow-lg transition border-4 border-yellow-400 relative overflow-hidden"
      >
        <div className="flex flex-col items-center">
          <span>{getInitialLetter()}</span>
          <span className="text-xs mt-1">📷</span>
        </div>
        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="animate-spin">⏳</div>
          </div>
        )}
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">Klike pou ajoute foto</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
        disabled={loading}
      />
    </div>
  );
}

export default AvatarUpload;
