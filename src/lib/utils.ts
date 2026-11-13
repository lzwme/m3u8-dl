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

/**
 * 补全缺失的协议头，如 `www.example.com/a` → `https://www.example.com/a`
 */
export function ensureProtocol(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/\//, '')}`;
}

/**
 * 规范化重定向地址。
 *
 * 服务端返回的 `Location` 可能是相对路径（如 B 站 301 到 `/video/BVxxx/`），
 * 直接使用会丢失协议与域名，必须按当前地址解析后再请求。
 */
export function resolveRedirectUrl(location: string, base: string) {
  try {
    return new URL(location, base).toString();
  } catch {
    return location;
  }
}

/**
 * 跟随重定向的 GET 请求。
 *
 * 这里自行处理 3xx 重定向，而不使用请求库内置的自动重定向：
 * 内置实现拼接 `host + location` 时会丢失协议（如 `www.bilibili.com/video/BVxxx/`），
 * 进而在构造 URL 时抛出 `ERR_INVALID_URL`，且该异常发生在响应回调中，
 * 无法被 Promise 捕获，最终会导致整个进程退出。
 */
async function getWithRedirect<T = string>(url: string, headers?: OutgoingHttpHeaders | string, maxRedirect = 5) {
  let current = ensureProtocol(url);

  for (let i = 0; i <= maxRedirect; i++) {
    const r = await request.request<T>('GET', current, null, { headers: formatHeaders(headers), rejectUnauthorized: false }, false);
    const status = r.response?.statusCode ?? 0;
    const location = r.response?.headers?.location;

    if (status >= 300 && status < 400 && location) {
      const next = resolveRedirectUrl(String(location), current);
      if (next !== current) {
        current = next;
        continue;
      }
    }

    return r;
  }

  throw new Error(`重定向次数过多: ${url}`);
}

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export const getRetry = <T = string>(url: string, headers?: OutgoingHttpHeaders | string, retries = 3) =>
  retry(
    () => getWithRedirect<T>(url, headers),
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
  if (!(ffmpegBin in ffmpegTestCache)) {
    // execSync 只返回 stdout（Buffer/string），并不存在 stderr 属性，
    // 因此不能用 `execSync(...).stderr === ''` 判断，否则恒为 false，ffmpeg 永远不会被启用
    try {
      execSync(`${ffmpegBin} -version`);
      ffmpegTestCache[ffmpegBin] = true;
    } catch {
      ffmpegTestCache[ffmpegBin] = false;
    }
  }
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
export async function getLocation(url: string, method = 'HEAD', depth = 0): Promise<string> {
  const current = ensureProtocol(url);
  const { res } = await request.req(current, null, { method, headers: { 'content-type': 'text/html' } }, false);
  const rurl = res.headers.location || res.headers['x-redirect'] || res.headers['x-location'];
  if (typeof rurl === 'string' && rurl && depth < 5) {
    // Location 可能是相对路径，需按当前地址解析，否则会丢失协议与域名
    const next = resolveRedirectUrl(rurl, current);
    if (next !== current) return getLocation(next, method, depth + 1);
  }
  return current;
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
