import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: resolve(__dirname, '../../client'),
    emptyOutDir: false, // 不清空输出目录，保留其他文件如 play.html, logo.png 等
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // 确保构建后的 HTML 可以被 Server 正确读取和替换版本号
    minify: 'esbuild',
  },
  publicDir: 'public',
  server: {
    port: 5173,
    proxy: {
      ...['/api', '/localplay', '/local', '/ws', '/m3u8-capture.user.js'].reduce((acc, path) => ({
        ...acc,
        [path]: {
          target: 'http://localhost:6600',
          changeOrigin: true,
          ws: path === '/ws',
          rewrite: (p: string) => p, // 保持路径不变
        },
      }), {}),
    },
  },
  // 定义全局变量，用于版本号替换
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || '{{version}}'),
  },
});
