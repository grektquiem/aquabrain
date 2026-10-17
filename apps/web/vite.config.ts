import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * El servidor de desarrollo proxyea `/api` hacia la API NestJS para que el
 * navegador vea un único origen: sin *preflight* de CORS y con la cookie del
 * refresh token tratada como *same-origin* (doc 06 §«sesiones»).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
