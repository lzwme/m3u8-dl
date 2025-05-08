import { resolve, sep } from 'node:path';
import { existsSync } from 'node:fs';
import { cpus } from 'node:os';
import type { IncomingHttpHeaders } from 'node:http';
import { Barrier, formatTimeCost, md5, rmrfAsync } from '@lzwme/fe-utils';
import { formatByteSize } from '@lzwme/fe-utils/cjs/common/helper';
import { green, cyanBright, cyan, magenta, magentaBright, yellowBright, blueBright, greenBright } from 'console-log-colors';
import { isSupportFfmpeg, logger, request } from './utils.js';
import { WorkerPool } from './worker_pool.js';
import { parseM3U8 } from './parseM3u8.js';
import { m3u8Convert } from './m3u8-convert.js';
import type { M3u8DLOptions, M3u8DLProgressStats, TsItemInfo, WorkerTaskInfo } from '../types/m3u8.js';
import { localPlay, toLocalM3u8 } from './local-play.js';

const cache = {
  m3u8Info: {} as Record<string, unknown>,
  downloading: new Set<string>(),
};
const tsDlFile = resolve(__dirname, './ts-download.js');
export const workPoll = new WorkerPool<WorkerTaskInfo, { success: boolean; info: TsItemInfo }>(tsDlFile);

function formatOptions(url: string, opts: M3u8DLOptions) {
  const options: M3u8DLOptions = {
    delCache: !opts.debug,
    saveDir: process.cwd(),
    showProgress: true,
    ...opts,
  };

  if (!url.startsWith('http')) {
    url = url.replace(/\$+/, '|').replace(/\|\|+/, '|');
    if (url.includes('|')) {
      const r = url.split('|');
      url = r[1];

      if (!options.filename) options.filename = r[0];
      else options.filename = `${options.filename.replace(/\.(ts|mp4)$/, '')}-${r[0]}`;
    }
  }
  const urlMd5 = md5(url, false);

  if (!options.threadNum || +options.threadNum <= 0) options.threadNum = Math.min(cpus().length * 2, 8);
  if (!options.filename) options.filename = urlMd5;
  if (!options.filename.endsWith('.mp4')) options.filename += '.mp4';
  if (!options.cacheDir) options.cacheDir = `cache`;
  if (options.headers) {
    let headers = options.headers;
    if (typeof headers === 'string') {
      headers = Object.fromEntries(headers.split('\n').map(line => line.split(':').map(d => d.trim())));
    }
    request.setHeaders(headers as IncomingHttpHeaders);
  }

  if (options.debug) {
    logger.updateOptions({ levelType: 'debug' });
    logger.debug('[m3u8-DL]options', options, url);
  }
  return [url, options] as const;
}

async function m3u8InfoParse(url: string, options: M3u8DLOptions = {}) {
  [url, options] = formatOptions(url, options);

  const ext = isSupportFfmpeg() ? '.mp4' : '.ts';
  /** 最终合并转换后的文件路径 */
  let filepath = resolve(options.saveDir, options.filename);
  if (!filepath.endsWith(ext)) filepath += ext;

  const result = { options, m3u8Info: null as Awaited<ReturnType<typeof parseM3U8>> | null, filepath };

  if (cache.m3u8Info[url]) {
    Object.assign(result, cache.m3u8Info[url]);
    return result;
  }

  if (!options.force && existsSync(filepath)) return result;

  const m3u8Info = await parseM3U8(url, resolve(options.cacheDir, md5(url, false))).catch(e => logger.error('[parseM3U8][failed]', e));
  if (m3u8Info && m3u8Info?.tsCount > 0) result.m3u8Info = m3u8Info;

  return result;
}

export async function preDownLoad(url: string, options: M3u8DLOptions) {
  const result = await m3u8InfoParse(url, options);

  if (!result.m3u8Info) return;

  for (const info of result.m3u8Info.data) {
    if (!workPoll.freeNum) return;

    if (!cache.downloading.has(info.uri)) {
      cache.downloading.add(info.uri);

      workPoll.runTask({ url, info, options: JSON.parse(JSON.stringify(result.options)), crypto: result.m3u8Info.crypto }, () => {
        cache.downloading.delete(info.uri);
      });
    }
  }
}

export async function m3u8Download(url: string, options: M3u8DLOptions = {}) {
  logger.info('Starting download for', cyanBright(url));
  const result = await m3u8InfoParse(url, options);
  options = result.options;

  if (!options.force && existsSync(result.filepath) && !result.m3u8Info) {
    logger.info('file already exist:', result.filepath);
    return result;
  }

  if (result.m3u8Info?.tsCount > 0) {
    let n = options.threadNum - workPoll.numThreads;
    if (n > 0) while (n--) workPoll.addNewWorker();

    const { m3u8Info } = result;
    const startTime = Date.now();
    const barrier = new Barrier();
    const playStart = Math.min(options.threadNum + 2, result.m3u8Info.tsCount);
    const stats: M3u8DLProgressStats = {
      startTime,
      progress: 0,
      tsCount: m3u8Info.tsCount,
      tsSuccess: 0,
      tsFailed: 0,
      duration: m3u8Info.duration,
      durationDownloaded: 0,
      downloadedSize: 0,
      speed: 0,
      speedDesc: '',
      remainingTime: 0,
      localM3u8: toLocalM3u8(m3u8Info.data).replace(options.cacheDir, '').replaceAll(sep, '/').slice(1),
    };
    const runTask = (data: TsItemInfo[]) => {
      for (const info of data) {
        workPoll.runTask({ url, info, options: JSON.parse(JSON.stringify(options)), crypto: m3u8Info.crypto }, (err, res) => {
          if (!res || err) {
            if (err) {
              console.log('\n');
              logger.error('[TS-DL][error]', info.index, err, res || '');
            }

            if (!info.success) info.success = -1;
            else info.success--;

            if (info.success > -3) {
              logger.info(`[retry][times: ${info.success}]`, info.index, info.uri);
              setTimeout(() => runTask([info]), 1000);
              return;
            }
          }

          if (res?.success) {
            info.tsSize = res.info.tsSize;
            info.success = 1;
            stats.tsSuccess++;
            stats.durationDownloaded += info.duration;
          } else {
            stats.tsFailed++;
          }

          const finished = stats.tsFailed + stats.tsSuccess;
          const timeCost = Date.now() - startTime;
          stats.downloadedSize = m3u8Info.data.reduce((a, b) => a + (b.tsSize || 0), 0);
          const downloadedDuration = m3u8Info.data.reduce((a, b) => a + (b.tsSize ? b.duration : 0), 0);
          stats.speed = (stats.downloadedSize / timeCost) * 1000;
          stats.speedDesc = formatByteSize(stats.speed) + '/s';
          stats.remainingTime = downloadedDuration ? (timeCost * (m3u8Info.duration - stats.durationDownloaded)) / downloadedDuration : 0;
          stats.progress = Math.floor((finished / m3u8Info.tsCount) * 100);

          if (options.showProgress) {
            const processBar = '='.repeat(Math.floor(stats.progress * 0.2)).padEnd(20, '-');
            logger.logInline(
              `${stats.progress}% [${greenBright(processBar)}] ${cyan(finished)} ${green(stats.durationDownloaded.toFixed(2) + 'sec')} ` +
                `${blueBright(formatByteSize(stats.downloadedSize))} ${yellowBright(formatTimeCost(startTime))} ${magentaBright(stats.speedDesc)} ` +
                (finished === m3u8Info.tsCount
                  ? '\n'
                  : stats.remainingTime
                    ? `${cyan(formatTimeCost(Date.now() - Math.ceil(stats.remainingTime)))}`
                    : '')
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
        `\nTotal segments: ${cyan(m3u8Info.tsCount)}, duration: ${green(m3u8Info.duration + 'sec')}.`,
        `Parallel jobs: ${magenta(options.threadNum)}`
      );
    }

    runTask(m3u8Info.data);
    toLocalM3u8(m3u8Info.data, options.filename);

    await barrier.wait();
    if (stats.tsFailed === 0) {
      if (options.convert !== false) {
        result.filepath = await m3u8Convert(options, m3u8Info.data);
        if (result.filepath && existsSync(options.cacheDir) && options.delCache) rmrfAsync(options.cacheDir);
      }
    } else logger.warn('Download Failed! Please retry!', stats.tsFailed);
  }
  logger.debug('Done!', url, result.m3u8Info);
  return result;
}

export function m3u8DLStop(url: string) {
  return workPoll.removeTask(task => task.url === url);
}
