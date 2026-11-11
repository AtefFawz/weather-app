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
      injectRegister: "auto",
      registerType: "autoUpdate",
      // iOS reads launch artwork from the HTML head; do not force-download every device size into the SW cache.
      includeAssets: ["favicon.svg", "icons/*.png", "icons/*.svg", "screenshots/*.png"],
      manifest: {
        id: base,
        name: "Aether — the weather, as a living sky",
        short_name: "Aether",
        description: "A live, personal weather experience shaped by the sky around you.",
        lang: "en",
        categories: ["weather", "utilities", "lifestyle"],
        theme_color: "#0b1026",
        background_color: "#0b1026",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        launch_handler: { client_mode: "navigate-existing" },
        orientation: "any",
        start_url: base,
        scope: base,
        prefer_related_applications: false,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          {
            src: "screenshots/aether-mobile.png",
            sizes: "585x1266",
            type: "image/png",
            form_factor: "narrow",
            label: "Aether weather dashboard on mobile",
          },
          {
            src: "screenshots/aether-dashboard.png",
            sizes: "1020x1494",
            type: "image/png",
            label: "Aether weather dashboard",
          },
        ],
      },
      // The production worker is exercised through `npm run preview`; keep it out of Vite HMR.
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        globIgnores: ["launch/**"],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        importScripts: ["sw-custom.js"],
        // Forecast responses are cached by the app's validated local cache; avoid a second opaque API cache.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: { target: "es2022", sourcemap: true },
  server: { port: 5173 },
  preview: { port: 4173 },
});
