import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser({
        email: formData.identifier.includes('@') ? formData.identifier : undefined,
        phone: !formData.identifier.includes('@') ? formData.identifier : undefined,
        password: formData.password
      });

      if (data) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Idantifyan oswa modpas kòrèk. Rele ankò.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-text-inverse flex flex-col justify-between p-6 font-sans">
      
      {/* Spacing anlè a piske pa gen header nan desen LOGIN SCREEN nan image_28.png */}
      <div className="h-12"></div>

      {/* Tit Akèy la - Egzak ak desen an */}
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-display font-bold tracking-wide">Byenveni</h2>
        <p className="text-text-muted text-sm mt-2">Kontinye ak kont ou</p>
      </div>

      {/* Fòm nan */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-4 my-auto">
        
        {/* Si gen erè */}
        {error && (
          <div className="bg-danger-50 border border-danger-500 text-danger-600 text-xs p-3 rounded-xl text-center font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* Input Idantifyan (Telefòn oswa Imèl) */}
        <div className="flex flex-col gap-1">
          <input
            type="text"
            name="identifier"
            placeholder="Nimewo telefòn oswa imèl"
            value={formData.identifier}
            onChange={handleChange}
            required
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-sm text-text-inverse placeholder-text-muted focus:outline-none focus:border-brand-500 focus:shadow-glow transition-all"
          />
        </div>

        {/* Input Modpas ak ti je a */}
        <div className="relative flex flex-col gap-1">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Modpas"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full bg-navy-800 border border-navy-700 rounded-xl py-4 px-4 text-sm text-text-inverse placeholder-text-muted focus:outline-none focus:border-brand-500 focus:shadow-glow transition-all pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-text-muted hover:text-text-inverse text-lg"
          >
            👁️
          </button>
        </div>

        {/* Lyen Modpas Bliye */}
        <div className="text-center mt-2">
          <span 
            onClick={() => navigate('/forgot-password')} 
            className="text-xs text-brand-500 cursor-pointer hover:underline font-medium tracking-wide"
          >
            Mwen bliye modpas mwen
          </span>
        </div>

        {/* Gwo Bouton Login Lò/Jòn nan */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-400 text-navy-900 font-display font-bold py-4 rounded-xl shadow-card active:scale-95 hover:bg-gold-300 disabled:opacity-50 disabled:scale-100 transition-all text-center tracking-wide mt-4 text-sm"
        >
          {loading ? 'Y AP KONEKTE...' : 'Login'}
        </button>

        <div className="text-center mt-4">
          <p className="text-xs text-text-muted">Oswa</p>
        </div>

        {/* Bouton pou Kreye Kont */}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="w-full text-brand-400 hover:text-brand-500 font-medium py-2 text-xs tracking-wide transition-all"
        >
          Kreye yon nouvo kont
        </button>

      </form>

      {/* Spacing anba pou balanse layout a */}
      <div className="h-12"></div>
    </div>
  );
}
