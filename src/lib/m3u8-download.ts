import { resolve } from 'node:path';
import { existsSync, promises } from 'node:fs';
import { cpus } from 'node:os';
import { Barrier, md5, rmrf } from '@lzwme/fe-utils';
import { green, cyanBright } from 'console-log-colors';
import { isSupportFfmpeg, logger, request } from './utils';
import { WorkerPool } from './worker_pool';
import { parseM3U8 } from './parseM3u8';
import { m3u8Convert } from './m3u8-convert';
import type { M3u8DLOptions, TsItemInfo, WorkerTaskInfo } from '../type';
import { localPlay } from './local-play';

const tsDlFile = resolve(__dirname, './ts-download.js');

async function formatOptions(url: string, opts: M3u8DLOptions) {
  const options: M3u8DLOptions = {
    delCache: !opts.debug,
    saveDir: process.cwd(),
    ...opts,
  };

  if (!url.startsWith('http')) {
    url = url.replace('$', '|').replace(/\|\|+/, '|');
    if (url.includes('|')) {
      const r = url.split('|');
      url = r[1];

      if (!options.filename) options.filename = r[0];
      else options.filename = `${options.filename.replace(/\.(ts|mp4)$/, '')}-${r[0]}`;
    }
  }
  const urlMd5 = md5(url, false);

  if (+options.threadNum <= 0) options.threadNum = cpus().length;
  if (!options.filename) options.filename = urlMd5;
  if (!options.filename.endsWith('.mp4')) options.filename += '.mp4';
  if (!options.cacheDir) options.cacheDir = `cache/${urlMd5}`;
  if (!existsSync(options.cacheDir)) await promises.mkdir(options.cacheDir, { recursive: true });
  if (options.headers) request.setHeaders(options.headers);

  if (options.debug) {
    logger.updateOptions({ levelType: 'debug' });
    logger.debug('[m3u8-DL]options', options);
  }
  return [url, options] as const;
}

export async function m3u8Download(url: string, options: M3u8DLOptions = {}) {
  logger.info('starting download for', cyanBright(url));
  [url, options] = await formatOptions(url, options);

  const ext = isSupportFfmpeg() ? '.mp4' : '.ts';
  let filepath = resolve(options.saveDir, options.filename);
  if (!filepath.endsWith(ext)) filepath += ext;

  const m3u8Info = await parseM3U8('', url, options.cacheDir);
  const result = { options, m3u8Info, filepath };

  if (!options.force && existsSync(filepath)) {
    logger.info('file already exist:', filepath);
    return result;
  }

  if (m3u8Info.tsCount > 0) {
    const pool = new WorkerPool<WorkerTaskInfo, { success: boolean; info: TsItemInfo }>(tsDlFile, options.threadNum);
    const barrier = new Barrier();
    const playStart = Math.min(options.threadNum + 2, m3u8Info.tsCount);
    const stats = {
      /** 下载成功的 ts 数量 */
      tsSuccess: 0,
      /** 下载失败的 ts 数量 */
      tsFailed: 0,
      /** 下载完成的时长 */
      duration: 0,
    };

    for (const info of m3u8Info.data) {
      pool.runTask({ info, options: JSON.parse(JSON.stringify(options)), crypto: m3u8Info.crypto }, (err, res) => {
        if (err) {
          console.log('\n');
          logger.error('[TS-DL][error]', info.index, err, res);
        }
        if (!res) return;

        if (res.success) {
          stats.tsSuccess++;
          stats.duration = +(stats.duration + info.duration).toFixed(2);
        } else {
          stats.tsFailed++;
        }

        info.success = res.success;
        const finished = stats.tsFailed + stats.tsSuccess;

        if (options.showProgress !== false) {
          const percent = Math.ceil((finished / m3u8Info.tsCount) * 100);
          const processBar = '='.repeat(Math.ceil(percent * 0.4)).padEnd(40, '-');
          logger.logInline(
            `Downloading: ${percent}% [${green(processBar)}] segment: ${finished}/${m3u8Info.tsCount}, duration: ${stats.duration}/${
              m3u8Info.durationSecond
            }sec${finished === m3u8Info.tsCount ? '\n' : ''}`
          );
        }

        if (options.onProgress) options.onProgress(finished, m3u8Info.tsCount, info);

        if (finished === m3u8Info.tsCount) {
          pool.close();
          barrier.open();
        }

        if (options.play && finished === playStart) {
          localPlay(m3u8Info.data, options);
        }
      });
    }

    await barrier.wait();
    if (stats.tsFailed === 0) {
      result.filepath = await m3u8Convert(options, m3u8Info.data);

      if (existsSync(options.cacheDir) && options.delCache) rmrf(options.cacheDir);
    } else logger.debug('Download Failed! Please retry!', stats.tsFailed);
  }
  logger.debug('Done!', url, result.m3u8Info);
  return result;
}
