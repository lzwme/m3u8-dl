import { existsSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { assign, getUrlParams, md5, mkdirp } from '@lzwme/fe-utils';
import { cyan, gray, green, red } from 'console-log-colors';
import type { Express } from 'express';
import type { Server } from 'ws';
import { fileDownload } from '../lib/file-download.js';
import { formatOptions } from '../lib/format-options.js';
import { m3u8DLStop, m3u8Download } from '../lib/m3u8-download.js';
import { getM3u8Urls } from '../lib/getM3u8Urls.js';
import { logger } from '../lib/utils.js';
import type { M3u8DLOptions, M3u8DLProgressStats, M3u8DLResult, M3u8WorkerPool, TsItemInfo } from '../types/m3u8.js';
import { VideoParser } from '../video-parser/index.js';

interface DLServerOptions {
  port?: number;
  cacheDir?: string;
  configPath?: string;
  debug?: boolean;
  /** 登录 token，默认取环境变量 DS_SECRET */
  token?: string;
  /** 是否限制文件访问(localplay视频资源等仅可读取下载和缓存目录) */
  limitFileAccess?: boolean;
}

interface CacheItem extends Partial<M3u8DLProgressStats> {
  url: string;
  /** 用户设置的参数 */
  options: M3u8DLOptions;
  /** 格式化后实际下载使用的参数 */
  dlOptions?: M3u8DLOptions;
  status: 'pause' | 'resume' | 'done' | 'pending' | 'error';
  current?: TsItemInfo;
  workPoll?: M3u8WorkerPool;
}

const rootDir = resolve(__dirname, '../..');

export class DLServer {
  app: Express = null;
  wss: Server = null;
  /** DS 参数 */
  options: DLServerOptions = {
    port: Number(process.env.DS_PORT) || 6600,
    cacheDir: process.env.DS_CACHE_DIR || resolve(homedir(), '.m3u8-dl/cache'),
    token: process.env.DS_SECRET || process.env.DS_TOKEN || '',
    debug: process.env.DS_DEBUG === '1',
    limitFileAccess: !['0', 'false'].includes(process.env.DS_LIMTE_FILE_ACCESS),
  };
  private serverInfo = {
    version: '',
    ariang: existsSync(resolve(rootDir, 'client/ariang/index.html')),
  };
  private cfg = {
    /** 支持 web 设置修改的参数 */
    webOptions: {
      /** 最多同时下载数量。超过改值则设置为 pending */
      maxDownloads: 3,
      /** 是否显示预览按钮 */
      showPreview: true,
      /** 是否显示边下边播按钮 */
      showLocalPlay: true,
    },
    /** download 下载默认参数 */
    dlOptions: {
      debug: process.env.DS_DEBUG === '1',
      saveDir: process.env.DS_SAVE_DIR || './downloads',
      threadNum: 4,
    } as M3u8DLOptions,
  };
  /** 下载任务缓存 */
  private dlCache = new Map<string, CacheItem>();
  /** 正在下载的任务数量 */
  private get downloading() {
    return Array.from(this.dlCache.values()).filter(item => item.status === 'resume').length;
  }
  constructor(opts: DLServerOptions = {}) {
    opts = Object.assign(this.options, opts);
    opts.cacheDir = resolve(opts.cacheDir);
    if (!opts.configPath) opts.configPath = resolve(opts.cacheDir, 'config.json');

    const pkgFile = resolve(rootDir, 'package.json');
    if (existsSync(pkgFile)) {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
      this.serverInfo.version = pkg.version;
    }

    if (opts.token) opts.token = md5(opts.token.trim()).slice(0, 8);
    this.init();
  }
  private async init() {
    this.readConfig();
    if (this.cfg.dlOptions.debug) logger.updateOptions({ levelType: 'debug' });
    this.loadCache();
    await this.createApp();
    this.initRouters();
    logger.debug('Server initialized', 'cacheSize:', this.dlCache.size, this.options, this.cfg.dlOptions);
  }
  private loadCache() {
    const cacheFile = resolve(this.options.cacheDir, 'cache.json');

    if (existsSync(cacheFile)) {
      (JSON.parse(readFileSync(cacheFile, 'utf8')) as [string, CacheItem][]).forEach(([url, item]) => {
        if (item.status === 'resume') item.status = 'pause';
        this.dlCache.set(url, item);
      });
      this.checkDLFileIsExists();
    }
  }
  private checkDLFileLaest = 0;
  private checkDLFileTimer: NodeJS.Timeout = null;
  private checkDLFileIsExists() {
    const now = Date.now();
    const interval = 1000 * 60;

    clearTimeout(this.checkDLFileTimer);
    if (now - this.checkDLFileLaest < interval) {
      this.checkDLFileTimer = setTimeout(() => this.checkDLFileIsExists(), interval - (now - this.checkDLFileLaest));
      return;
    }

    this.dlCache.forEach(item => {
      if (item.status === 'done' && (!item.localVideo || !existsSync(item.localVideo))) {
        item.status = 'error';
        item.errmsg = '已删除';
      }
    });
  }
  dlCacheClone() {
    const info: [string, CacheItem][] = [];
    for (const [url, v] of this.dlCache) {
      const { workPoll, ...item } = v;
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'function') delete item[key as keyof typeof item];
      }
      info.push([url, item]);
    }
    return info;
  }
  private cacheSaveTimer: NodeJS.Timeout = null;
  public saveCache() {
    clearTimeout(this.cacheSaveTimer);
    this.cacheSaveTimer = setTimeout(() => {
      const cacheFile = resolve(this.options.cacheDir, 'cache.json');
      const info = this.dlCacheClone();

      mkdirp(dirname(cacheFile));
      writeFileSync(cacheFile, JSON.stringify(info));
    }, 1000);
  }
  private readConfig(configPath?: string): M3u8DLOptions {
    try {
      if (!configPath) configPath = this.options.configPath;
      if (existsSync(configPath)) assign(this.cfg, JSON.parse(readFileSync(configPath, 'utf8')));
    } catch (error) {
      logger.error('读取配置失败:', error);
    }

    return this.cfg.dlOptions;
  }
  saveConfig(config: M3u8DLOptions, configPath?: string) {
    if (!configPath) configPath = this.options.configPath;

    for (const [key, value] of Object.entries(config)) {
      // @ts-expect-error 忽略类型错误
      if (key in this.cfg.webOptions) this.cfg.webOptions[key] = value;
      // @ts-expect-error 忽略类型错误
      else this.cfg.dlOptions[key] = value;
    }

    mkdirp(dirname(configPath));
    writeFileSync(configPath, JSON.stringify(this.cfg, null, 2));
  }
  private async createApp() {
    const { default: express } = await import('express');
    const { WebSocketServer } = await import('ws');
    const app = express();
    const server = app.listen(this.options.port, () => logger.info(`Server running on port ${green(this.options.port)}`));
    const wss = new WebSocketServer({ server });

    this.app = app;
    this.wss = wss;

    app.use((req, res, next) => {
      if (['/', '/index.html'].includes(req.path)) {
        const version = this.serverInfo.version;
        let indexHtml = readFileSync(resolve(rootDir, 'client/index.html'), 'utf-8').replaceAll('{{version}}', version);

        if (existsSync(resolve(rootDir, 'client/local/cdn'))) {
          indexHtml = indexHtml
            .replaceAll('https://s4.zstatic.net/ajax/libs', 'local/cdn')
            .replaceAll(/integrity=".+"\n?/g, '')
            .replace('https://cdn.tailwindcss.com/3.4.16', 'local/cdn/tailwindcss/3.4.16/tailwindcss.min.js');
        }

        res.setHeader('content-type', 'text/html').send(indexHtml);
      } else {
        next();
      }
    });

    app.use(express.json());
    app.use(express.static(resolve(rootDir, 'client')));

    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'no-cache');

      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      if (this.options.token && req.headers.authorization !== this.options.token) {
        const ignorePaths = ['/healthcheck', '/localplay'];
        if (!ignorePaths.some(d => req.url.includes(d))) {
          const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          logger.warn('Unauthorized access:', clientIp, req.url, req.headers.authorization);
          res.status(401).json({ message: '未授权，禁止访问', code: 401 });
          return;
        }
      }

      next();
    });

    wss.on('connection', (ws, req) => {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      logger.info('Client connected:', clientIp, req.url);

      if (this.options.token) {
        const token = getUrlParams(req.url).token;
        if (!token || token !== this.options.token) {
          logger.error('Unauthorized client:', req.socket.remoteAddress);
          ws.close(1008, 'Unauthorized');
          return;
        }
      }

      this.checkDLFileIsExists();
      ws.send(JSON.stringify({ type: 'serverInfo', data: this.serverInfo }));
      ws.send(JSON.stringify({ type: 'tasks', data: Object.fromEntries(this.dlCacheClone()) }));
    });
    wss.on('close', () => logger.info('WebSocket server closed'));
    wss.on('error', err => logger.error('WebSocket server error:', err));
    wss.on('listening', () => logger.info(`WebSocket server listening on port ${green(this.options.port)}`));

    return { app, wss };
  }
  private async startDownload(url: string, options?: M3u8DLOptions) {
    if (!url) return logger.error('[satartDownload]Invalid URL:', url);

    if (url.endsWith('.html')) {
      const item = Array.from(await getM3u8Urls(url, options.headers))[0];
      if (!item) return logger.error('[startDownload]不是有效(包含)M3U8的地址:', url);
      url = item[0];
      if (!options.filename) options.filename = item[1];
    }

    const { options: dlOptions } = formatOptions(url, { ...this.cfg.dlOptions, ...options, cacheDir: this.options.cacheDir });
    const cacheItem = this.dlCache.get(url) || { options, dlOptions, status: 'pending', url };
    logger.debug('startDownload', url, dlOptions, cacheItem.status);

    if (cacheItem.status === 'resume') return;

    if (cacheItem.localVideo && !existsSync(cacheItem.localVideo)) delete cacheItem.localVideo;
    if (cacheItem.endTime) delete cacheItem.endTime;

    cacheItem.status = this.downloading >= this.cfg.webOptions.maxDownloads ? 'pending' : 'resume';
    // pending 优先级靠后
    if (cacheItem.status === 'pending' && this.dlCache.has(url)) this.dlCache.delete(url);
    this.dlCache.set(url, cacheItem);
    this.wsSend('progress', url);

    if (cacheItem.status === 'pending') return;

    let workPoll: M3u8WorkerPool = cacheItem.workPoll;
    const opts: M3u8DLOptions = {
      ...dlOptions,
      showProgress: dlOptions.debug || this.options.debug,
      onInited: (_s, _i, wp) => {
        workPoll = wp;
      },
      onProgress: (_finished, _total, current, stats) => {
        const item = this.dlCache.get(url);
        if (!item) return false; // 已删除
        const status = item.status || 'resume';

        Object.assign(item, { ...stats, current, options: dlOptions, status, workPoll, url });
        this.dlCache.set(url, item);
        this.saveCache();
        this.wsSend('progress', url);

        return status !== 'pause';
      },
    };
    const afterDownload = (r: M3u8DLResult, url: string) => {
      const item = this.dlCache.get(url) || cacheItem;

      if (r.filepath && existsSync(r.filepath)) {
        item.localVideo = r.filepath;
        item.downloadedSize = statSync(r.filepath).size;
      } else if (!r.errmsg && opts.convert !== false) r.errmsg = '下载失败';

      item.endTime = Date.now();
      item.errmsg = r.errmsg;
      item.status = r.errmsg ? 'error' : 'done';
      logger.info('Download complete:', item.status, red(r.errmsg), gray(url), cyan(r.filepath));

      this.dlCache.set(url, item);
      this.wsSend('progress', url);
      this.saveCache();
      this.startNextPending();
    };

    try {
      if (dlOptions.type === 'parser') {
        const vp = new VideoParser();
        vp.download(url, opts).then(r => afterDownload(r, url));
      } else if (dlOptions.type === 'file') {
        fileDownload(url, opts).then(r => afterDownload(r, url));
      } else {
        m3u8Download(url, opts).then(r => afterDownload(r, url));
      }
    } catch (error) {
      afterDownload({ filepath: '', errmsg: (error as Error).message }, url);
      logger.error('下载失败:', error);
    }
  }
  startNextPending() {
    // 找到一个 pending 的任务，开始下载
    const nextItem = this.dlCache.entries().find(([_url, d]) => d.status === 'pending');
    if (nextItem) {
      this.startDownload(nextItem[0], nextItem[1].options);
      this.wsSend('progress', nextItem[0]);
    }
  }
  private wsSend(type = 'progress', data?: unknown) {
    if (type === 'tasks' && !data) {
      data = Object.fromEntries(this.dlCacheClone());
    } else if (type === 'progress' && typeof data === 'string') {
      const item = this.dlCache.get(data);
      if (!item) return;

      const { workPoll, ...stats } = item;
      data = [{ ...stats, url: data }];
    }

    // 广播进度信息给所有客户端
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(JSON.stringify({ type, data }));
    });
  }
  private initRouters() {
    const { app } = this;

    app.get('/healthcheck', (_req, res) => {
      res.json({ message: 'ok', code: 0 });
    });

    app.post('/api/config', (req, res) => {
      const config = req.body as M3u8DLOptions;
      this.saveConfig(config);
      res.json({ message: 'Config updated successfully', code: 0 });
    });

    app.get('/api/config', (_req, res) => {
      res.json({ ...this.cfg.dlOptions, ...this.cfg.webOptions });
    });

    // API to get all download progress
    app.get('/api/tasks', (_req, res) => {
      res.json(Object.fromEntries(this.dlCacheClone()));
    });

    // API to get queue status
    app.get('/api/queue/status', (_req, res) => {
      const pendingTasks = Array.from(this.dlCache.entries()).filter(([_, item]) => item.status === 'pending');
      const activeTasks = Array.from(this.dlCache.entries()).filter(([_, item]) => item.status === 'resume');

      res.json({
        queueLength: pendingTasks.length,
        activeDownloads: activeTasks.map(([url]) => url),
        maxConcurrent: this.cfg.webOptions.maxDownloads,
      });
    });

    // API to clear queue
    app.post('/api/queue/clear', (_req, res) => {
      let count = 0;
      for (const [url, item] of this.dlCache.entries()) {
        if (item.status === 'pending') {
          this.dlCache.delete(url);
          count++;
        }
      }

      if (count) this.wsSend('tasks');
      res.json({ message: `已清空 ${count} 个等待中的下载任务`, code: 0 });
    });

    // API to update task priority
    app.post('/api/priority', (req, res) => {
      const { url, priority } = req.body;
      const item = this.dlCache.get(url);
      if (!item) {
        res.json({ message: '任务不存在', code: 1 });
        return;
      }

      item.options.priority = priority;
      this.saveCache();
      res.json({ message: '已更新任务优先级', code: 0 });
    });

    // API to start m3u8 download
    app.post('/api/download', (req, res) => {
      const { url, options = {}, list = [] } = req.body;

      try {
        if (list.length) {
          for (const item of list) {
            const { url, ...options } = item;
            if (url) this.startDownload(url, options);
          }
        } else if (url) this.startDownload(url, options);

        res.json({ message: `Download started: ${list.length || 1}`, code: 0 });
        this.wsSend('tasks');
      } catch (error) {
        res.status(500).json({ error: `Download failed: ${(error as Error).message}` });
      }
    });

    // API to pause download
    app.post('/api/pause', (req, res) => {
      const { urls, all = false } = req.body;
      const urlsToPause: string[] = all ? [...this.dlCache.keys()] : urls;
      const list: CacheItem[] = [];

      for (const url of urlsToPause) {
        const item = this.dlCache.get(url);
        if (['resume', 'pending'].includes(item?.status)) {
          m3u8DLStop(url, item.workPoll);
          item.status = item.tsSuccess > 0 && item.tsSuccess === item.tsCount ? 'done' : 'pause';
          const { workPoll, ...tItem } = item;
          list.push(tItem);
        }
      }

      if (list.length) {
        this.wsSend('progress', list);
        this.startNextPending();
      }
      res.json({ message: `已暂停 ${list.length} 个下载任务`, code: 0, count: list.length });
    });

    // API to resume download
    app.post('/api/resume', (req, res) => {
      const { urls, all = false } = req.body;
      const urlsToResume: string[] = all ? [...this.dlCache.keys()] : urls;
      const list: CacheItem[] = [];

      for (const url of urlsToResume) {
        const item = this.dlCache.get(url);
        if (['pause', 'error'].includes(item?.status)) {
          this.startDownload(url, item.options);
          const { workPoll, ...t } = item;
          list.push(t);
        } else console.log(item?.status, url);
      }

      if (list.length) this.wsSend('progress', list);
      res.json({ message: list.length ? `已恢复 ${list.length} 个下载任务` : '没有找到可恢复的下载任务', code: 0, count: list.length });
    });

    // API to delete download
    app.post('/api/delete', (req, res) => {
      const { urls, deleteCache = false, deleteVideo = false } = req.body;
      const urlsToDelete = urls;
      const list: string[] = [];

      for (const url of urlsToDelete) {
        const item = this.dlCache.get(url);
        if (item) {
          m3u8DLStop(url, item.workPoll);
          this.dlCache.delete(url);
          list.push(item.url);

          if (deleteCache && item.current?.tsOut) {
            const cacheDir = dirname(item.current.tsOut);
            if (existsSync(cacheDir)) {
              rmSync(cacheDir, { recursive: true });
              logger.debug('删除缓存目录：', cacheDir);
            }
          }

          if (deleteVideo) {
            ['.ts', '.mp4'].forEach(ext => {
              const filepath = resolve(item.options.saveDir, item.options.filename + ext);
              if (existsSync(filepath)) {
                unlinkSync(filepath);
                logger.debug('删除文件：', filepath);
              }
            });
          }
        }
      }

      if (list.length) {
        this.wsSend('delete', list);
        this.saveCache();
        this.startNextPending();
      }
      res.json({ message: `已删除 ${list.length} 个下载任务`, code: 0, count: list.length });
    });

    app.get(/^\/localplay\/(.*)$/, (req, res) => {
      let filepath = decodeURIComponent(req.params[0]);

      if (filepath) {
        let ext = filepath.split('.').pop();
        if (!ext) {
          ext = 'm3u8';
          if (!existsSync(filepath)) filepath += '.m3u8';
        }

        const allowedDirs = [this.options.cacheDir, this.cfg.dlOptions.saveDir];

        if (!existsSync(filepath)) {
          for (const dir of allowedDirs) {
            const tpath = resolve(dir, filepath);
            if (existsSync(tpath)) {
              filepath = tpath;
              break;
            }
          }
        } else {
          filepath = resolve(filepath);
          const isAllow = !this.options.limitFileAccess || allowedDirs.some(d => filepath.startsWith(resolve(d)));

          if (!isAllow) {
            logger.error('[Localplay] Access denied:', filepath);
            res.send({ message: 'Access denied', code: 403 });
            return;
          }
        }

        if (existsSync(filepath)) {
          const stats = statSync(filepath);
          const headers = new Headers({
            'Last-Modified': stats.mtime.toUTCString(),
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Origin': '*',
            'Content-Length': String(stats.size),
            'Content-Type':
              ext === 'ts' ? 'video/mp2t' : ext === 'm3u8' ? 'application/vnd.apple.mpegurl' : ext === 'mp4' ? 'video/mp4' : 'text/plain',
          });
          res.setHeaders(headers);

          if (ext === 'm3u8' || ('ts' === ext && stats.size < 1024 * 1024 * 3)) {
            let content: string | Buffer = readFileSync(filepath);

            if (ext === 'm3u8') {
              const baseDirName = basename(filepath, '.m3u8');
              content = content
                .toString('utf8')
                .split('\n')
                .map(line => (line.endsWith('.ts') && !line.includes('/') ? `${baseDirName}/${line}` : line))
                .join('\n');
            }
            res.send(content);
            logger.debug('[Localplay]file sent:', gray(filepath), 'Size:', stats.size, 'bytes');
          } else {
            res.sendFile(filepath);
          }
          return;
        }
      }

      logger.error('[Localplay]file not found:', red(filepath));
      res.status(404).send({ message: 'Not Found', code: 404 });
    });

    app.post('/api/getM3u8Urls', (req, res) => {
      const { url, headers } = req.body;

      if (!url) {
        res.json({ code: 1001, message: '无效的 url 参数' });
      } else {
        getM3u8Urls(url, headers)
          .then(d => res.json({ code: 0, data: Array.from(d) }))
          .catch(err => res.json({ code: 401, message: (err as Error).message }));
      }
    });
  }
}
