const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { build, Platform } = require('electron-builder');
const { mkdirp, rmrf, readJsonFileSync } = require('@lzwme/fe-utils');
const glob = require('fast-glob');
const argv = require('minimist')(process.argv.slice(2));

const isCI = argv.ci || process.env.GITHUB_CI;
const baseDir = path.resolve(__dirname, '../');
const m3u8dlTmpDir = path.resolve(baseDir, './dist/m3u8-dl-tmp');

const T = {
  prepare() {
    rmrf(m3u8dlTmpDir);
    mkdirp(m3u8dlTmpDir);

    const pkg = readJsonFileSync(path.resolve(baseDir, '../../package.json'));
    pkg.dependencies.express = pkg.devDependencies.express || '*';
    pkg.dependencies.ws = pkg.devDependencies.ws || '*';

    delete pkg.devDependencies;
    delete pkg.dependencies.commander;
    delete pkg.dependencies.enquirer;
    fs.writeFileSync(path.resolve(m3u8dlTmpDir, 'package.json'), JSON.stringify(pkg, null, 2));

    execSync(`npm install --omit dev`, {
      stdio: 'inherit',
      cwd: m3u8dlTmpDir,
    });

    const appPkg = readJsonFileSync(path.resolve(baseDir, './package.json'));
    appPkg.version = pkg.version;
    delete appPkg.devDependencies;
    fs.writeFileSync(path.resolve(baseDir, 'dist/package.json'), JSON.stringify(appPkg, null, 2));

    // node_modules 清理
    let total = 0;
    glob
      .sync(
        [
          '**/*.md',
          '**/*.d.ts',
          '**/*/{LICENSE,LICENSE.txt,license,tsconfig.json}',
          '**/{example,test,.github,esm,es,.idea}/**',
          '**/*/tsconfig*.json',
          '**/vhs-utils/src/**',
          '**/*/.{eslintrc,prettierrc,editorconfig,nycrc,jshintrc,npmignore,travis.yml}',
        ],
        {
          cwd: path.resolve(m3u8dlTmpDir, 'node_modules'),
          absolute: true,
          dot: true,
        }
      )
      .forEach(filepath => rmrf(filepath) & total++);
    console.log('node_modules 清理完成，共清理文件：', total);
  },
  async start() {
    this.prepare();

    const platform = argv.mac && process.platform === 'darwin' ? Platform.MAC : argv.linux ? Platform.LINUX : Platform.WINDOWS;
    const r = await build({
      targets: platform.createTarget(),
      config: {
        appId: 'cn.lzwme.m3u8dl',
        artifactName: '${productName}-${os}_${arch}-${version}.${ext}',
        electronVersion: '36.4.0',
        copyright: `Copyright © ${new Date().getFullYear()} \${author}`,
        compression: 'normal',
        electronDownload: {
          mirror: isCI ? undefined : 'https://npmmirror.com/mirrors/electron/',
        },
        directories: {
          app: baseDir,
          output: 'dist/app',
        },
        files: [
          'main.js',
          {
            from: 'dist/package.json',
            to: 'package.json',
          },
          {
            from: '../../client',
            to: 'client',
          },
          {
            from: '../../cjs',
            to: 'cjs',
          },
          {
            from: path.resolve(m3u8dlTmpDir, 'node_modules'),
            to: './node_modules',
          },
        ],
        // extraResources: [],
        asar: true,
        win: {
          target: [
            {
              target: 'nsis',
            },
            {
              target: 'zip',
              arch: ['x64', 'ia32'],
            },
          ],
          // extraResources: ['../../cjs', '../../client'],
          icon: 'build/icon/logo.png',
        },
        dmg: {
          window: {
            width: 540,
            height: 380,
          },
          contents: [
            {
              x: 410,
              y: 230,
              type: 'link',
              path: '/Applications',
            },
            {
              x: 130,
              y: 230,
              type: 'file',
            },
          ],
        },
        mac: {
          hardenedRuntime: true,
          appId: 'cn.lzwme.m3u8dl-mac',
          category: 'public.app-category.productivity',
          target: [
            {
              target: 'dmg',
              arch: ['x64', 'arm64'],
            },
          ],
          icon: 'build/icon/logo.icns',
        },
        nsis: {
          perMachine: true,
          oneClick: false,
          allowElevation: true,
          allowToChangeInstallationDirectory: true,
          installerIcon: 'build/icon/logo.ico',
          uninstallerIcon: 'build/icon/logo.ico',
          installerHeaderIcon: 'build/icon/logo.ico',
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'M3U8-DL',
          differentialPackage: false,
        },
        appImage: {
          category: 'public.app-category.productivity',
        },
        linux: {
          target: ['AppImage', 'deb'],
          maintainer: 'renxia <l@lzw.me>',
          category: 'Utility',
        },
        afterPack: async context => {
          // 删除不必要的语言
          const localeDir = path.resolve(context.appOutDir, 'locales');
          if (fs.existsSync(localeDir)) {
            fs.readdirSync(localeDir).forEach(file => {
              if (!file.startsWith('zh-CN')) fs.unlinkSync(path.resolve(localeDir, file)); // !file.startsWith('en') &&
            });
          }
        },
      },
    });

    console.log('[electron]build done!', r);
  },
};

T.start();
