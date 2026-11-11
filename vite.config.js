import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  const base = process.env.BASE_PATH ?? "/";

  return {
    // GitHub Pages can set BASE_PATH=/weather-app/. Local installs use /.
    base,
    plugins: [
      react(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.js",
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icons/*.png"],
        manifest: {
          id: base,
          name: "Aether Weather",
          short_name: "Aether",
          description:
            "Live weather, hourly outlook, and a 7-day forecast. Installable, offline, with location and alerts.",
          theme_color: "#101827",
          background_color: "#101827",
          display: "standalone",
          orientation: "any",
          start_url: base,
          scope: base,
          categories: ["weather"],
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          shortcuts: [
            {
              name: "Current weather",
              short_name: "Now",
              url: base,
              icons: [
                {
                  src: "icons/icon-192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
              ],
            },
          ],
        },
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
    build: {
      target: "es2022",
      sourcemap: false,
      chunkSizeWarningLimit: 500,
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },
  };
});
