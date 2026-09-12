import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on every interface, and accept any Host header, so the app can be
    // opened from another machine — a phone on the same wifi, a laptop over
    // Tailscale — without naming that machine here. Only 5173 needs to be
    // reachable: /api is proxied from this process, so the backend stays local.
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
