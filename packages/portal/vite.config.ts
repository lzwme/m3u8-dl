import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, '../../docs/portal'),
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  publicDir: 'public',
  server: {
    port: 5174,
  },
});
