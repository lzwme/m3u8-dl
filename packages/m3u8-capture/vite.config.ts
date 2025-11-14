import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';

/** UserScript 头部内容 */
const USERSCRIPT_HEADER = `// ==UserScript==
// @name         [M3U8-DL]媒体链接抓取器
// @namespace    https://github.com/lzwme/m3u8-dl
// @homepage     https://m3u8-player.lzw.me/download.html
// @supportURL   https://github.com/lzwme/m3u8-dl/issues
// @icon         https://gh-proxy.org/raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/packages/frontend/public/logo.png
// @version      1.0.0
// @description  自动抓取网页中的多种媒体链接（m3u8、mp4、mkv、avi、mov、音频等），支持可配置的媒体类型，支持跳转到 m3u8-dl webui 下载
// @author       lzw
// @updateURL    https://gh-proxy.org/raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js
// @downloadURL  https://raw.githubusercontent.com/lzwme/m3u8-dl/refs/heads/main/client/m3u8-capture.user.js
// @match        *://*/*
// @grant        GM_addElement
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @resource     SwalJS   https://s4.zstatic.net/ajax/libs/sweetalert2/11.16.1/sweetalert2.min.js
// @resource     SwalCSS  https://s4.zstatic.net/ajax/libs/sweetalert2/11.16.1/sweetalert2.css
// @resource     TailwindCSS  https://s4.zstatic.net/ajax/libs/tailwindcss/2.2.19/tailwind.min.css
// @run-at       document-idle
// ==/UserScript==

`;

/** 自定义插件：在构建产物前添加 UserScript 头部 */
function userscriptHeaderPlugin(): Plugin {
  return {
    name: 'userscript-header',
    generateBundle(_options, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && fileName === 'm3u8-capture.user.js') {
          chunk.code = USERSCRIPT_HEADER + chunk.code;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [userscriptHeaderPlugin()],
  build: {
    outDir: resolve(__dirname, '../../client'),
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/main.ts'),
      output: {
        entryFileNames: 'm3u8-capture.user.js',
        format: 'iife',
        banner: '', // 不使用 banner，在插件中处理
      },
    },
    minify: 'esbuild',
  },
});
