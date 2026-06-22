import React, { useState, memo, useCallback } from 'react';

function Step3_BasicInfo({ data, onNext, loading }) {
  const [localData, setLocalData] = useState(data);
  const [passwordMatch, setPasswordMatch] = useState(true);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value }));

    if (name === 'confirmPassword' || name === 'password') {
      const pwd = name === 'password' ? value : localData.password;
      const confirm = name === 'confirmPassword' ? value : localData.confirmPassword;
      setPasswordMatch(pwd === confirm);
    }
  }, [localData]);

  const isValid = localData.fullName && localData.email && localData.phone && localData.password && passwordMatch;

  const handleSubmit = () => {
    if (isValid) {
      onNext(localData);
    }
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="text"
        name="fullName"
        placeholder="Non konplè"
        value={localData.fullName}
        onChange={handleChange}
        className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
      />

      <input
        type="email"
        name="email"
        placeholder="Imèl"
        value={localData.email}
        onChange={handleChange}
        className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
      />

      <input
        type="tel"
        name="phone"
        placeholder="Nimewo telefòn"
        value={localData.phone}
        onChange={handleChange}
        className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
      />

      <input
        type="text"
        name="location"
        placeholder="Kote (Vil, Vil)"
        value={localData.location}
        onChange={handleChange}
        className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
      />

      <input
        type="password"
        name="password"
        placeholder="Modpas"
        value={localData.password}
        onChange={handleChange}
        className="w-full p-3 rounded bg-navy-800 border border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition"
      />

      <div>
        <input
          type="password"
          name="confirmPassword"
          placeholder="Konfime modpas"
          value={localData.confirmPassword}
          onChange={handleChange}
          className={`w-full p-3 rounded bg-navy-800 border ${
            passwordMatch ? 'border-gray-600' : 'border-red-500'
          } text-white placeholder-gray-400 focus:border-yellow-400 outline-none transition`}
        />
        {!passwordMatch && (
          <p className="text-xs text-red-400 mt-1">Modpas yo pa konbine</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className={`w-full p-4 rounded font-bold transition ${
          isValid && !loading
            ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
            : 'bg-gray-500 text-gray-300 cursor-not-allowed'
        }`}
      >
        {loading ? 'Ap trete...' : 'Pwochen'}
      </button>
    </div>
  );
}

export default memo(Step3_BasicInfo);
