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
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  server: {
    port: 5173,
    strictPort: true,
    open: true,
    proxy: {
      "/v1": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
    emptyOutDir: true,

    rollupOptions: {
      // 👑 KOREKSYON: Sa a ap fòse Rollup inyore bloka socket la pou Vercel ka pase san erè!
      external: ["socket.io-client"],
      
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "axios",
          ],
        },
      },
    },
  },

  esbuild: {
    drop: ["console", "debugger"],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
    ],
  },
});
