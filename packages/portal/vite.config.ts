import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  base: '/portal/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: resolve(__dirname, '../../docs/portal'),
    emptyOutDir: true,
    assetsDir: 'assets',
  },
  publicDir: 'public',
  server: {
    port: 5174,
  },
});
