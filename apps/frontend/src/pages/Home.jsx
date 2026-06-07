import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, Zap, ShieldCheck } from "lucide-react";

const FEATURE_ICONS = {
  post: PlusCircle,
  search: Search,
  fast: Zap,
  secure: ShieldCheck,
};

const TRANSLATIONS = {
  ht: {
    title: "JobFast",
    subtitle: "Jwenn Travay ak Sèvis Rapid",
    description: "Platfòm ki konekte travayè ak moun ki bezwen sèvis nan zòn Bávaro, Punta Cana.",
    register: "Kreye kont gratis",
    login: "Konekte",
    features: [
      { id: "post", title: "Poste Travay", desc: "Pibliye travay ou bezwen fè byen fasil" },
      { id: "search", title: "Chèche Sèvis", desc: "Jwenn plonbye, mason, oswa chef lakay" },
      { id: "fast", title: "Repons Rapid", desc: "Konsilte epi resevwa òf nan kèk minit" },
      { id: "secure", title: "Peman Sekirize", desc: "Tranzaksyon ak pwosesis ki garanti san pwoblèm" }
    ]
  },
  en: {
    title: "JobFast",
    subtitle: "Find Jobs & Services Fast",
    description: "Platform connecting workers with people needing services in Bávaro, Punta Cana.",
    register: "Create free account",
    login: "Login",
    features: [
      { id: "post", title: "Post Jobs", desc: "Publish jobs you need done easily" },
      { id: "search", title: "Find Services", desc: "Get plumbers, masons, or private chefs" },
      { id: "fast", title: "Fast Response", desc: "Receive competitive offers quickly" },
      { id: "secure", title: "Secure Payment", desc: "Safe and fully protected payment processing" }
    ]
  },
  es: {
    title: "JobFast",
    subtitle: "Encuentra Trabajos y Servicios",
    description: "Plataforma que conecta trabajadores con personas que necesitan servicios en Bávaro, Punta Cana.",
    register: "Crear cuenta gratis",
    login: "Iniciar sesión",
    features: [
      { id: "post", title: "Publicar Trabajos", desc: "Publica trabajos que necesitas hacer fácilmente" },
      { id: "search", title: "Buscar Servicios", desc: "Encuentra plomeros, maestros o chefs" },
      { id: "fast", title: "Respuesta Rápida", desc: "Recibe ofertas competitivas rápidamente" },
      { id: "secure", title: "Pago Seguro", desc: "Procesamiento de pago totalmente seguro" }
    ]
  },
  fr: {
    title: "JobFast",
    subtitle: "Trouvez des Travaux et Services",
    description: "Plateforme qui relie les travailleurs avec des personnes ayant besoin de services à Bávaro, Punta Cana.",
    register: "Créer un compte gratuit",
    login: "Se connecter",
    features: [
      { id: "post", title: "Publier des Travaux", desc: "Publiez les travaux à faire en quelques clics" },
      { id: "search", title: "Trouver des Services", desc: "Trouvez des plombiers, maçons ou chefs" },
      { id: "fast", title: "Réponse Rapide", desc: "Recevez des offres compétitives rapidement" },
      { id: "secure", title: "Paiement Sécurisé", desc: "Traitement de paiement totalement sécurisé" }
    ]
  }
};

const getDefaultLanguage = () => {
  const browserLang = navigator.language?.slice(0, 2) || "ht";
  return ["ht", "en", "es", "fr"].includes(browserLang) ? browserLang : "ht";
};

const getSavedLanguage = () => localStorage.getItem("jobfast-lang");

export default function Home() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(getSavedLanguage() || getDefaultLanguage());
  const t = TRANSLATIONS[lang] || TRANSLATIONS.ht;

  const changeLanguage = (language) => {
    localStorage.setItem("jobfast-lang", language);
    setLang(language);
  };

  const languageLabels = { ht: "HT", en: "EN", es: "ES", fr: "FR" };

  return (
    <main className="flex min-h-screen w-full flex-col animate-fade-in items-center justify-center bg-navy-900 p-6 font-sans text-white select-none">
      <section aria-label="Akèy JobFast" className="w-full max-w-sm text-center" role="region">
        
        <div className="flex justify-center gap-2 mb-10">
          {['ht', 'en', 'es', 'fr'].map((l) => (
            <button
              key={l}
              onClick={() => changeLanguage(l)}
              aria-label={`Chanje lang an ${languageLabels[l]}`}
              aria-current={lang === l ? 'true' : undefined}
              className={`rounded-xl border px-3 py-1.5 text-xs font-black tracking-wider transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20 ${
                lang === l 
                  ? 'bg-gold-400 text-navy-950 shadow-md shadow-gold-400/10 border-gold-400' 
                  : 'bg-navy-800/40 text-slate-400 border-slate-800/40 hover:text-white'
              }`}
            >
              {languageLabels[l]}
            </button>
          ))}
        </div>

        <h1 className="text-4xl font-black mb-1 tracking-tight text-white">{t.title}</h1>
        <h2 className="text-xs font-black uppercase tracking-widest text-gold-400 mb-4">{t.subtitle}</h2>
        <p className="text-xs font-medium mb-10 px-2 leading-relaxed text-slate-400">{t.description}</p>

        <div className="flex flex-col gap-3.5 mb-10">
          <button 
            onClick={() => navigate("/register")}
            className="w-full py-4 active:scale-[0.98] bg-gold-400 rounded-2xl font-black text-xs shadow-lg shadow-gold-400/5 uppercase tracking-widest text-navy-950 transition-all hover:bg-gold-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
          >
            {t.register}
          </button>

          <button 
            onClick={() => navigate("/login")}
            className="w-full py-4 active:scale-[0.98] border border-slate-800 bg-navy-800/10 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-200 transition-all hover:border-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-500/20"
          >
            {t.login}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {t.features.map((feature) => {
            const IconComponent = FEATURE_ICONS[feature.id];
            return (
              <div key={feature.id} className="border border-slate-800/60 bg-navy-800/20 p-4 rounded-2xl text-left transition-all hover:border-slate-700">
                <div className="flex h-9 w-9 items-center justify-center mb-3 rounded-xl border border-navy-800 bg-navy-900 text-gold-400 shadow-inner">
                  {IconComponent && <IconComponent className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
                </div>
                <h3 className="font-bold text-xs mb-0.5 tracking-wide text-white">{feature.title}</h3>
                <p className="text-[10px] font-medium leading-normal text-slate-400">{feature.desc}</p>
              </div>
            );
          })}
        </div>
        
      </section>
    </main>
  );
}
