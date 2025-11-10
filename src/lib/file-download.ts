import { resolve } from 'node:path';
import { download, formatByteSize, formatTimeCost } from '@lzwme/fe-utils';
import { blueBright, cyan, gray, greenBright, magentaBright, yellowBright } from 'console-log-colors';
import type { M3u8DLOptions, M3u8DLProgressStats, M3u8DLResult } from '../types';
import { getLang, t } from './i18n.js';
import { formatOptions } from './format-options.js';
import { formatHeaders, logger } from './utils.js';

export async function fileDownload(u: string, opts: M3u8DLOptions): Promise<M3u8DLResult> {
  logger.debug('fileDownload', u, opts);
  const { url, options } = formatOptions(u, opts);
  const lang = getLang(options.lang);
  const startTime = Date.now();
  const stats: M3u8DLProgressStats = {
    url,
    startTime,
    progress: 0,
    tsSuccess: 0,
    tsFailed: 0,
    tsCount: 0,
    duration: 0,
    durationDownloaded: 0,
    downloadedSize: 0,
    avgSpeed: 0,
    avgSpeedDesc: '0B/s',
    speed: 0,
    speedDesc: '0B/s',
    remainingTime: 0,
    filename: options.filename,
    localVideo: resolve(options.saveDir, options.filename),
  };
  logger.debug(t('download.status.starting', lang), gray(url), cyan(stats.localVideo));
  if (options.onInited) options.onInited(stats, null, null);

  try {
    const r = await download({
      url,
      filepath: stats.localVideo,
      paralelism: options.threadNum,
      force: options.force,
      requestOptions: {
        headers: {
          referer: new URL(url).origin,
          ...formatHeaders(options.headers),
        },
        rejectUnauthorized: false,
      },
      onProgress: info => {
        stats.progress = +info.percent.toFixed(2);
        stats.size = info.size;
        stats.downloadedSize = info.downloaded;
        stats.speed = info.speed;
        stats.speedDesc = `${formatByteSize(stats.speed)}/s`;
        stats.remainingTime = Math.round((info.size - info.downloaded) / stats.speed);

        if (options.showProgress) {
          const processBar = info.percent === -1 ? '' : '='.repeat(Math.floor(stats.progress * 0.2)).padEnd(20, '-');
          logger.logInline(
            [
              `${stats.progress}% [${greenBright(processBar)}] `,
              `${blueBright(formatByteSize(stats.downloadedSize))} ${yellowBright(formatTimeCost(startTime))} ${magentaBright(stats.speedDesc)} `,
              stats.progress === 100 ? '\n' : stats.remainingTime ? `${cyan(formatTimeCost(Date.now() - stats.remainingTime))}` : '',
            ].join('')
          );
        }

        if (options.onProgress) {
          return options.onProgress(info.downloaded, info.size, null, stats);
        }
      },
    });

    stats.endTime = Date.now();

    return {
      errmsg: r.filepath ? t('download.status.completed', lang) : t('download.status.failed', lang),
      ...r,
      stats,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(t('download.status.failed', lang), errorMessage, gray(url));
    stats.errmsg = errorMessage;

    return {
      isExist: false,
      errmsg: t('download.status.downloadFailedWithMessage', lang, { message: errorMessage }),
      stats,
    };
  }
}
