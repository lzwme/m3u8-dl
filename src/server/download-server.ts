/*
 * @Author: renxia lzwy0820@qq.com
 * @Date: 2025-05-07 21:03:09
 * @LastEditors: renxia
 * @LastEditTime: 2025-05-08 22:22:59
 */
import { readFileSync, writeFileSync, existsSync, rmdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { assign } from '@lzwme/fe-utils';
import type { Express } from 'express';
import type { Server } from 'ws';
import type { M3u8DLOptions, M3u8DLProgressStats, TsItemInfo } from '../types/m3u8.js';
import { m3u8DLStop, m3u8Download } from '../lib/m3u8-download.js';
import { logger } from '../lib/utils.js';

interface DLServerOptions {
  port?: number;
  cacheDir?: string;
  configPath?: string;
}

type CacheItem = M3u8DLProgressStats & { current: TsItemInfo; options: M3u8DLOptions; status: 'pause' | 'resume' | 'done' };

class DLServer {
  app: Express = null;
  wss: Server = null;
  private options = {
    cacheDir: resolve(process.cwd(), './cache'),
    configPath: '',
    port: process.env.DS_PORT || 6600,
  };
  private baseDLOptions: M3u8DLOptions = {
    debug: process.env.DS_DEBUG == '1',
    saveDir: process.env.DS_SAVE_DIR || './downloads',
  };
  private downloadCache = new Map<string, CacheItem>();
  constructor(opts: DLServerOptions = {}) {
    Object.assign(this.options, opts);
    if (!this.options.configPath) this.options.configPath = resolve(this.options.cacheDir, 'config.json');

    this.init();
  }
  private async init() {
    this.readConfig();
    if (this.baseDLOptions.debug) logger.updateOptions({ levelType: 'debug' });
    this.loadCache();
    await this.createApp();
    this.initRouters();
    logger.debug('Server initialized', this.options, this.baseDLOptions);
  }
  private loadCache() {
    const cacheFile = resolve(this.options.cacheDir, 'cache.json');
    if (existsSync(cacheFile)) {
      (JSON.parse(readFileSync(cacheFile, 'utf8')) as [string, CacheItem][]).forEach(([url, item]) => {
        if (item.status === 'resume' || item.tsSuccess !== item.tsCount) item.status = 'pause';
        this.downloadCache.set(url, item);
      });
    }
  }
  private cacheSaveTimer: NodeJS.Timeout = null;
  public saveCache() {
    clearTimeout(this.cacheSaveTimer);
    return new Promise<void>(rs => {
      this.cacheSaveTimer = setTimeout(() => {
        const cacheFile = resolve(this.options.cacheDir, 'cache.json');
        writeFileSync(cacheFile, JSON.stringify(Array.from(this.downloadCache)));
      }, 1000);

      setTimeout(() => rs(), 1000);
    });
  }
  private readConfig(configPath?: string): M3u8DLOptions {
    try {
      if (!configPath) configPath = this.options.configPath;
      if (existsSync(configPath)) {
        Object.assign(this.baseDLOptions, JSON.parse(readFileSync(configPath, 'utf8')));
      }
    } catch (error) {
      logger.error('读取配置失败:', error);
    }

    return this.baseDLOptions;
  }
  saveConfig(config: M3u8DLOptions, configPath?: string) {
    if (!configPath) configPath = this.options.configPath;
    assign(this.baseDLOptions, config);
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
  private async createApp() {
    const { default: express } = await import('express');
    const { WebSocketServer } = await import('ws');
    const app = (this.app = express());
    const server = app.listen(this.options.port, () => logger.info(`Server running on port ${this.options.port}`));
    const wss = (this.wss = new WebSocketServer({ server }));

    app.use(express.json());
    app.use(express.static(resolve(__dirname, '../../client')));

    // 设置 headers
    app.use((_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'no-cache');

      next();
    });

    wss.on('connection', (ws, req) => {
      logger.info('Client connected:', req.socket.remoteAddress);
      ws.send(JSON.stringify({ type: 'tasks', data: Object.fromEntries(Array.from(this.downloadCache.entries())) }));

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
    const dlOptions: M3u8DLOptions = {
      ...this.baseDLOptions,
      ...options,
      cacheDir: this.options.cacheDir,
    };
    const item = this.downloadCache.get(url);
    if (item) item.status = 'resume';

    m3u8Download(url, {
      ...dlOptions,
      showProgress: dlOptions.debug,
      onProgress: (_finished, _total, current, stats) => {
        const item = this.downloadCache.get(url);
        const status = stats.tsSuccess === stats.tsCount ? 'done' : item?.status || 'resume';

        // console.log('onProgress', _finished, _total);
        this.downloadCache.set(url, { ...stats, current, options: dlOptions, status });
        this.saveCache();

        // 广播进度信息给所有客户端
        this.wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'progress', data: { status, url, current, ...stats } }));
          }
        });
      },
    });

    return dlOptions;
  }
  private initRouters() {
    const { app } = this;

    // API to set default config
    app.post('/config', (req, res) => {
      const config = req.body as M3u8DLOptions;
      this.saveConfig(config);
      res.json({ message: 'Config updated successfully', code: 0 });
    });

    // API to get default config
    app.get('/config', (_req, res) => {
      res.json(this.baseDLOptions);
    });

    // API to get all download progress
    app.get('/tasks', (_req, res) => {
      res.json(Object.fromEntries(Array.from(this.downloadCache)));
    });

    // API to start m3u8 download
    app.post('/download', (req, res) => {
      const { url, options = {} } = req.body;

      try {
        this.startDownload(url, options);
        res.json({ message: 'Download started', code: 0 });
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
        const count = m3u8DLStop(url);
        item.status = item.tsSuccess === item.tsCount ? 'done' : 'pause';
        res.json({ message: 'Download paused', code: 0, count });
      }
    });

    app.post('/pauseAll', (_req, res) => {
      let count = 0;
      for (const [url, item] of this.downloadCache.entries()) {
        if (item.status === 'resume') {
          m3u8DLStop(url);
          item.status = item.tsSuccess === item.tsCount ? 'done' : 'pause';
          count++;
        }
      }

      res.json({ message: 'All downloads paused', code: 0, count });
    });

    // API to resume download
    app.post('/resume', (req, res) => {
      const { url } = req.body;
      const item = this.downloadCache.get(url);
      if (item?.status === 'pause') {
        item.status = 'resume';
        this.startDownload(url, item.options);
        res.json({ message: 'Download resumed', code: 0 });
      } else {
        res.json({ message: '没有找到下载的任务', code: 1 });
      }
    });

    app.post('/resumeAll', (_req, res) => {
      let count = 0;
      for (const [url, item] of this.downloadCache.entries()) {
        if (item.status === 'pause') {
          item.status = 'resume';
          this.startDownload(url, item.options);
          count++;
        }
      }

      res.json({ message: 'All downloads resumed', code: 0, count });
    });

    // API to delete download
    app.post('/delete', (req, res) => {
      const { url, deleteCache = false, deleteVideo = false } = req.body;
      const item = this.downloadCache.get(url);

      if (item) {
        m3u8DLStop(url);
        this.downloadCache.delete(url);

        if (deleteCache) {
          const cacheDir = dirname(item.current.tsOut);
          if (existsSync(cacheDir)) {
            rmdirSync(cacheDir, { recursive: true });
          }
        }

        if (deleteVideo) {
          ['.ts', '.m3u8'].forEach(ext => {
            const filepath = resolve(item.options.saveDir, item.options.filename + ext);
            if (existsSync(filepath)) unlinkSync(filepath);
          });
        }
      }

      res.json({ message: 'Download deleted', code: 0 });
    });

    app.get(/^\/localplay\/(.*)$/, (req, res) => {
      let filepath = req.params[0];
      let ext = filepath.split('.').pop();
      if (!ext) {
        ext = 'm3u8';
        filepath += '.m3u8';
      }

      if (filepath) {
        if (!existsSync(filepath)) filepath = resolve(this.options.cacheDir, filepath);

        if (existsSync(filepath)) {
          const stats = statSync(filepath);
          const headers = new Headers({
            'Last-Modified': stats.mtime.toUTCString(),
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Origin': '*',
            'Content-Length': String(stats.size),
            'Content-Type': ext === 'ts' ? 'video/mp2t' : ext === 'm3u8' ? 'application/vnd.apple.mpegurl' : 'text/plain',
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

export default DLServer;
