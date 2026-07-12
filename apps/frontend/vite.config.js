import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "/",

  plugins: [react()],

  define: {
    __APP_VERSION__: JSON.stringify(
      process.env.npm_package_version || "1.0.0"
    ),
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
    host: true,        // expose on 0.0.0.0 so phones on same WiFi can connect
    strictPort: true,
    open: true,
    proxy: {
      // Proxy relative /api/v1 requests to the backend (only useful when
      // VITE_API_URL is not set and the frontend uses relative paths).
      "/api/v1": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "socket.io-client",
    ],
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    // Target ES2015 baseline so esbuild transpiles optional chaining, nullish
    // coalescing, etc. → supports iOS Safari 13+, Android Chrome 71+.
    // es2020 was causing blank screens on older phones/tablets.
    target: ["es2015", "safari13.1", "chrome71"],
    minify: "esbuild",

    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          network: ["axios", "socket.io-client"],
          icons: ["lucide-react"],
        },
      },
    },
  },

  esbuild: {
    drop: ["console", "debugger"],
  },
});