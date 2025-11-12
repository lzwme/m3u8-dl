const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { build, Platform } = require('electron-builder');
const { mkdirp, rmrf, readJsonFileSync } = require('@lzwme/fe-utils');
const glob = require('fast-glob');
const argv = require('minimist')(process.argv.slice(2));

const isCI = argv.ci || process.env.GITHUB_CI;
const baseDir = path.resolve(__dirname, '../');
const rootDir = path.resolve(baseDir, '../..');
const appBuildDir = path.resolve(baseDir, 'dist/app-build-tmp');
const rootPkg = readJsonFileSync(path.resolve(rootDir, 'package.json'));

const T = {
  prepare() {
    const appPkg = readJsonFileSync(path.resolve(baseDir, './package.json'));
    appPkg.version = rootPkg.version;
    appPkg.dependencies = {
      'ffmpeg-static': '^5.2.0',
      ...rootPkg.dependencies,
      ...appPkg.dependencies,
    };
    delete appPkg.devDependencies;
    delete appPkg.dependencies.commander;
    delete appPkg.dependencies.enquirer;

    // if (isCI) rmrf(appBuildDir);
    mkdirp(appBuildDir);
    fs.writeFileSync(path.resolve(appBuildDir, 'package.json'), JSON.stringify(appPkg, null, 2));
    fs.cpSync(path.resolve(baseDir, 'src'), path.resolve(appBuildDir, 'src'), { recursive: true, force: true });

    execSync(`npm install --omit dev`, { stdio: 'inherit', cwd: appBuildDir });

    // node_modules 清理
    // let total = 0;
    // const ignores = [
    //   '**/*.md',
    //   '**/*.d.ts',
    //   '**/*/{LICENSE,LICENSE.txt,license,tsconfig.json}',
    //   '**/{example,test,.github,esm,es,.idea}/**',
    //   '**/*/tsconfig*.json',
    //   '**/vhs-utils/src/**',
    //   '**/*/.{eslintrc,prettierrc,editorconfig,nycrc,jshintrc,npmignore,travis.yml}',
    // ];
    // glob
    //   .sync(ignores, { cwd: path.resolve(appBuildDir, 'node_modules'), absolute: true, dot: true })
    //   .forEach(filepath => rmrf(filepath) & total++);

    // console.log('node_modules 清理完成，共清理文件：', total);

    // 下载 CDN 静态资源到本地（用于 electron 构建）
    console.log('[electron]下载 CDN 静态资源...');
    try {
      execSync(`node ${path.resolve(rootDir, 'scripts/download-cdn-resources.js')}`, {
        stdio: 'inherit',
        cwd: rootDir,
      });
    } catch (error) {
      console.warn('[electron]CDN 资源下载失败，继续构建:', error.message);
    }
  },
  async start() {
    this.prepare();

    const platform = argv.mac && process.platform === 'darwin' ? Platform.MAC : argv.linux ? Platform.LINUX : Platform.WINDOWS;
    const r = await build({
      targets: platform.createTarget(),
      config: {
        productName: 'M3U8-DL',
        buildVersion: rootPkg.version,
        appId: 'cn.lzwme.m3u8dl',
        artifactName: '${productName}-${os}_${arch}-${version}.${ext}',
        // electronVersion: '39.1.2',
        copyright: `Copyright © ${new Date().getFullYear()} \${author}`,
        compression: 'normal',
        electronDownload: {
          mirror:
            process.env.ELECTRON_MIRROR ||
            process.env.npm_config_ELECTRON_MIRROR ||
            process.env.npm_config_electron_mirror ||
            (isCI ? undefined : 'https://npmmirror.com/mirrors/electron/'),
        },
        directories: {
          app: appBuildDir,
          output: 'dist/app',
        },
        files: [
          '**\/*',
          '!**/*.md',
          '!**/*.d.ts',
          '!**/*/{LICENSE,LICENSE.txt,license,tsconfig.json}',
          '!**/{example,test,.github,esm,es,.idea}/**',
          '!**/*/tsconfig*.json',
          '!**/vhs-utils/src/**',
          '!**/*/.{eslintrc,prettierrc,editorconfig,nycrc,jshintrc,npmignore,travis.yml}',
          {
            from: path.resolve(rootDir, 'client'),
            to: 'client',
          },
          {
            from: path.resolve(rootDir, 'cjs'),
            to: 'cjs',
          },
        ],
        // extraResources: [],
        asar: true,
        asarUnpack: ['**/ffmpeg-static/**'],
        win: {
          target: [
            {
              target: 'nsis',
            },
            {
              target: '7z',
              arch: ['x64', 'ia32'],
            },
          ],
          // extraResources: ['../../cjs', '../../client'],
          // icon: path.resolve(rootDir, 'client/logo.png'),
          icon: 'build/icon/logo.ico',
          verifyUpdateCodeSignature: false,
        },
        dmg: {
          sign: false,
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
          sign: false,
          forceCodeSigning: false,
          gatekeeperAssess: false,
          hardenedRuntime: true,
          appId: 'cn.lzwme.m3u8dl-mac',
          category: 'public.app-category.productivity',
          target: [
            {
              target: '7z',
              arch: ['x64', 'arm64'],
            },
            // {
            //   target: 'dmg',
            //   arch: ['x64', 'arm64'],
            // },
          ],
          icon: 'build/icon/logo.icns',
        },
        nsis: {
          perMachine: true,
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          installerIcon: 'build/icon/logo.ico',
          uninstallerIcon: 'build/icon/logo.ico',
          installerHeaderIcon: 'build/icon/logo.ico',
          shortcutName: 'M3U8-DL',
          allowElevation: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          differentialPackage: true,
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
