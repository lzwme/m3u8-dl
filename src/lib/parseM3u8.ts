import { existsSync, promises } from 'node:fs';
import type { IncomingHttpHeaders } from 'node:http';
import { resolve } from 'node:path';
import { md5 } from '@lzwme/fe-utils';
import { Parser } from 'm3u8-parser';
import type { M3u8Info, TsItemInfo } from '../types/m3u8';
import { getRetry, logger } from './utils';

/**
 * 解析 m3u8 文件
 * @param content m3u8 文件的内容，可为 http 远程地址、本地文件路径
 * @param cacheDir 缓存文件保存目录
 */
export async function parseM3U8(content: string, cacheDir = './cache', headers?: IncomingHttpHeaders) {
  let url = process.cwd();

  if (content.startsWith('http')) {
    url = content;
    content = (await getRetry<string>(url)).data;
  } else if (!content.includes('\n') && existsSync(content)) {
    url = resolve(process.cwd(), content);
    content = await promises.readFile(url, 'utf8');
  }

  if (!content) {
    logger.error('获取播放列表为空！', url);
  }

  logger.debug('starting parsing m3u8 file:', url);

  let parser = new Parser();
  parser.push(content);
  parser.end();
  logger.debug('parser.manifest', parser.manifest);

  if (parser.manifest.playlists?.length > 0) {
    let maxBandwidthItem = parser.manifest.playlists[0];
    for (const item of parser.manifest.playlists) {
      if (!maxBandwidthItem || (item.attributes?.BANDWIDTH || 0) > (maxBandwidthItem.attributes?.BANDWIDTH || 0)) {
        maxBandwidthItem = item;
      }
    }

    url = new URL((maxBandwidthItem as unknown as { uri: string }).uri, url).toString();
    logger.debug('maxBandwidthItem', maxBandwidthItem, url);

    content = (await getRetry<string>(url, headers)).data;
    parser = new Parser();
    parser.push(content);
    parser.end();
  }

  const tsList = parser.manifest.segments || [];
  const result: M3u8Info = {
    manifest: parser.manifest,
    /** ts 文件数量 */
    tsCount: tsList.length,
    /** 总时长 */
    duration: 0,
    data: [] as TsItemInfo[],
    /** 加密相关信息 */
    crypto: {},
  };

  if (!result.tsCount) {
    logger.error('m3u8 file error!\n', url, content);
    return result;
  }

  for (const [i, item] of tsList.entries()) {
    if (!item.uri.includes('://')) item.uri = new URL(item.uri, url).toString();

    if (item.key) {
      const tsKeyInfo = item.key;
      if (!tsKeyInfo.uri.includes('://')) tsKeyInfo.uri = new URL(tsKeyInfo.uri, url).toString();

      if (tsKeyInfo?.uri && !result.crypto[tsKeyInfo.uri]) {
        const r = await getRetry(tsKeyInfo.uri);

        if (r.response.statusCode !== 200) {
          logger.error('获取加密 key 失败:', tsKeyInfo.uri, r.response.statusCode, r.data);
        } else {
          result.crypto[tsKeyInfo.uri] = {
            uri: tsKeyInfo.uri,
            method: tsKeyInfo.method.toUpperCase() || 'AES-128',
            iv: typeof tsKeyInfo.iv === 'string' ? new Uint8Array(Buffer.from(tsKeyInfo.iv)) : tsKeyInfo.iv,
            key: r.buffer,
          };
        }
      }
    }

    result.data.push({
      index: i,
      duration: item.duration,
      timeline: item.timeline || result.duration,
      uri: item.uri,
      tsOut: resolve(cacheDir, `${md5(item.uri)}.ts`),
      keyUri: item.key?.uri || '',
      m3u8: url,
    });
    result.duration += item.duration;
  }
  result.duration = +Number(result.duration).toFixed(2);
  return result;
}

// parseM3U8('', 't.m3u8').then(d => console.log(d));
