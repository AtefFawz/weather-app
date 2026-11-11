import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// BASE_PATH lets the same build be served from a sub-path (e.g. GitHub Pages: /aether/).
const base = process.env["BASE_PATH"] ?? "/";

export default defineConfig({
  base,
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  plugins: [
    react({ babel: { plugins: [["babel-plugin-react-compiler", {}]] } }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "Aether — the weather, as a living sky",
        short_name: "Aether",
        description: "A live sky driven by real solar geometry and the forecast.",
        theme_color: "#0b1026",
        background_color: "#0b1026",
        display: "standalone",
        start_url: base,
        scope: base,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: `${base}index.html`,
        // API responses are cached by the app itself (stale-while-revalidate); never by the service worker.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: { target: "es2022", sourcemap: true },
  server: { port: 5173 },
  preview: { port: 4173 },
});
