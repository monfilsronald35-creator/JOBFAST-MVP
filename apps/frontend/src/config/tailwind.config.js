/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF6FF",
          100: "#D9EBFF",
          200: "#B8D7FF",
          300: "#8BBEFF",
          400: "#5E9EFF",
          500: "#1E88E5",
          600: "#166FD1",
          700: "#1258A6",
          800: "#0E417A",
          900: "#0A2A4F",
        },
        // Koulè Navy yo optimize pou UI Dark Mode primòm lan match ak dashboard la
        navy: {
          50: "#EAF0F7",
          100: "#D5DFEC",
          200: "#AABFD9",
          300: "#809FC6",
          400: "#567FB3",
          500: "#2C5F9F",
          600: "#214A7D",
          700: "#17365B",
          800: "#0f172a", // Koulè fon fonse pou kat yo ak konpozan yo
          900: "#090d16", // Background jeneral Dashboard la
          950: "#05070c", // Tab bar anba nèt ak zòn ki pi fonse yo
        },
        gold: {
          50: "#FFF9E6",
          100: "#FFF1BF",
          200: "#FFE58A",
          300: "#FFD94D",
          400: "#F5C518", // Koulè lò pwofesyonèl ou an
          500: "#E0AD00",
          600: "#B98600",
          700: "#8F6500",
          800: "#664600",
          900: "#3D2700",
        },
        success: {
          50: "#ECFDF3",
          500: "#16A34A",
          600: "#15803D",
        },
        danger: {
          50: "#FEF2F2",
          500: "#DC2626",
          600: "#B91C1C",
        },
        surface: {
          DEFAULT: "#F7F9FC",
          card: "#FFFFFF",
          muted: "#EEF2F7",
          dark: "#081120",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
          inverse: "#FFFFFF", // Pou tèks blan yo nan dark mode a
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Poppins", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(15, 23, 42, 0.08)",
        card: "0 10px 30px rgba(2, 6, 23, 0.10)",
        glow: "0 0 0 4px rgba(245, 197, 24, 0.20)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #0B1F3A 0%, #17365B 45%, #1E88E5 100%)",
        "premium-gradient":
          "linear-gradient(135deg, #0B1F3A 0%, #214A7D 55%, #F5C518 130%)",
      },
      screens: {
        xs: "360px",
        "3xl": "1680px",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      zIndex: {
        60: "60",
        70: "70",
      },
    },
  },
  plugins: [],
};
