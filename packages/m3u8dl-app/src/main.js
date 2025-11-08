const { app, ipcMain, BrowserWindow, Tray, nativeImage, Menu, shell, dialog } = require('electron');
const fs = require('node:fs');
const { homedir } = require('node:os');
const path = require('node:path');
const url = require('node:url');

const isDev = !app.isPackaged;
const baseDir = path.resolve(__dirname, isDev ? '../../..' : '..');
const config = {
  title: 'M3U8下载器',
  logo: path.resolve(baseDir, 'client/logo.png'),
};

const utils = {
  async findFreePort(start = 3800, end = 99_999, port = 0) {
    return new Promise(resolve => {
      if (!port || port < start) port = start;
      if (port > end) throw new Error(`Could not find free port in range: ${start}-${end}`);

      const http = require('node:http');
      const server = http.createServer();
      server
        .listen(port, () => {
          server.close();
          resolve(port);
        })
        .on('error', () => resolve(utils.findFreePort(start, end, port + 1)));
    });
  },
};

const initAutoUpdater = mWindow => {
  const { autoUpdater } = require('electron-updater');
  const messages = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '已是最新版本，无需更新',
  };
  const sendUpdateMessage = text => mWindow.webContents.send('message', text);

  if (isDev) {
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(__dirname, '../dev-app-update.yml');
  }

  autoUpdater.autoDownload = false;
  autoUpdater.removeAllListeners();

  autoUpdater.on('error', error => sendUpdateMessage(`${messages.error}:${error}`));

  autoUpdater.on('checking-for-update', () => sendUpdateMessage(messages.checking));

  autoUpdater.on('update-available', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: '应用有新的更新',
        message: '发现新版本，是否现在更新？',
        buttons: ['是', '否'],
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.downloadUpdate();
          sendUpdateMessage(messages.updateAva);
        }
      });
  });

  autoUpdater.on('update-not-available', () => sendUpdateMessage(messages.updateNotAva));

  autoUpdater.on('download-progress', progress => {
    if (isDev) console.log('downloadProgress:', progress);
    mWindow.webContents.send('downloadProgress', progress);
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({ title: '安装更新', message: '更新下载完毕，应用将重启并进行安装' })
      .then(() => setImmediate(() => autoUpdater.quitAndInstall()));
  });

  ipcMain.on('checkForUpdate', () => autoUpdater.checkForUpdates());
  ipcMain.on('checkAppVersion', () => mWindow.webContents.send('version', app.getVersion()));
};

const T = {
  mainWindow: null,
  tray: null,
  webBrowserWindow: null,
  async createMainWindow() {
    const window = new BrowserWindow({
      title: 'M3U8 下载器',
      icon: config.logo,
      menuBarVisible: false,
      autoHideMenuBar: true,
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        devTools: true,
        contextIsolation: true,
        preload: path.resolve(__dirname, 'preload.js'),
      },
    });

    if (isDev && process.env.DS_DEV_CREATE_DL_SERVER !== '1') {
      window.webContents.openDevTools();
      window.loadURL(process.env.DS_DEV_URL || 'http://localhost:5173');
    } else {
      const { DLServer } = require(path.resolve(baseDir, './cjs/server/download-server.js'));
      const userHome = homedir();
      const port = await utils.findFreePort();

      process.env.DS_SAVE_DIR = path.resolve(userHome, 'Downloads');

      const dlServer = new DLServer({
        port,
        cacheDir: process.env.DS_CACHE_DIR || path.resolve(userHome, '.m3u8-dl/cache'),
        configPath: path.resolve(userHome, '.m3u8-dl/config.json'),
      });

      if (isDev) window.webContents.openDevTools();
      window.loadURL(`http://localhost:${port}`);
    }


    window.on('closed', () => (this.mainWindow = null));
    window.on('minimize', () => window.hide());

    window.webContents.on('devtools-opened', () => setImmediate(() => window.focus()));

    initAutoUpdater(window);
    this.initWebBrowser(window);
    return window;
  },
  initWebBrowser(mainWindow) {
    const mediaUrls = new Map();
    let currentPageTitle = '';
    let currentUrl = '';

    const clearData = () => {
      mediaUrls.clear();
      currentPageTitle = '';
    };

    /**
     *
     * @returns {BrowserWindow}
     * @description 创建浏览器窗口
     */
    const createWebBrowserWindow = () => {
      if (this.webBrowserWindow && !this.webBrowserWindow.isDestroyed()) {
        return this.webBrowserWindow;
      }

      // 创建可见的浏览器窗口用于加载网页并提取 m3u8
      this.webBrowserWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false, // 初始不显示，等待前端请求显示
        title: '网页浏览器',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false, // 禁用 webSecurity 以允许加载外部网页内容
          partition: 'web-browser', // 使用独立的 session
          devTools: isDev, // 开发模式下启用 devtools
          // 禁用可能导致问题的功能
          spellcheck: false,
          enableWebSQL: false,
          // 允许运行不安全内容
          allowRunningInsecureContent: true,
        },
      });

      // 设置权限处理器，避免某些权限相关的错误
      this.webBrowserWindow.webContents.session.setPermissionRequestHandler((details, callback) => {
        // 允许基本权限，拒绝可能导致问题的权限
        if (details.permission === 'notifications' || details.permission === 'geolocation') {
          callback(false);
        } else {
          callback(true);
        }
      });

      // 规范化 URL 用于去重比较（去除查询参数中的时间戳等动态参数）
      const normalizeUrl = (urlString) => {
        try {
          const urlObj = new URL(urlString);
          // 保留基础路径，去除查询参数（因为很多查询参数是动态的，如时间戳、token等）
          return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        } catch {
          // 如果 URL 解析失败，返回原 URL
          return urlString;
        }
      };

      // 监听网络请求，提取 m3u8 和 mp4 视频地址
      this.webBrowserWindow.webContents.session.webRequest.onBeforeRequest(
        { urls: ['*://*/*'] },
        (details, callback) => {
          const url = details.url;
          // 检查是否是 m3u8 或 mp4 视频文件
          if (/\.(m3u8|mp4)(\?|$|#)/i.test(url)) {
            // 使用规范化后的 URL 进行去重比较
            const normalizedUrl = normalizeUrl(url);
            let isNew = true;

            // 检查是否已存在相同的基础 URL
            for (const [existingUrl] of mediaUrls) {
              if (normalizeUrl(existingUrl) === normalizedUrl) {
                isNew = false;
                break;
              }
            }

            if (isNew) {
              const title = currentPageTitle || '未命名视频';
              mediaUrls.set(url, title);
              mainWindow.webContents.send('web-browser:m3u8-found', {
                url,
                title,
                pageUrl: currentUrl,
              });
            }
          }
          // 必须返回 {} 以允许请求继续，否则请求会被阻塞
          callback({});
        }
      );

      // 监听页面导航
      this.webBrowserWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        console.log('[WebBrowser] 准备导航到:', navigationUrl);
        currentUrl = navigationUrl;
        mainWindow.webContents.send('web-browser:navigation', { url: navigationUrl });
      });

      // 监听 DOM 内容加载完成
      this.webBrowserWindow.webContents.on('dom-ready', () => {
        console.log('[WebBrowser] DOM 准备就绪');
      });

      // 监听页面加载完成，获取页面标题和 URL
      this.webBrowserWindow.webContents.on('did-finish-load', async () => {
        try {
          const pageUrl = this.webBrowserWindow.webContents.getURL();
          console.log('[WebBrowser] 页面加载完成:', pageUrl);

          // 检查 DOM 是否为空
          const bodyHTML = await this.webBrowserWindow.webContents.executeJavaScript(`
            document.body ? document.body.innerHTML.length : 0
          `);
          console.log('[WebBrowser] DOM body 内容长度:', bodyHTML);

          const title = await this.webBrowserWindow.webContents.executeJavaScript('document.title');
          currentPageTitle = title || '';
          currentUrl = pageUrl;

          console.log('[WebBrowser] 页面标题:', currentPageTitle);

          mainWindow.webContents.send('web-browser:page-title', currentPageTitle);
          mainWindow.webContents.send('web-browser:url-changed', currentUrl);

          // 发送导航历史状态
          mainWindow.webContents.send('web-browser:navigation-state', {
            canGoBack: this.webBrowserWindow.webContents.canGoBack(),
            canGoForward: this.webBrowserWindow.webContents.canGoForward(),
          });

          // 更新已发现的 m3u8 链接的标题（如果标题还是默认值）
          for (const [url, oldTitle] of mediaUrls) {
            if (oldTitle === '未命名视频' && currentPageTitle) {
              mediaUrls.set(url, currentPageTitle);
              mainWindow.webContents.send('web-browser:m3u8-found', {
                url,
                title: currentPageTitle,
                pageUrl: currentUrl,
              });
            }
          }
        } catch (error) {
          console.error('[WebBrowser] 获取页面信息失败:', error);
        }
      });

      // 监听加载状态
      this.webBrowserWindow.webContents.on('did-start-loading', () => {
        mainWindow.webContents.send('web-browser:loading', { loading: true });
      });

      this.webBrowserWindow.webContents.on('did-stop-loading', () => {
        mainWindow.webContents.send('web-browser:loading', { loading: false });
      });

      // 监听加载错误
      this.webBrowserWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        console.error('[WebBrowser] 加载失败:', errorCode, errorDescription, validatedURL, 'isMainFrame:', isMainFrame);
        // -3: ERR_NAME_NOT_RESOLVED
        if (isMainFrame && ![-3].includes(errorCode)) {
          mainWindow.webContents.send('web-browser:error', {
            code: errorCode,
            description: errorDescription,
            url: validatedURL,
          });
        }
      });

      // 监听页面崩溃
      this.webBrowserWindow.webContents.on('render-process-gone', (event, details) => {
        console.error('[WebBrowser] 渲染进程崩溃:', details);
        mainWindow.webContents.send('web-browser:error', {
          code: -1,
          description: `渲染进程崩溃: ${details.reason || '未知原因'}`,
        });
      });

      // 监听窗口关闭
      this.webBrowserWindow.on('closed', () => {
        this.webBrowserWindow = null;
        mainWindow.webContents.send('web-browser:closed');
      });

      return this.webBrowserWindow;
    };

    // 初始化创建窗口
    createWebBrowserWindow();

    // 处理 IPC 消息
    ipcMain.on('web-browser:load', (event, url) => {
      console.log('[WebBrowser] 加载 URL:', url);
      const window = createWebBrowserWindow();
      clearData();
      currentUrl = url;

      // 设置用户代理，模拟真实浏览器
      window.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      window.loadURL(url).catch((error) => {
        console.error('[WebBrowser] 加载 URL 失败:', error);
        mainWindow.webContents.send('web-browser:error', {
          code: -1,
          description: `加载失败: ${error.message || '未知错误'}`,
        });
      });

      window.show();
      window.focus();
      if (isDev) window.webContents.openDevTools();
    });

    ipcMain.on('web-browser:show', () => {
      const window = createWebBrowserWindow();
      window.show();
      window.focus();
    });

    ipcMain.on('web-browser:hide', () => {
      if (this.webBrowserWindow && !this.webBrowserWindow.isDestroyed()) {
        this.webBrowserWindow.hide();
      }
    });

    ipcMain.on('web-browser:stop', () => {
      if (this.webBrowserWindow && !this.webBrowserWindow.isDestroyed()) {
        this.webBrowserWindow.webContents.stop();
      }
    });

    ipcMain.on('web-browser:go-back', () => {
      const window = createWebBrowserWindow();
      if (window.webContents.canGoBack()) {
        window.webContents.goBack();
        // 延迟发送导航状态，等待页面加载
        setTimeout(() => {
          if (window && !window.isDestroyed()) {
            mainWindow.webContents.send('web-browser:navigation-state', {
              canGoBack: window.webContents.canGoBack(),
              canGoForward: window.webContents.canGoForward(),
            });
          }
        }, 100);
      }
    });

    ipcMain.on('web-browser:go-forward', () => {
      const window = createWebBrowserWindow();
      if (window.webContents.canGoForward()) {
        window.webContents.goForward();
        // 延迟发送导航状态，等待页面加载
        setTimeout(() => {
          if (window && !window.isDestroyed()) {
            mainWindow.webContents.send('web-browser:navigation-state', {
              canGoBack: window.webContents.canGoBack(),
              canGoForward: window.webContents.canGoForward(),
            });
          }
        }, 100);
      }
    });

    ipcMain.on('web-browser:reload', () => {
      const window = createWebBrowserWindow();
      window.webContents.reload();
    });

    ipcMain.on('web-browser:close', () => {
      if (this.webBrowserWindow && !this.webBrowserWindow.isDestroyed()) {
        this.webBrowserWindow.close();
        this.webBrowserWindow = null;
      }
    });
  },
  createTray() {
    const iconImg = nativeImage.createFromPath(config.logo);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        type: 'normal',
        click: () => this.mainWindow.show(),
      },
      {
        label: '隐藏窗口',
        type: 'normal',
        click: () => this.mainWindow.hide(),
      },
      {
        label: '打开调试',
        type: 'normal',
        click: () => {
          [this.mainWindow, this.webBrowserWindow].forEach(window => {
            if (!window?.isDestroyed()) {
              window.webContents[window.webContents.isDevToolsOpened() ? 'closeDevTools' : 'openDevTools']()
            }
          });
        },
      },
      {
        type: 'separator',
      },
      {
        label: '更多工具',
        type: 'normal',
        click: () => shell.openExternal('https://tool.lzw.me'),
      },
      {
        type: 'separator',
      },
      {
        label: '重启',
        type: 'normal',
        click: () => this.mainWindow.close() & app.relaunch(),
      },
      {
        label: '退出',
        type: 'normal',
        click: () => {
          this.mainWindow.close();
          setTimeout(() => app.quit(), 2000);
        },
      },
    ]);

    const tray = new Tray(iconImg.resize({ width: 20, height: 20 }));
    tray.setTitle(config.title);
    tray.setToolTip(config.title);
    tray.on('double-click', () => this.mainWindow[this.mainWindow.isVisible() ? 'hide' : 'show']());
    tray.setContextMenu(contextMenu);
    return tray;
  },
  initEvents() {
    app.on('ready', async () => {
      this.mainWindow = await this.createMainWindow();
      this.tray = this.createTray();
    });

    // quit application when all windows are closed
    app.on('window-all-closed', () => {
      // on macOS it is common for applications to stay open until the user explicitly quits
      if (process.platform !== 'darwin') {
        if (this.tray) this.tray.destroy();
        this.tray = null;
        if (this.webBrowserWindow && !this.webBrowserWindow.isDestroyed()) {
          this.webBrowserWindow.close();
        }
        app.quit();
      }
    });

    // on macOS it is common to re-create a window even after all windows have been closed
    app.on('activate', () => (this.mainWindow ? this.mainWindow.show() : this.createMainWindow()));

    let firstHide = false;
    ipcMain.on('hide-windows', () => {
      if (this.mainWindow != null) {
        this.mainWindow.hide();

        if (firstHide && tray) {
          this.tray.displayBalloon({ title: '提示', content: '我隐藏到这里了哦，双击我显示主窗口！' });
          firstHide = false;
        }
      }
    });
  },
  init() {
    // detect ffmpeg path from ffmpeg-static package
    const ffmpegStatic = require('ffmpeg-static');
    if (fs.existsSync(ffmpegStatic)) process.env.DS_FFMPEG_PATH = ffmpegStatic;
  },
  start() {
    this.init();
    this.initEvents();

    // 多开检测、聚焦当前窗口
    const isFirstInstance = app.requestSingleInstanceLock()
    if (!isFirstInstance) {
      app.quit();
    } else {
      app.on('second-instance', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isMinimized()) this.mainWindow.restore();
          this.mainWindow.focus();
        }
      });
    }
  },
};

T.start();
