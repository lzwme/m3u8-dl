import { existsSync, promises } from 'node:fs';
import { basename, resolve } from 'node:path';
import { Parser } from 'm3u8-parser';
import type { M3u8Crypto, TsItemInfo } from '../types/m3u8';
import { logger, getRetry } from './utils';

export async function parseM3U8(content: string, url = process.cwd(), cacheDir = './cache') {
  if (!content && url) {
    if (!url.startsWith('http') && existsSync(url)) {
      url = resolve(process.cwd(), url);
      content = await promises.readFile(url, 'utf8');
    } else {
      content = (await getRetry<string>(url)).data;
    }
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
    url = new URL(parser.manifest.playlists[0].uri, url).toString();

    content = (await getRetry<string>(url)).data;
    parser = new Parser();
    parser.push(content);
    parser.end();
  }

  const tsList: {
    uri: string;
    key: { uri: string; method: string; iv?: string | Uint32Array };
    duration: number;
    timeline: number;
  }[] = parser.manifest.segments || [];
  const result = {
    manifest: parser.manifest,
    /** ts 文件数量 */
    tsCount: tsList.length,
    /** 总时长 */
    durationSecond: 0,
    data: [] as TsItemInfo[],
    /** 加密相关信息 */
    crypto: {
      method: 'AES-128',
      iv: new Uint8Array(16),
      key: '',
      uri: '',
    } as M3u8Crypto,
  };

  if (!result.tsCount) {
    logger.error('m3u8 file error!\n', url, content);
    return result;
  }

  const tsKeyInfo = tsList[0].key;

  if (tsKeyInfo?.uri) {
    if (tsKeyInfo.method) result.crypto.method = tsKeyInfo.method.toUpperCase();
    if (tsKeyInfo.iv) {
      result.crypto.iv = typeof tsKeyInfo.iv === 'string' ? new Uint8Array(Buffer.from(tsKeyInfo.iv)) : tsKeyInfo.iv;
    }

    result.crypto.uri = tsKeyInfo.uri.includes('://') ? tsKeyInfo.uri : new URL(tsKeyInfo.uri, url).toString();
  }

  if (result.crypto.uri !== '') {
    const r = await getRetry(result.crypto.uri);
    result.crypto.key = r.buffer;
  }

  for (let i = 0; i < result.tsCount; i++) {
    if (!tsList[i].uri.startsWith('http')) tsList[i].uri = new URL(tsList[i].uri, url).toString();

    result.data.push({
      index: i,
      duration: tsList[i].duration,
      timeline: tsList[i].timeline,
      uri: tsList[i].uri,
      tsOut: `${cacheDir}/${i}-${basename(tsList[i].uri).replace(/\.ts\?.+/, '.ts')}`,
    });
    result.durationSecond += tsList[i].duration;
  }
  result.durationSecond = +Number(result.durationSecond).toFixed(2);
  return result;
}

// parseM3U8('', 't.m3u8').then(d => console.log(d));
