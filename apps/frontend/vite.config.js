import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ===============================
// 🚀 MVP SAFE VITE CONFIG (FINAL)
// ===============================

export default defineConfig({
  plugins: [react()],

  // ===============================
  // 🌍 SERVER CONFIG
  // ===============================
  server: {
    port: 5173,
    strictPort: true,
    open: true,

    // ⚡ SAFE API proxy (IMPORTANT FOR FRONTEND/BACKEND)
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },

  // ===============================
  // 🧱 BUILD CONFIG
  // ===============================
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    target: "es2015",
    emptyOutDir: true
  },

  // ===============================
  // 🔍 PATH ALIAS SYSTEM
  // ===============================
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },

  // ===============================
  // ⚡ PERFORMANCE OPTIMIZATION
  // ===============================
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios"]
  }
});