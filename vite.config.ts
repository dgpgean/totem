
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext'
  },
  publicDir: '.', // Permite que manifest.json e sw.js sejam encontrados na raiz
  server: {
    port: 3000
  }
});
