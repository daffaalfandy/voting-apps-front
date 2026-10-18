import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin /api in development, mirroring the nginx proxy used in the Docker image.
    proxy: { '/api': 'http://localhost:4000' },
  },
});
