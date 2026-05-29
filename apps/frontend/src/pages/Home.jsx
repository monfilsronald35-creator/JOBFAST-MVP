// ======================================================
// 🌍 src/pages/Home.jsx
// 🚀 JOBFAST PREMIUM MULTI-LANGUAGE MOBILE LANDING
// ======================================================

import React, {
  memo,
  useMemo,
  useState,
  useEffect,
} from "react";

import { useNavigate } from "react-router-dom";

// ======================================================
// 🌐 TRANSLATIONS
// ======================================================

const translations = Object.freeze({
  ht: {
    tagline: "Travay • Sèvis • Biznis • GPS",
    badge: "🌍 GLOBAL MARKETPLACE",
    title: "Bienvenue sou JOBFAST",
    description:
      "Konekte ak travay, sèvis, biznis ak opòtinite bò kote ou an tan reyèl.",
    register: "Kreye Kont",
    login: "Konekte",
    features: [
      {
        icon: "👷",
        title: "Travay",
        desc: "Jwenn mason, bòs, elektrisyen ak plis ankò.",
      },
      {
        icon: "🏢",
        title: "Biznis",
        desc: "Dekouvri biznis ak sèvis bò kote ou.",
      },
      {
        icon: "🚀",
        title: "Sèvis",
        desc: "Livrezon, taxi, enfimyè, chef ak plis.",
      },
      {
        icon: "📍",
        title: "GPS",
        desc: "Rechèch nearby ak distans an tan reyèl.",
      },
    ],
  },

  en: {
    tagline: "Jobs • Services • Business • GPS",
    badge: "🌍 GLOBAL MARKETPLACE",
    title: "Welcome to JOBFAST",
    description:
      "Connect with jobs, services, businesses and nearby opportunities in real time.",
    register: "Create Account",
    login: "Login",
    features: [
      {
        icon: "👷",
        title: "Jobs",
        desc: "Find masons, electricians, workers and more.",
      },
      {
        icon: "🏢",
        title: "Business",
        desc: "Discover businesses and services nearby.",
      },
      {
        icon: "🚀",
        title: "Services",
        desc: "Delivery, taxi, nurses, chefs and more.",
      },
      {
        icon: "📍",
        title: "GPS",
        desc: "Nearby search and real-time distance.",
      },
    ],
  },

  es: {
    tagline: "Trabajo • Servicios • Negocios • GPS",
    badge: "🌍 MERCADO GLOBAL",
    title: "Bienvenido a JOBFAST",
    description:
      "Conéctate con trabajos, servicios, negocios y oportunidades cercanas en tiempo real.",
    register: "Crear Cuenta",
    login: "Iniciar Sesión",
    features: [
      {
        icon: "👷",
        title: "Trabajo",
        desc: "Encuentra albañiles, electricistas y más.",
      },
      {
        icon: "🏢",
        title: "Negocios",
        desc: "Descubre negocios y servicios cercanos.",
      },
      {
        icon: "🚀",
        title: "Servicios",
        desc: "Taxi, delivery, enfermeras y más.",
      },
      {
        icon: "📍",
        title: "GPS",
        desc: "Búsqueda cercana y distancia en tiempo real.",
      },
    ],
  },

  fr: {
    tagline: "Travail • Services • Entreprises • GPS",
    badge: "🌍 MARKETPLACE GLOBAL",
    title: "Bienvenue sur JOBFAST",
    description:
      "Connectez-vous aux emplois, services et opportunités proches de vous en temps réel.",
    register: "Créer un compte",
    login: "Connexion",
    features: [
      {
        icon: "👷",
        title: "Travail",
        desc: "Trouvez maçons, électriciens et plus.",
      },
      {
        icon: "🏢",
        title: "Entreprises",
        desc: "Découvrez des entreprises proches.",
      },
      {
        icon: "🚀",
        title: "Services",
        desc: "Livraison, taxi, infirmiers et plus.",
      },
      {
        icon: "📍",
        title: "GPS",
        desc: "Recherche nearby en temps réel.",
      },
    ],
  },
});

// ======================================================
// 🌐 DEFAULT LANGUAGE (SSR SAFE)
// ======================================================

const getDefaultLanguage = () => {
  try {
    if (typeof navigator === "undefined") return "ht";

    const lang = navigator.language?.slice(0, 2)?.toLowerCase();

    return translations[lang] ? lang : "ht";
  } catch {
    return "ht";
  }
};

// ======================================================
// 🔒 SAFE LOCAL STORAGE
// ======================================================

const getSavedLanguage = () => {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("jobfast-lang");
  } catch {
    return null;
  }
};

// ======================================================
// 🚀 COMPONENT
// ======================================================

function Home() {
  const navigate = useNavigate();

  // 🌐 STATE
  const [lang, setLang] = useState(() => {
    return getSavedLanguage() || getDefaultLanguage();
  });

  // 🧠 SAFE TRANSLATIONS
  const t = useMemo(() => {
    return translations[lang] || translations.ht;
  }, [lang]);

  // 🌐 HTML LANG UPDATE
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  // 🌐 CHANGE LANGUAGE
  const changeLanguage = (language) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("jobfast-lang", language);
      }
    } catch {}

    setLang(language);
  };

  // 🧠 FEATURES MEMO
  const featureCards = useMemo(() => {
    return t.features.map((feature) => (
      <div key={feature.title} style={styles.featureCard}>
        <span style={styles.icon}>{feature.icon}</span>
        <h3 style={styles.featureTitle}>{feature.title}</h3>
        <p style={styles.featureDescription}>{feature.desc}</p>
      </div>
    ));
  }, [lang]);

  return (
    <main style={styles.page}>
      <section style={styles.card}>

        {/* LANGUAGE SWITCHER */}
        <div style={styles.languageBar}>

          <button
            type="button"
            aria-label="Kreyòl"
            aria-pressed={lang === "ht"}
            style={{
              ...styles.langButton,
              ...(lang === "ht" && styles.langButtonActive),
            }}
            onClick={() => changeLanguage("ht")}
          >
            🇭🇹
          </button>

          <button
            type="button"
            aria-label="English"
            aria-pressed={lang === "en"}
            style={{
              ...styles.langButton,
              ...(lang === "en" && styles.langButtonActive),
            }}
            onClick={() => changeLanguage("en")}
          >
            🇺🇸
          </button>

          <button
            type="button"
            aria-label="Español"
            aria-pressed={lang === "es"}
            style={{
              ...styles.langButton,
              ...(lang === "es" && styles.langButtonActive),
            }}
            onClick={() => changeLanguage("es")}
          >
            🇪🇸
          </button>

          <button
            type="button"
            aria-label="Français"
            aria-pressed={lang === "fr"}
            style={{
              ...styles.langButton,
              ...(lang === "fr" && styles.langButtonActive),
            }}
            onClick={() => changeLanguage("fr")}
          >
            🇫🇷
          </button>

        </div>

        {/* HERO */}
        <h1 style={styles.title}>{t.title}</h1>
        <p style={styles.description}>{t.description}</p>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <button type="button" onClick={() => navigate("/register")}>
            {t.register}
          </button>

          <button type="button" onClick={() => navigate("/login")}>
            {t.login}
          </button>
        </div>

        {/* FEATURES */}
        <div style={styles.features}>{featureCards}</div>

      </section>
    </main>
  );
}

// ======================================================
// 🎨 MINIMAL STYLES (kept simple here)
// ======================================================

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "#fff",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    textAlign: "center",
  },

  languageBar: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },

  langButton: {
    padding: 8,
    borderRadius: 10,
    background: "#1e293b",
    border: "none",
    cursor: "pointer",
  },

  langButtonActive: {
    background: "#3b82f6",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
  },

  description: {
    opacity: 0.8,
    marginBottom: 20,
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },

  features: {
    display: "grid",
    gap: 10,
  },

  featureCard: {
    background: "#1e293b",
    padding: 12,
    borderRadius: 12,
  },

  icon: { fontSize: 22 },

  featureTitle: { fontWeight: "bold" },

  featureDescription: { fontSize: 12, opacity: 0.8 },
};

export default memo(Home);