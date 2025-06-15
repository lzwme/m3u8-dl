const { app, ipcMain, BrowserWindow, Tray, nativeImage, Menu, shell, dialog } = require('electron');
const fs = require('node:fs');
const { homedir } = require('node:os');
const path = require('node:path');
const url = require('node:url');

const isDev = !app.isPackaged;
const baseDir = path.resolve(__dirname, isDev ? '../../..' : '..');
const config = {
  title: 'M3U8下载器',
  logo: path.resolve(baseDir, 'client/local/icon/logo.png'),
};

const utils = {
  async findFreePort(start = 3000, end = 99_999, port = 0) {
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

const initAutoUpdater = mainWindow => {
  const { autoUpdater } = require('electron-updater');
  const messages = {
    error: '检查更新出错',
    checking: '正在检查更新……',
    updateAva: '检测到新版本，正在下载……',
    updateNotAva: '已是最新版本，无需更新',
  };
  const sendUpdateMessage = text => mainWindow.webContents.send('message', text);

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
    mainWindow.webContents.send('downloadProgress', progress);
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({ title: '安装更新', message: '更新下载完毕，应用将重启并进行安装' })
      .then(() => setImmediate(() => autoUpdater.quitAndInstall()));
  });

  ipcMain.on('checkForUpdate', () => autoUpdater.checkForUpdates());
  ipcMain.on('checkAppVersion', () => mainWindow.webContents.send('version', app.getVersion()));
};

const T = {
  mainWindow: null,
  tray: null,
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

    window.on('closed', () => (mainWindow = null));
    window.on('minimize', () => window.hide());

    window.webContents.on('devtools-opened', () => setImmediate(() => window.focus()));

    initAutoUpdater(window);
    return window;
  },
  createTray() {
    const iconImg = nativeImage.createFromPath(config.logo);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        type: 'normal',
        click: () => mainWindow.show(),
      },
      {
        label: '隐藏窗口',
        type: 'normal',
        click: () => mainWindow.hide(),
      },
      {
        label: '打开调试',
        type: 'normal',
        click: () => mainWindow.webContents[mainWindow.webContents.isDevToolsOpened() ? 'closeDevTools' : 'openDevTools'](),
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
        click: () => mainWindow.close() & app.relaunch(),
      },
      {
        label: '退出',
        type: 'normal',
        click: () => {
          mainWindow.close();
          setTimeout(() => app.quit(), 2000);
        },
      },
    ]);

    const tray = new Tray(iconImg.resize({ width: 20, height: 20 }));
    tray.setTitle(config.title);
    tray.setToolTip(config.title);
    tray.on('double-click', () => mainWindow[mainWindow.isVisible() ? 'hide' : 'show']());
    tray.setContextMenu(contextMenu);
    return tray;
  },
  initEvents() {
    // quit application when all windows are closed
    app.on('window-all-closed', () => {
      // on macOS it is common for applications to stay open until the user explicitly quits
      if (process.platform !== 'darwin') {
        if (this.tray) this.tray.destroy();
        this.tray = null;
        app.quit();
      }
    });

    // on macOS it is common to re-create a window even after all windows have been closed
    app.on('activate', () => (this.mainWindow ? this.mainWindow.show() : this.createMainWindow()));

    let firstHide = false;
    ipcMain.on('hide-windows', function () {
      if (this.mainWindow != null) {
        this.mainWindow.hide();

        if (firstHide && tray) {
          this.tray.displayBalloon({ title: '提示', content: '我隐藏到这里了哦，双击我显示主窗口！' });
          firstHide = false;
        }
      }
    });
  },
  start() {
    this.initEvents();
    app.on('ready', async () => {
      this.mainWindow = await this.createMainWindow();
      this.tray = this.createTray();
    });
  },
};

T.start();
