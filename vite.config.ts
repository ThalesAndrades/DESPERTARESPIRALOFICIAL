import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",

  server: {
    host: true,
    port: 8080,
  },

  preview: {
    host: true,
    port: 4173,
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    target: "es2020",
    cssCodeSplit: true,
    cssMinify: true,
    minify: "esbuild",
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splits para melhor cache no Hostinger
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "@radix-ui/react-accordion",
            "@radix-ui/react-toast",
          ],
        },
      },
    },
  },
});
