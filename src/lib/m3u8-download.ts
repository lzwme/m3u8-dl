import { existsSync, statSync } from 'node:fs';
import type { IncomingHttpHeaders } from 'node:http';
import { dirname, resolve, sep } from 'node:path';
import { Barrier, formatTimeCost, rmrfAsync } from '@lzwme/fe-utils';
import { formatByteSize } from '@lzwme/fe-utils/cjs/common/helper';
import { blueBright, cyan, cyanBright, green, greenBright, magenta, magentaBright, yellowBright } from 'console-log-colors';
import type { M3u8DLOptions, M3u8DLProgressStats, M3u8DLResult, M3u8WorkerPool, TsItemInfo } from '../types/m3u8.js';
import { formatOptions } from './format-options.js';
import { getLang, t } from './i18n.js';
import { localPlay, toLocalM3u8 } from './local-play.js';
import { m3u8Convert } from './m3u8-convert.js';
import { parseM3U8 } from './parseM3u8.js';
import { isSupportFfmpeg, logger } from './utils.js';
import { WorkerPool } from './worker_pool.js';

/** 下载队列管理 */
export class DownloadQueue {
  private queue: Array<{ url: string; options: M3u8DLOptions; priority: number }> = [];
  private activeDownloads = new Set<string>();
  private _maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this._maxConcurrent = maxConcurrent;
  }

  get maxConcurrent() {
    return this._maxConcurrent;
  }

  set maxConcurrent(value: number) {
    this._maxConcurrent = value;
  }

  add(url: string, options: M3u8DLOptions, priority = 0) {
    this.queue.push({ url, options, priority });
    this.queue.sort((a, b) => b.priority - a.priority);
    this.processQueue();
  }

  private async processQueue() {
    if (this.activeDownloads.size >= this._maxConcurrent) return;

    const next = this.queue.shift();
    if (!next) return;

    this.activeDownloads.add(next.url);
    try {
      const { maxDownloads, ...options } = next.options;
      const result = await m3u8Download(next.url, options);
      next.options.onComplete?.(result);
    } catch (error) {
      next.options.onComplete?.({
        errmsg: error instanceof Error ? error.message : error ? JSON.stringify(error) : 'Unknown error',
        options: next.options,
      });
    } finally {
      this.activeDownloads.delete(next.url);
      this.processQueue();
    }
  }

  pause(url: string) {
    const index = this.queue.findIndex(item => item.url === url);
    if (index > -1) {
      this.queue.splice(index, 1);
    }
  }

  resume(url: string, options: M3u8DLOptions, priority = 0) {
    this.add(url, options, priority);
  }

  clear() {
    this.queue = [];
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      activeDownloads: Array.from(this.activeDownloads),
      maxConcurrent: this._maxConcurrent,
    };
  }
}

/** 创建全局下载队列实例 */
export const downloadQueue = new DownloadQueue();

const cache = {
  m3u8Info: {} as Record<string, unknown>,
  downloading: new Set<string>(),
};
const tsDlFile = resolve(__dirname, './ts-download.js');
export const workPollPublic: M3u8WorkerPool = new WorkerPool(tsDlFile);

async function m3u8InfoParse(u: string, o: M3u8DLOptions = {}) {
  const ffmpegBin = o.ffmpegPath || 'ffmpeg';
  const ext = isSupportFfmpeg(ffmpegBin) ? '.mp4' : '.ts';

  const { url, options, urlMd5 } = formatOptions(u, o);

  /** 最终合并转换后的文件路径 */
  let filepath = resolve(options.saveDir, options.filename);
  if (!filepath.endsWith(ext)) filepath += ext;

  const result = { options, m3u8Info: null as Awaited<ReturnType<typeof parseM3U8>> | null, filepath };

  if (cache.m3u8Info[url]) {
    Object.assign(result, cache.m3u8Info[url]);
    return result;
  }

  if (!options.force && existsSync(filepath)) return result;

  const lang = getLang(o.lang);
  const m3u8Info = await parseM3U8(url, resolve(options.cacheDir, urlMd5), options.headers as IncomingHttpHeaders).catch(e => {
    logger.error(t('download.status.parseFailed', lang), e.message);
    console.log(e);
  });

  if (m3u8Info && m3u8Info?.tsCount > 0) {
    result.m3u8Info = m3u8Info;

    if (options.ignoreSegments) {
      const totalDuration = m3u8Info.duration;
      const timeSegments = options.ignoreSegments
        .split(',')
        .map(d => {
          const trimmed = d.trim();
          // 支持 END-60 格式，表示末尾N秒
          const parts = trimmed.split(/[- ]+/).map(d => d.trim());
          if (parts.length === 2 && parts[0].toUpperCase() === 'END') {
            const seconds = +parts[1];
            if (!Number.isNaN(seconds) && seconds > 0) {
              const start = Math.max(0, totalDuration - seconds);
              return [start, totalDuration];
            }
          }
          // 原有的 start-end 格式
          return parts.map(d => +d);
        })
        .filter(d => d[0] !== undefined && d[1] !== undefined && !Number.isNaN(d[0]) && !Number.isNaN(d[1]) && d[0] !== d[1]);

      if (timeSegments.length) {
        const total = m3u8Info.data.length;
        m3u8Info.data = m3u8Info.data.filter(item => {
          for (let [start, end] of timeSegments) {
            if (start > end) [start, end] = [end, start];
            if (item.timeline + item.duration / 2 >= start && item.timeline + item.duration / 2 <= end) {
              m3u8Info.duration -= item.duration;
              return false;
            }
          }

          return true;
        });

        const ignoredCount = total - m3u8Info.data.length;
        if (ignoredCount) {
          m3u8Info.tsCount = m3u8Info.data.length;
          logger.info(t('download.status.segmentsIgnored', lang, { count: cyanBright(ignoredCount) }));
          m3u8Info.duration = +Number(m3u8Info.duration).toFixed(2);
        }
      }
    }
  }

  return result;
}

/**
 * 计算实时下载速度：取从 idx 开始的最近 maxTime 时间内的下载总大小
 */
function calcSpeed(idx: number, data: TsItemInfo[], maxTime = 60 * 1000) {
  const now = Date.now();
  let startTime = now;
  let downloadedSize = 0;

  for (let i = idx; i >= 0; i--) {
    const info = data[i];

    if (info.tsSize && info.startTime && now - info.startTime < maxTime) {
      if (startTime > info.startTime) startTime = info.startTime;
      downloadedSize += info.tsSize;
    }
  }

  return now > startTime ? 1000 * (downloadedSize / (now - startTime)) : 0;
}

export async function preDownLoad(url: string, options: M3u8DLOptions, wp = workPollPublic) {
  const result = await m3u8InfoParse(url, options);

  if (!result.m3u8Info) return;

  for (const info of result.m3u8Info.data) {
    if (!wp.freeNum) return;

    if (!cache.downloading.has(info.uri)) {
      cache.downloading.add(info.uri);

      wp.runTask({ url, info, options: JSON.parse(JSON.stringify(result.options)), crypto: result.m3u8Info.crypto[info.keyUri] }, () => {
        cache.downloading.delete(info.uri);
      });
    }
  }
}

export async function m3u8Download(url: string, options: M3u8DLOptions = {}) {
  // 如果设置了最大并发数，则使用队列管理
  if (options.maxDownloads) {
    downloadQueue.maxConcurrent = options.maxDownloads;
    return new Promise<M3u8DLResult>(resolve => {
      const newOptions: M3u8DLOptions = {
        ...options,
        onComplete: r => {
          if (options.onComplete) options.onComplete(r);
          resolve(r);
        },
      };
      downloadQueue.add(url, newOptions, options.priority || 0);
    });
  }

  // 原有的下载逻辑
  const lang = getLang(options.lang);
  logger.info(t('download.status.starting', lang), cyanBright(url));
  const result: M3u8DLResult = await m3u8InfoParse(url, options);
  options = result.options;

  if (!options.force && existsSync(result.filepath) && !result.m3u8Info) {
    logger.info(t('download.status.fileExists', lang), result.filepath);
    result.isExist = true;
    return result;
  }

  if (result.m3u8Info?.tsCount > 0) {
    const workPoll: M3u8WorkerPool = new WorkerPool(tsDlFile, options.threadNum);
    const { m3u8Info } = result;
    const startTime = Date.now();
    const barrier = new Barrier();
    /** 本地开始播放最少需要下载的 ts 文件数量 */
    const playStart = Math.min(options.threadNum + 2, m3u8Info.tsCount);
    const stats: M3u8DLProgressStats = {
      url,
      startTime,
      progress: 0,
      tsCount: m3u8Info.tsCount,
      tsSuccess: 0,
      tsFailed: 0,
      duration: m3u8Info.duration,
      durationDownloaded: 0,
      downloadedSize: 0,
      avgSpeed: 0,
      avgSpeedDesc: '',
      speed: 0,
      speedDesc: '',
      remainingTime: 0,
      localM3u8: toLocalM3u8(m3u8Info.data).replace(options.cacheDir, '').replaceAll(sep, '/').slice(1),
      filename: options.filename,
      threadNum: options.threadNum,
    };
    const runTask = (data: TsItemInfo[]) => {
      for (const info of data) {
        const o = JSON.parse(JSON.stringify(options));
        workPoll.runTask({ url, info, options: o, crypto: m3u8Info.crypto[info.keyUri] }, (err, res, taskStartTime) => {
          stats.errmsg = err ? (err.cause as string) || err.message || err.toString() : '';

          if (!res || err) {
            if (err) {
              console.log('\n');
              logger.error(t('download.status.tsDownloadError', lang), info.index, err, res || '');
            }

            if (typeof info.success !== 'number') info.success = 0;
            else info.success--;

            if (info.success >= -3) {
              logger.warn(t('download.status.retryTimes', lang, { times: info.success }), info.index, info.uri);
              setTimeout(() => runTask([info]), 1000);
              return;
            }
          }

          if (res?.success) {
            info.tsSize = res.info.tsSize;
            info.startTime = taskStartTime; // res.timeCost;
            info.timeCost = Date.now() - taskStartTime;
            info.success = 1;
            stats.tsSuccess++;
            stats.durationDownloaded += info.duration;
            stats.speed = calcSpeed(info.index, data);
          } else {
            stats.tsFailed++;
          }

          const finished = stats.tsFailed + stats.tsSuccess;
          const timeCost = Date.now() - startTime;
          const downloadedDuration = m3u8Info.data.reduce((a, b) => a + (b.tsSize ? b.duration : 0), 0);

          stats.downloadedSize = m3u8Info.data.reduce((a, b) => a + (b.tsSize || 0), 0);
          stats.avgSpeed = (stats.downloadedSize / timeCost) * 1000;
          stats.avgSpeedDesc = `${formatByteSize(stats.avgSpeed)}/s`;
          // 如果当前速度小于平均速度，则更新为平均速度
          if (stats.speed < stats.avgSpeed) stats.speed = stats.avgSpeed;
          stats.speedDesc = `${formatByteSize(stats.speed)}/s`;
          stats.progress = Math.floor((finished / m3u8Info.tsCount) * 100);

          if (downloadedDuration) {
            stats.remainingTime = (timeCost / downloadedDuration) * (m3u8Info.duration - stats.durationDownloaded);
            if (stats.speed > stats.avgSpeed) stats.remainingTime = stats.remainingTime * (stats.avgSpeed / stats.speed);
            stats.remainingTime = Math.ceil(stats.remainingTime);
            stats.size = Math.round(stats.downloadedSize * (stats.duration / stats.durationDownloaded));
          }

          if (options.showProgress) {
            const processBar = '='.repeat(Math.floor(stats.progress * 0.2)).padEnd(20, '-');
            logger.logInline(
              `${stats.progress}% [${greenBright(processBar)}] ${cyan(finished)} ${green(`${stats.durationDownloaded.toFixed(2)}sec`)} ${blueBright(formatByteSize(stats.downloadedSize))} ${yellowBright(formatTimeCost(startTime))} ${magentaBright(stats.speedDesc)} ${
                finished === m3u8Info.tsCount
                  ? '\n'
                  : stats.remainingTime
                    ? `${cyan(formatTimeCost(Date.now() - stats.remainingTime))}`
                    : ''
              }`
            );
          }

          if (options.onProgress) options.onProgress(finished, m3u8Info.tsCount, info, stats);

          if (finished === m3u8Info.tsCount) {
            // pool.close();
            barrier.open();
          }

          if (options.play && finished === playStart) localPlay(m3u8Info.data);
        });
      }
    };
    if (options.showProgress) {
      console.info(
        `\n${t('download.status.totalSegments', lang, { count: cyan(m3u8Info.tsCount), duration: green(`${m3u8Info.duration}sec`) })}.`,
        t('download.status.parallelJobs', lang, { count: magenta(options.threadNum) })
      );
    }

    result.stats = stats;
    toLocalM3u8(m3u8Info.data);
    if (options.onInited) options.onInited(stats, m3u8Info, workPoll);
    runTask(m3u8Info.data);

    await barrier.wait();
    workPoll.close();

    if (stats.tsFailed > 0) {
      stats.errmsg = t('download.status.segmentsFailed', lang, { count: stats.tsFailed });
      result.errmsg = stats.errmsg;
      logger.warn(t('download.status.downloadFailedRetry', lang), stats.tsFailed);
    } else if (options.convert !== false) {
      stats.errmsg = t('download.status.mergingVideo', lang);
      if (options.onProgress) options.onProgress(stats.tsCount, m3u8Info.tsCount, null, stats);
      result.filepath = await m3u8Convert(options, m3u8Info.data);
      stats.errmsg = result.filepath ? '' : t('download.status.mergeFailed', lang);

      if (result.filepath && existsSync(result.filepath)) {
        stats.size = statSync(result.filepath).size;
        if (options.delCache) rmrfAsync(dirname(m3u8Info.data[0].tsOut));
      }
    }

    if (options.onProgress) options.onProgress(stats.tsCount, m3u8Info.tsCount, null, stats);
  }

  logger.debug('Done!', url, result.m3u8Info);
  return result;
}

export function m3u8DLStop(url: string, wp = workPollPublic) {
  if (!wp?.removeTask) return 0;
  const count = wp.removeTask(task => task.url === url);
  // 进行中的任务，最多允许继续下载 10s
  if (count === 0 && wp !== workPollPublic) setTimeout(() => wp.close(), 10_000);
  return count;
}
