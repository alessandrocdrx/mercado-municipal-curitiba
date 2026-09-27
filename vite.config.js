import { defineConfig } from 'vite';

export default defineConfig({
  // Caminhos relativos: o build funciona em qualquer subpasta (GitHub Pages, S3, etc.).
  base: './',
  build: { chunkSizeWarningLimit: 1000 },
});
