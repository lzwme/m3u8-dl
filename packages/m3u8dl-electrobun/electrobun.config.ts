import type { ElectrobunConfig } from 'electrobun/bun';
import pkg from '../../package.json' with { type: 'json' };

export default {
  app: {
    name: 'M3U8-DL',
    identifier: 'cn.lzwme.m3u8dl',
    version: pkg.version,
    description: pkg.description,
  },
  release: {
    baseUrl: "https://github.com/lzwme/m3u8-dl/releases/latest/download",
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts',
    },
    buildFolder: 'dist/build',
    artifactFolder: "dist/artifacts",
    copy: {
      '../../cjs': 'cjs',
      '../../client': 'client',
    },
    watchIgnore: ['../../client/**', '../../cjs/**'],
    mac: {
      bundleCEF: false,
      // icons: '../m3u8dl-app/build/icon/logo.icns',
      // codesign: true,
      // notarize: true,
    },
    linux: {
      bundleCEF: true,
      icon: '../frontend/public/logo.png',
    },
    win: {
      bundleCEF: false,
      icon: '../m3u8dl-app/build/icon/logo.ico'
    },
  },
  runtime: {
    exitOnLastWindowClosed: true,
  },
} satisfies ElectrobunConfig;
