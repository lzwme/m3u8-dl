const { app, ipcMain, BrowserWindow, Tray, nativeImage, Menu, shell } = require('electron');
const fs = require('node:fs');
const { homedir } = require('node:os');
const path = require('node:path');
const url = require('node:url');

const isDev = !app.isPackaged;
const baseDir = isDev ? path.resolve(__dirname, '../../') : __dirname;
const config = {
  title: 'M3U8下载器',
  logo: path.resolve(baseDir, 'client/local/icon/logo.png'),
};

let mainWindow;
let tray = null;

async function createMainWindow() {
  const window = new BrowserWindow({
    title: 'M3U8 下载器',
    icon: config.logo,
    menuBarVisible: false,
    autoHideMenuBar: true,
    width: 1200,
    height: 768,
    webPreferences: { nodeIntegration: true, devTools: true },
  });
  const { DLServer } = require(path.resolve(baseDir, './cjs/server/download-server.js'));
  const userHome = homedir();

  const port = await findFreePort();
  process.env.DS_SAVE_DIR = path.resolve(userHome, 'Downloads');

  const dlServer = new DLServer({
    port,
    cacheDir: path.resolve(userHome, '.m3u8-dl/cache'),
    configPath: path.resolve(userHome, '.m3u8-dl/config.json'),
  });

  window.loadURL(`http://localhost:${port}`);
  if (isDev) window.webContents.openDevTools();

  window.on('closed', () => (mainWindow = null));
  window.on('minimize', () => window.hide());

  window.webContents.on('devtools-opened', () => {
    setImmediate(() => window.focus());
  });

  return window;
}

function createTray() {
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
}

async function findFreePort(start = 3000, end = 99_999, port = 0) {
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
      .on('error', () => resolve(findFreePort(start, end, port + 1)));
  });
}

app.on('ready', async () => {
  mainWindow = await createMainWindow();
  tray = createTray();
});

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    if (tray) tray.destroy();
    tray = null;
    app.quit();
  }
});

// on macOS it is common to re-create a window even after all windows have been closed
app.on('activate', () => (mainWindow ? mainWindow.show() : createMainWindow()));

let firstHide = false;
ipcMain.on('hide-windows', function () {
  if (mainWindow != null) {
    mainWindow.hide();

    if (firstHide && tray) {
      tray.displayBalloon({ title: '提示', content: '我隐藏到这里了哦，双击我显示主窗口！' });
      firstHide = false;
    }
  }
});
