
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Define que a raiz pode conter arquivos estáticos (como manifest.json e sw.js)
  // mas o Vite cuidará para não duplicar o index.html ou arquivos de código.
  publicDir: false, 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      // Copia manualmente arquivos necessários que não são importados no código
      external: []
    },
  }
});
