import { execSync, NLogger, color, Request, retry } from '@lzwme/fe-utils';
import { existsSync, readdirSync, Stats, statSync } from 'node:fs';
import { resolve } from 'node:path';

export const request = new Request('', {
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
});

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export const getRetry = <T = string>(url: string, retries = 3) =>
  retry(
    () => request.get<T>(url, null, {}, { rejectUnauthorized: false }),
    1000,
    retries,
    r => {
      if (r.response.statusCode !== 200) {
        console.log();
        logger.warn(`[retry][${url}][${r.response.statusCode}]`, r.response.statusMessage || r.data);
        // throw Error(`[${r.response.statusCode}]${r.response.statusMessage || r.data}`);
      }

      return r.response.statusCode === 200;
    }
  );

export const logger = NLogger.getLogger('[M3U8-DL]', { color });

let _isSupportFfmpeg: boolean = null;
export function isSupportFfmpeg() {
  if (null == _isSupportFfmpeg) _isSupportFfmpeg = execSync('ffmpeg -version').stderr === '';
  return _isSupportFfmpeg;
}

export function findFiles(apidir?: string, validate?: (filepath: string, stat: Stats) => boolean) {
  const files: string[] = [];

  if (apidir && existsSync(apidir)) {
    const stat = statSync(apidir);

    if (!validate || validate(apidir, stat)) {
      if (stat.isFile()) {
        files.push(resolve(apidir));
      } else if (stat.isDirectory()) {
        readdirSync(apidir).forEach(filename => {
          findFiles(resolve(apidir, filename)).forEach(f => files.push(f));
        });
      }
    }
  }

  return files;
}
