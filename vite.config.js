import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves this repository from /weather-app/.
  // Local development and other deployments use the root path.
  base: mode === 'production' ? '/weather-app/' : '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
}));
