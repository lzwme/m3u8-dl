/*
 * @Author: renxia lzwy0820@qq.com
 * @Date: 2025-05-07 21:03:09
 * @LastEditors: renxia
 * @LastEditTime: 2025-05-09 20:04:36
 */
import { readFileSync, writeFileSync, existsSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { assign, getUrlParams, mkdirp } from '@lzwme/fe-utils';
import type { Express } from 'express';
import type { Server } from 'ws';
import type { M3u8DLOptions, M3u8DLProgressStats, M3u8WorkerPool, TsItemInfo } from '../types/m3u8.js';
import { m3u8DLStop, m3u8Download } from '../lib/m3u8-download.js';
import { logger } from '../lib/utils.js';

interface DLServerOptions {
  port?: number;
  cacheDir?: string;
  configPath?: string;
  debug?: boolean;
  /** 登录 token，默认取环境变量 DS_TOKEN */
  token?: string;
}

interface CacheItem extends Partial<M3u8DLProgressStats> {
  url: string;
  options: M3u8DLOptions;
  status: 'pause' | 'resume' | 'done' | 'pending' | 'error';
  current?: TsItemInfo;
  workPoll?: M3u8WorkerPool;
}

export class DLServer {
  version = '';
  app: Express = null;
  wss: Server = null;
  /** DS 参数 */
  options: DLServerOptions = {
    port: Number(process.env.DS_PORT) || 6600,
    cacheDir: resolve(process.cwd(), './cache'),
    token: process.env.DS_TOKEN || '',
    debug: process.env.DS_DEBUG == '1',
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
      debug: process.env.DS_DEBUG == '1',
      saveDir: process.env.DS_SAVE_DIR || './downloads',
    } as M3u8DLOptions,
  };
  /** 下载任务缓存 */
  private downloadCache = new Map<string, CacheItem>();
  /** 正在下载的任务数量 */
  private get downloading() {
    return Array.from(this.downloadCache.values()).filter(item => item.status === 'resume').length;
  }

  constructor(opts: DLServerOptions = {}) {
    opts = Object.assign(this.options, opts);
    if (!opts.configPath) opts.configPath = resolve(opts.cacheDir, 'config.json');
    const pkgFile = resolve(__dirname, '../../package.json');
    if (existsSync(pkgFile)) {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
      this.version = pkg.version;
    }

    this.init();
  }
  private async init() {
    this.readConfig();
    if (this.cfg.dlOptions.debug) logger.updateOptions({ levelType: 'debug' });
    this.loadCache();
    await this.createApp();
    this.initRouters();
    logger.debug('Server initialized', this.options, this.cfg.dlOptions);
  }
  private loadCache() {
    const cacheFile = resolve(this.options.cacheDir, 'cache.json');
    if (existsSync(cacheFile)) {
      (JSON.parse(readFileSync(cacheFile, 'utf8')) as [string, CacheItem][]).forEach(([url, item]) => {
        if (item.status === 'resume' || item.tsSuccess !== item.tsCount) {
          item.status = 'pause';
        } else {
          const isError = item.status === 'done' && item.options?.convert && (!item.localVideo || !existsSync(item.localVideo));
          if (isError) {
            item.status = 'error';
            item.errmsg = '本地视频文件不存在';
            item.localVideo = '';
          }
        }

        this.downloadCache.set(url, item);
      });
    }
  }
  private cacheSaveTimer: NodeJS.Timeout = null;
  downloadCacheClone() {
    const info: [string, CacheItem][] = [];
    for (const [url, v] of this.downloadCache) {
      const { workPoll, ...item } = v;
      for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'function') delete item[key as keyof typeof item];
      }
      info.push([url, item]);
    }
    return info;
  }
  public saveCache() {
    clearTimeout(this.cacheSaveTimer);
    return new Promise<void>(rs => {
      this.cacheSaveTimer = setTimeout(() => {
        const cacheFile = resolve(this.options.cacheDir, 'cache.json');
        const info = this.downloadCacheClone();

        mkdirp(dirname(cacheFile));
        writeFileSync(cacheFile, JSON.stringify(info));
      }, 1000);

      setTimeout(() => rs(), 1000);
    });
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
    const app = (this.app = express());
    const server = app.listen(this.options.port, () => logger.info(`Server running on port ${this.options.port}`));
    const wss = (this.wss = new WebSocketServer({ server }));

    app.use(express.json());
    app.use(express.static(resolve(__dirname, '../../client')));

    // headers
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'no-cache');

      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      if (this.options.token && req.headers['authorization'] !== this.options.token) {
        const ignorePaths = ['/healthcheck', '/localplay'];
        if (!ignorePaths.some(d => req.url.includes(d))) {
          const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          logger.warn('Unauthorized access:', clientIp, req.url, req.headers['authorization']);
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

      ws.send(JSON.stringify({ type: 'version', data: this.version }));
      ws.send(JSON.stringify({ type: 'tasks', data: Object.fromEntries(this.downloadCacheClone()) }));

      // ws.on('message', (message, _isBinary) => {
      //   logger.info('Received message from client:', (message as Buffer).toString('utf8'));
      // });
    });
    wss.on('close', () => {
      logger.info('WebSocket server closed');
    });
    wss.on('error', err => {
      logger.error('WebSocket server error:', err);
    });
    wss.on('listening', () => {
      logger.info(`WebSocket server listening on port ${this.options.port}`);
    });

    return { app, wss };
  }
  private startDownload(url: string, options?: M3u8DLOptions) {
    const cacheItem = this.downloadCache.get(url);
    const dlOptions: M3u8DLOptions = {
      ...this.cfg.dlOptions,
      ...options,
      cacheDir: this.options.cacheDir,
    };
    logger.debug('startDownload', url, dlOptions, cacheItem?.status);

    if (cacheItem && cacheItem?.status === 'resume') return cacheItem.options;

    if (this.downloading >= this.cfg.webOptions.maxDownloads) {
      if (cacheItem) cacheItem.status = 'pending';
      else this.downloadCache.set(url, { options: dlOptions, status: 'pending', url });

      return cacheItem?.options || dlOptions;
    }

    let workPoll: M3u8WorkerPool = cacheItem?.workPoll;
    if (cacheItem) cacheItem.status = 'resume';

    const defaultItem: CacheItem = { options: dlOptions, status: 'resume', url };
    m3u8Download(url, {
      ...dlOptions,
      showProgress: dlOptions.debug || this.options.debug,
      onInited: (_m3u8Info, wp) => {
        workPoll = wp;
      },
      onProgress: (_finished, _total, current, stats) => {
        const item = this.downloadCache.get(url) || defaultItem;
        const status = item?.status || 'resume';

        Object.assign(item, { ...stats, current, options: dlOptions, status, workPoll, url });
        this.downloadCache.set(url, item);
        this.saveCache();
        this.wsSend('progress', url);
      },
    }).then(r => {
      const item = this.downloadCache.get(url) || defaultItem;
      if (r.filepath && existsSync(r.filepath)) {
        item.localVideo = r.filepath;
        item.downloadedSize = statSync(r.filepath).size;
      }

      item.endTime = Date.now();
      item.status = 'done';
      if ('error' in r) {
        item.status = 'error';
        item.errmsg = (r.error.cause as string) || r.error.message;
      }

      this.wsSend('progress', url);
      this.saveCache();

      // 找到一个 pending 的任务，开始下载
      for (const [url, item] of this.downloadCache.entries()) {
        if (item.status === 'pending') {
          this.startDownload(url, item.options);
          this.wsSend('progress', url);
          break;
        }
      }
    });

    return dlOptions;
  }
  private wsSend(type = 'progress', data?: unknown) {
    if (type === 'tasks' && !data) {
      data = Object.fromEntries(this.downloadCacheClone());
    } else if (type === 'progress' && typeof data === 'string') {
      const item = this.downloadCache.get(data);
      if (item) {
        const { workPoll, ...stats } = item;
        data = { ...stats, url: data };
      }
    }

    // 广播进度信息给所有客户端
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(JSON.stringify({ type, data }));
    });
  }
  private initRouters() {
    const { app } = this;

    // health check
    app.get('/healthcheck', (_req, res) => {
      res.json({ message: 'ok', code: 0 });
    });

    // API to set default config
    app.post('/config', (req, res) => {
      const config = req.body as M3u8DLOptions;
      this.saveConfig(config);
      res.json({ message: 'Config updated successfully', code: 0 });
    });

    // API to get default config
    app.get('/config', (_req, res) => {
      res.json({ ...this.cfg.dlOptions, ...this.cfg.webOptions });
    });

    // API to get all download progress
    app.get('/tasks', (_req, res) => {
      res.json(Object.fromEntries(this.downloadCacheClone()));
    });

    // API to get queue status
    app.get('/queue/status', (_req, res) => {
      const pendingTasks = Array.from(this.downloadCache.entries()).filter(([_, item]) => item.status === 'pending');
      const activeTasks = Array.from(this.downloadCache.entries()).filter(([_, item]) => item.status === 'resume');

      res.json({
        queueLength: pendingTasks.length,
        activeDownloads: activeTasks.map(([url]) => url),
        maxConcurrent: this.cfg.webOptions.maxDownloads,
      });
    });

    // API to clear queue
    app.post('/queue/clear', (_req, res) => {
      let count = 0;
      for (const [url, item] of this.downloadCache.entries()) {
        if (item.status === 'pending') {
          this.downloadCache.delete(url);
          count++;
        }
      }

      if (count) this.wsSend('tasks');
      res.json({ message: `已清空 ${count} 个等待中的下载任务`, code: 0 });
    });

    // API to update task priority
    app.post('/priority', (req, res) => {
      const { url, priority } = req.body;
      const item = this.downloadCache.get(url);
      if (!item) {
        res.json({ message: '任务不存在', code: 1 });
        return;
      }

      item.options.priority = priority;
      this.saveCache();
      res.json({ message: '已更新任务优先级', code: 0 });
    });

    // API to start m3u8 download
    app.post('/download', (req, res) => {
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
    app.post('/pause', (req, res) => {
      const { url } = req.body;
      const item = this.downloadCache.get(url);
      if (!item) {
        res.json({ message: 'Download not found', code: 1 });
        return;
      } else {
        const count = m3u8DLStop(url, item.workPoll);
        item.status = item.tsSuccess === item.tsCount ? 'done' : 'pause';
        res.json({ message: `Download paused: ${count}`, code: 0, count });
        this.wsSend('progress', url);
      }
    });

    app.post('/pauseAll', (_req, res) => {
      let count = 0;
      for (const [url, item] of this.downloadCache.entries()) {
        if (item.status === 'resume') {
          m3u8DLStop(url, item.workPoll);
          item.status = item.tsSuccess === item.tsCount ? 'done' : 'pause';
          count++;
        }
      }

      if (count) this.wsSend('tasks');
      res.json({ message: `All downloads paused: ${count}`, code: 0, count });
    });

    // API to resume download
    app.post('/resume', (req, res) => {
      const { url } = req.body;
      const item = this.downloadCache.get(url);
      if (['pause', 'error'].includes(item?.status)) {
        this.startDownload(url, item.options);
        res.json({ message: 'Download resumed', code: 0 });
        this.wsSend('progress', url);
      } else {
        res.json({ message: '没有找到下载的任务', code: 1 });
      }
    });

    app.post('/resumeAll', (_req, res) => {
      let count = 0;
      for (const [url, item] of this.downloadCache.entries()) {
        if (['pause', 'error'].includes(item?.status)) {
          this.startDownload(url, item.options);
          count++;
        }
      }

      if (count) this.wsSend('tasks');
      res.json({ message: `All downloads resumed: ${count}`, code: 0, count });
    });

    // API to delete download
    app.post('/delete', (req, res) => {
      const { url, deleteCache = false, deleteVideo = false } = req.body;
      const item = this.downloadCache.get(url);

      if (item) {
        m3u8DLStop(url, item.workPoll);
        this.downloadCache.delete(url);

        if (deleteCache) {
          const cacheDir = dirname(item.current.tsOut);
          if (existsSync(cacheDir)) rmSync(cacheDir, { recursive: true });
        }

        if (deleteVideo) {
          ['.ts', '.m3u8'].forEach(ext => {
            const filepath = resolve(item.options.saveDir, item.options.filename + ext);
            if (existsSync(filepath)) unlinkSync(filepath);
          });
        }

        this.wsSend('progress', url);
      } else {
        res.json({ message: 'Download not found', code: 1 });
        return;
      }

      res.json({ message: 'Download deleted', code: 0 });
    });

    app.get(/^\/localplay\/(.*)$/, (req, res) => {
      let filepath = decodeURIComponent(req.params[0]);

      if (filepath) {
        let ext = filepath.split('.').pop();
        if (!ext) {
          ext = 'm3u8';
          filepath += '.m3u8';
        }

        if (!existsSync(filepath)) filepath = resolve(this.options.cacheDir, filepath);

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
          res.setHeaders(headers).sendFile(filepath);
          return;
        }
      }

      logger.error('Localplay file not found:', filepath);
      res.status(404).send('Not Found');
    });
  }
}
