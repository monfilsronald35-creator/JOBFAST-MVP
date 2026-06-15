/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {

      /* ================= COLORS SYSTEM ================= */
      colors: {
        navy: {
          950: "#050B18",
          900: "#0B1528",
          800: "#162238",
          700: "#1F2C44",
        },

        gold: {
          400: "#F5C542",
          500: "#E6B93A",
          600: "#C99A2E",
        },

        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",
      },

      /* ================= TYPOGRAPHY ================= */
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      /* ================= ANIMATIONS ================= */
      animation: {
        "fade-in": "fadeIn 0.4s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
        "bounce-soft": "bounceSoft 1.8s infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },

      /* ================= SHADOW SYSTEM ================= */
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.3)",
        glow: "0 0 20px rgba(245, 197, 66, 0.25)",
        card: "0 8px 25px rgba(0,0,0,0.25)",

        stripe: "0 12px 35px rgba(50, 50, 93, 0.15)",
        chat: "0 4px 12px rgba(0,0,0,0.2)",
        map: "0 6px 20px rgba(0,0,0,0.25)",
      },

      /* ================= BORDER RADIUS ================= */
      borderRadius: {
        xl2: "1.25rem",
        xxl: "1.75rem",
        full2: "2rem",
      },

      /* ================= SPACING ================= */
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
      },

      /* ================= BREAKPOINTS ================= */
      screens: {
        xs: "360px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },

      /* ================= Z-INDEX SYSTEM ================= */
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },

      /* ================= UI TOKENS ================= */

      dropShadow: {
        stripe: "0 10px 20px rgba(0,0,0,0.12)",
      },

      backgroundImage: {
        "chat-pattern":
          "radial-gradient(circle at 20px 20px, rgba(255,255,255,0.05) 1px, transparent 0)",
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};