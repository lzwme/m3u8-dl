import { cpus } from 'node:os';
import { basename, extname } from 'node:path';
import { md5 } from '@lzwme/fe-utils';
import type { M3u8DLOptions } from '../types';
import { VideoParser } from '../video-parser';
import { formatHeaders, logger } from './utils';

const fileSupportExtList = [
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.wmv',
  '.ts',
  '.exe',
  '.zip',
  '.rar',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
];

export function formatOptions(url: string, opts: M3u8DLOptions) {
  const options: M3u8DLOptions = {
    delCache: !opts.debug,
    saveDir: process.cwd(),
    showProgress: true,
    ...opts,
  };
  let ext = options.filename ? extname(options.filename) : '';

  if (!options.type) {
    if (VideoParser.getPlatform(url).platform !== 'unknown') {
      options.type = 'parser';
    } else {
      options.type = 'm3u8';

      if (!url.includes('.m3u8')) {
        const e = fileSupportExtList.find(d => url.includes(d));
        if (e) {
          options.type = 'file';
          ext = e;
        }
      }
    }
  }

  let [u, n] = url.split(/[|$]+/);
  if (n?.startsWith('http')) [u, n] = [n, u];
  url = u;

  if (n) {
    if (!options.filename) options.filename = n;
    else options.filename = `${options.filename.replace(/\.(ts|mp4)$/, '')}-${n}${ext}`;
  }

  const urlMd5 = md5(url, false);

  if (!options.filename) {
    if (ext && url.includes(ext)) options.filename = basename(url.split(ext)[0]) + ext;
    else options.filename = urlMd5 + ext;
  }

  if (!extname(options.filename) && options.type !== 'file') options.filename += ext || '.mp4';

  if (!options.cacheDir) options.cacheDir = 'cache';
  if (options.headers) options.headers = formatHeaders(options.headers);
  if (!options.threadNum || +options.threadNum <= 0) options.threadNum = Math.min(cpus().length * 2, 8);

  if (options.debug) {
    logger.updateOptions({ levelType: 'debug' });
    logger.debug('[m3u8-DL]options', options, url);
  }
  return { url, options, urlMd5 };
}
