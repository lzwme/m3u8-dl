import { existsSync, readdirSync, type Stats, statSync } from 'node:fs';
import { access, constants } from 'node:fs/promises';
import type { OutgoingHttpHeaders } from 'node:http';
import { resolve } from 'node:path';
import { color, execSync, NLogger, Request, retry, toLowcaseKeyObject } from '@lzwme/fe-utils';
import type { M3u8ByteRange } from '../types/m3u8.js';

export const request = new Request({
  headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  reqOptions: { rejectUnauthorized: false },
});

/** 判断 HTTP 状态码是否成功。使用 Range 请求(byte-range 分片)时服务端通常返回 206 */
export function isOkStatus(statusCode?: number) {
  return typeof statusCode === 'number' && statusCode >= 200 && statusCode < 300;
}

/**
 * 追加 Range 请求头，用于支持 `EXT-X-BYTERANGE` 字节区间寻址的分片
 */
export function withRangeHeader(headers: OutgoingHttpHeaders | string | undefined, byterange?: M3u8ByteRange) {
  if (!byterange?.length) return headers;

  const offset = byterange.offset ?? 0;
  return { ...formatHeaders(headers as OutgoingHttpHeaders), range: `bytes=${offset}-${offset + byterange.length - 1}` };
}

/**
 * 按字节区间截取数据。
 * 部分服务端会忽略 Range 请求并返回完整文件，此时需要按偏移量截取
 */
export function sliceByterange<T extends Buffer>(buffer: T, byterange?: M3u8ByteRange): Buffer {
  if (!byterange?.length || buffer.byteLength <= byterange.length) return buffer;

  const offset = byterange.offset ?? 0;
  return buffer.subarray(offset, offset + byterange.length);
}

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export const getRetry = <T = string>(url: string, headers?: OutgoingHttpHeaders | string, retries = 3) =>
  retry(
    () => request.get<T>(url, null, formatHeaders(headers), { rejectUnauthorized: false }),
    1000,
    retries,
    r => {
      if (!isOkStatus(r.response.statusCode)) {
        console.log();
        logger.warn(`[retry][${url}][${r.response.statusCode}]`, r.response.statusMessage || r.data);
        // throw Error(`[${r.response.statusCode}]${r.response.statusMessage || r.data}`);
      }

      return isOkStatus(r.response.statusCode);
    }
  );

export const logger = NLogger.getLogger('[M3U8-DL]', { color });

const ffmpegTestCache: Record<string, boolean> = {};
export function isSupportFfmpeg(ffmpegBin: string) {
  if (!(ffmpegBin in ffmpegTestCache)) ffmpegTestCache[ffmpegBin] = execSync(`${ffmpegBin} -version`).stderr === '';
  return ffmpegTestCache[ffmpegBin];
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
export function formatHeaders(headers: string | OutgoingHttpHeaders) {
  if (!headers) return {};

  if (typeof headers === 'string') {
    headers = headers.trim();
    if (headers.startsWith('{') && headers.endsWith('}')) {
      try {
        headers = JSON.parse(headers);
      } catch (e) {
        console.error('解析 headers 失败:', e);
      }
    }

    if (typeof headers === 'string') {
      const parsed: Record<string, string> = {};
      headers
        .replace(/,\s*([a-zA-Z0-9_-]+:)/g, '\n$1') // 支持如 "Key1: Val1, Key2: Val2" 的格式
        .split('\n')
        .forEach(line => {
          const idx = line.indexOf(':');
          if (idx > 0) parsed[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        });
      headers = parsed;
    }
  }

  return toLowcaseKeyObject(headers as Record<string, string>);
}

/** 异步检查文件是否存在 */
export async function checkFileExists(filepath: string) {
  try {
    if (!filepath) return false;
    await access(filepath, constants.F_OK);
    return true;
  } catch (error) {
    logger.debug('checkFileExists failed:', filepath, (error as Error).message);
    return false;
  }
}
