import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so assets work on Vercel root AND GitHub Pages subpaths
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
});
