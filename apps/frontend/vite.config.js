import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// ======================================================
// 🧱 RESOLVE __DIRNAME (ES MODULES FIX)
// ======================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// 🚀 JOBFAST — VITE CONFIG (ENTERPRISE PRODUCTION READY)
// ======================================================
export default defineConfig({
  plugins: [react()],

  // ======================================================
  // 🌍 ENV SUPPORT (VERSION TRACKING)
  // ======================================================
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },

  // ======================================================
  // 🌍 LOCAL DEVELOPMENT SERVER
  // ======================================================
  server: {
    port: 5173,
    strictPort: true,
    open: true,

    // ⚡ SAFE API PROXY
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },

  // ======================================================
  // 🧱 PRODUCTION BUILD ARCHITECTURE
  // ======================================================
  build: {
    outDir: "dist",
    sourcemap: false,

    // 🔐 SECURITY UPGRADE (Terser minification)
    minify: "terser",

    target: "es2020",
    emptyOutDir: true,

    // ⚡ CODE SPLITTING (PERFORMANCE BOOST)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "axios"
          ]
        }
      }
    }
  },

  // ======================================================
  // 🔍 PATH ALIAS SYSTEM
  // ======================================================
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },

  // ======================================================
  // ⚡ PERFORMANCE PRE-OPTIMIZATION
  // ======================================================
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios"
    ]
  }
});