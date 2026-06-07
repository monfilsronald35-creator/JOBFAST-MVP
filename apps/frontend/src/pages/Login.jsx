import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import { loginUser } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const isEmail = formData.identifier.includes("@");
      const data = await loginUser({
        email: isEmail ? formData.identifier : undefined,
        phone: !isEmail ? formData.identifier : undefined,
        password: formData.password,
      });

      if (data) navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Idantifyan oswa modpas pa kòrèk. Tanpri reye ankò.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-navy-900 px-6 py-12 font-sans">
      <div className="h-12" />

      <div className="flex flex-col items-center text-center">
        <h2 className="font-display text-3xl font-bold tracking-wide text-white">Byenveni</h2>
        <p className="mt-2 text-sm text-slate-400">Kontinye ak kont ou</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto my-auto flex w-full max-w-sm flex-col gap-4">
        {error && (
          <div
            role="alert"
            className="animate-fade-in rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-xs font-semibold text-red-400"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="identifier" className="text-xs font-medium text-slate-400">
            Telefòn oswa imèl
          </label>
          <input
            id="identifier"
            type="text"
            name="identifier"
            placeholder="Nimewo telefòn oswa imèl"
            autoComplete="username"
            value={formData.identifier}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-navy-700 bg-navy-800 px-4 py-4 text-sm placeholder-slate-500 transition-all focus:border-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          />
        </div>

        <div className="relative flex flex-col gap-1">
          <label htmlFor="password" className="text-xs font-medium text-slate-400">
            Modpas
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Modpas"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-navy-700 bg-navy-800 px-4 py-4 pr-16 text-sm placeholder-slate-500 transition-all focus:border-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Kache modpas" : "Montre modpas"}
            aria-pressed={showPassword}
            className="absolute right-4 top-10 text-xs font-bold text-slate-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          >
            {showPassword ? "Kache" : "Montre"}
          </button>
        </div>

        <div className="mt-1 text-center">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs font-medium tracking-wide text-gold-400 transition-colors hover:text-gold-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
          >
            Mwen bliye modpas mwen
          </button>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="mt-2 w-full">
          Konekte
        </Button>

        <div className="my-1 text-center">
          <p className="text-xs text-slate-500">Oswa</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="w-full py-2 text-xs font-semibold tracking-wide text-gold-400 transition-colors hover:text-gold-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/10"
        >
          Kreye yon nouvo kont
        </button>
      </form>

      <div className="h-12" />
    </div>
  );
}
