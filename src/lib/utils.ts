import { type Stats, existsSync, readdirSync, statSync } from 'node:fs';
import type { IncomingHttpHeaders } from 'node:http';
import { resolve } from 'node:path';
import { NLogger, Request, color, execSync, retry, toLowcaseKeyObject } from '@lzwme/fe-utils';

export const request = new Request({
  headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  reqOptions: { rejectUnauthorized: false },
});

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export const getRetry = <T = string>(url: string, headers?: IncomingHttpHeaders, retries = 3) =>
  retry(
    () => request.get<T>(url, null, headers, { rejectUnauthorized: false }),
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
        for (const filename of readdirSync(apidir)) {
          files.push(...findFiles(resolve(apidir, filename)));
        }
      }
    }
  }

  return files;
}

/** 获取重定向后的 URL */
export async function getLocation(url: string, method = 'HEAD'): Promise<string> {
  const { res } = await request.req(url, null, { method, headers: { 'content-type': 'text/html' } }, false);
  const rurl = res.headers.location || res.headers['x-redirect'] || res.headers['x-location'];
  if (typeof rurl === 'string' && rurl !== url) return getLocation(rurl, method);
  return url;
}

/**
 * 将传入的 headers 转换为统一的小写键对象格式
 * 如果 headers 是字符串，会先将其解析为对象；如果 headers 为空，则返回空对象。
 */
export function formatHeaders(headers: string | IncomingHttpHeaders) {
  if (typeof headers === 'string') {
    headers = Object.fromEntries(headers.split('\n').map(line => line.split(':').map(d => d.trim())));
  } else if (!headers) return {};

  return toLowcaseKeyObject(headers as Record<string, string>);
}
