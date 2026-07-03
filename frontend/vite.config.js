import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // In development (`npm run dev`), proxy /api requests to the Go API running locally.
    // In production (Docker), nginx handles this proxy — see nginx.conf.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
