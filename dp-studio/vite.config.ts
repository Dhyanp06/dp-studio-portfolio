import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } };

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { proxy: api },
  preview: { proxy: api },
});
