import { createRequire } from 'node:module';
import * as fs from 'node:fs';
import * as net from 'node:net';
import { homedir } from 'node:os';
import * as path from 'node:path';
import { BrowserView, BrowserWindow, Tray, Updater, Utils } from 'electrobun/bun';
import type { M3u8MainRpc } from '../shared/rpc';

const singletonPort = 58_391;

function assertSingleInstance(): void {
  const srv = net.createServer();
  srv.once('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') process.exit(0);
  });
  srv.listen(singletonPort, '127.0.0.1', () => {
    srv.unref();
  });
}

function findRepoRoot(): string {
  const devRoot = path.resolve(import.meta.dir, '../../../..');
  const devCjs = path.join(devRoot, 'cjs/server/download-server.js');
  if (fs.existsSync(devCjs)) return devRoot;
  const rel = path.resolve(import.meta.dir, '../..');
  if (fs.existsSync(path.join(rel, 'cjs/server/download-server.js'))) return rel;
  const rel2 = path.resolve(import.meta.dir, '..');
  if (fs.existsSync(path.join(rel2, 'cjs/server/download-server.js'))) return rel2;
  return devRoot;
}

async function findFreePort(start = 6600, end = 99_999, p = start): Promise<number> {
  if (p > end) throw new Error(`Could not find free port in range: ${start}-${end}`);
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server
      .listen(p, '127.0.0.1', () => {
        server.close(() => resolve(p));
      })
      .on('error', () => {
        findFreePort(start, end, p + 1).then(resolve).catch(reject);
      });
  });
}

function readAppVersion(repoRoot: string): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as { version?: string };
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

assertSingleInstance();

const config = { title: 'M3U8 Downloader' };
const repoRoot = findRepoRoot();
const logoPath = path.join(repoRoot, 'client/logo.png');
const appVersion = readAppVersion(repoRoot);

if (!process.env.DS_SAVE_DIR) process.env.DS_SAVE_DIR = path.join(homedir(), 'Downloads');
try {
  if (!process.env.DS_FFMPEG_PATH) {
    const ffmpegMod = createRequire(import.meta.url)('ffmpeg-static') as string;
    if (ffmpegMod && fs.existsSync(ffmpegMod)) process.env.DS_FFMPEG_PATH = ffmpegMod;
  }
} catch {
  /* optional */
}

const requireDl = createRequire(import.meta.url);
const dlModPath = path.join(repoRoot, 'cjs/server/download-server.js');
const { DLServer } = requireDl(dlModPath) as { DLServer: new (o: object) => unknown };

let channel = 'stable';
try {
  channel = await Updater.localInfo.channel();
} catch {
  /* dev / unpackaged */
}
const isDesktopDev =
  channel === 'dev' && process.env.DS_DEV_CREATE_DL_SERVER !== '1' && !process.env.FORCE_DL_SERVER;

const devUrl = process.env.DS_DEV_URL || 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;

function sendToWebview(payload: { channel: string; args?: unknown[] }) {
  if (!mainWindow) return;
  // @ts-ignore
  mainWindow.webview.rpc?.send?.ipcEvent(payload);
}

const rpc = BrowserView.defineRPC<M3u8MainRpc>({
  maxRequestTime: 60_000,
  handlers: {
    messages: {
      appIpc: ({ channel: ch, data }) => {
        if (ch === 'open-folder') {
          const folderPath = typeof data === 'string' ? data : '';
          if (!folderPath) {
            sendToWebview({ channel: 'open-folder-result', args: [{ success: false, error: '路径为空' }] });
            return;
          }
          if (!fs.existsSync(folderPath)) {
            sendToWebview({ channel: 'open-folder-result', args: [{ success: false, error: '目录不存在' }] });
            return;
          }
          const ok = Utils.openPath(folderPath);
          if (ok) {
            sendToWebview({ channel: 'open-folder-result', args: [{ success: true }] });
          } else {
            sendToWebview({
              channel: 'open-folder-result',
              args: [{ success: false, error: '打开失败' }],
            });
          }
          return;
        }
        if (ch === 'checkAppVersion') {
          sendToWebview({ channel: 'version', args: [appVersion] });
          return;
        }
        if (ch === 'checkForUpdate') {
          void (async () => {
            try {
              const r = await Updater.checkForUpdate();
              if (r.error) {
                sendToWebview({ channel: 'message', args: [`检查更新出错:${r.error}`] });
                return;
              }
              if (r.updateAvailable) {
                sendToWebview({
                  channel: 'message',
                  args: [`检测到新版本，请从发布页下载安装包（hash: ${r.hash?.slice(0, 8) || ''}）`],
                });
              } else {
                sendToWebview({ channel: 'message', args: ['已是最新版本，无需更新'] });
              }
            } catch (e) {
              sendToWebview({
                channel: 'message',
                args: [`检查更新异常:${e instanceof Error ? e.message : String(e)}`],
              });
            }
          })();
        }
      },
    },
  },
});

async function resolveStartUrl(): Promise<string> {
  if (isDesktopDev) {
    try {
      const r = await fetch(devUrl, { method: 'HEAD' });
      if (r.ok) return devUrl;
    } catch {
      /* fall through to DL server */
    }
  }
  const port = await findFreePort();
  new DLServer({
    port,
    cacheDir: process.env.DS_CACHE_DIR || path.join(homedir(), '.m3u8-dl/cache'),
    configPath: path.join(homedir(), '.m3u8-dl/config.json'),
  });
  return `http://127.0.0.1:${port}/?from=electrobun`;
}

const startUrl = await resolveStartUrl();

mainWindow = new BrowserWindow({
  title: config.title,
  url: startUrl,
  rpc,
  frame: { width: 1200, height: 800, x: 120, y: 80 },
});

const tray = new Tray({ title: config.title });
if (fs.existsSync(logoPath)) {
  try {
    (tray as { setIcon?: (p: string) => void }).setIcon?.(logoPath);
  } catch {
    /* optional */
  }
}

tray.setMenu([
  { type: 'normal', label: '显示窗口', action: 'show' },
  { type: 'normal', label: '隐藏窗口', action: 'hide' },
  { type: 'divider' },
  { type: 'normal', label: '更多工具', action: 'tools' },
  { type: 'divider' },
  { type: 'normal', label: '重启', action: 'restart' },
  { type: 'normal', label: '退出', action: 'quit' },
]);

tray.on('tray-clicked', (ev: unknown) => {
  const evData = ev as { data?: { action?: string } };
  const action = evData.data?.action;
  const win = mainWindow;
  switch (action) {
    case 'show':
      win?.focus();
      break;
    case 'hide':
      break;
    case 'tools':
      Utils.openExternal('https://tool.lzw.me');
      break;
    case 'restart':
      process.exit(1);
    case 'quit':
      tray.remove();
      process.exit(0);
    default: {
      break;
    }
  }
});
