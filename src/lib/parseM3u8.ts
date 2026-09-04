import { existsSync, promises, statSync } from 'node:fs';
import type { OutgoingHttpHeaders } from 'node:http';
import { dirname, resolve } from 'node:path';
import { md5, mkdirp } from '@lzwme/fe-utils';
import { Parser } from 'm3u8-parser';
import type { M3u8ContainerType, M3u8Crypto, M3u8Info, M3u8MapInfo, TsItemInfo } from '../types/m3u8';
import { detectContainerByFile, detectContainerByHeader, detectContainerType, getSegmentExt } from './container';
import { decryptSegmentData } from './crypto';
import { getRetry, isOkStatus, logger, sliceByterange, withRangeHeader } from './utils';

/** m3u8-parser 未完整导出 EXT-X-MAP 上的 key 信息，这里做类型补全 */
type MapInfoRaw = { uri: string; byterange?: { length: number; offset: number }; key?: { method: string; uri: string; iv?: unknown } };

/**
 * 解析 m3u8 文件
 * @param content m3u8 文件的内容，可为 http 远程地址、本地文件路径
 * @param cacheDir 缓存文件保存目录
 */
export async function parseM3U8(content: string, cacheDir = './cache', headers?: OutgoingHttpHeaders | string) {
  let url = process.cwd();

  if (content.startsWith('http')) {
    url = content;
    content = (await getRetry<string>(url, headers)).data;
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
    /** 分片容器类型，默认为 MPEG-TS */
    container: 'ts',
  };

  if (!result.tsCount) {
    logger.error('m3u8 file error!\n', url, content);
    return result;
  }

  /**
   * 解析 EXT-X-MAP 初始化段。
   * fMP4(m4s) 分片的 `ftyp` + `moov` 均位于初始化段中，
   * 缺失初始化段时，所有分片都无法被解码，也无法合并为可播放的 mp4
   */
  const mapInfoList = tsList.filter(d => d.map?.uri).map(d => d.map as MapInfoRaw);
  if (mapInfoList.length > 1) {
    const mapUriList = [...new Set(mapInfoList.map(d => d.uri))];
    if (mapUriList.length > 1) logger.warn('检测到多个 EXT-X-MAP 初始化段，当前仅使用第一个:', mapUriList.join('\n'));
  }

  const mapInfo = mapInfoList[0];
  const initSegment = mapInfo?.uri ? await fetchInitSegment(mapInfo, url, cacheDir, result.crypto, headers) : null;

  if (initSegment) result.initSegment = initSegment;
  result.container = resolveContainer(initSegment, tsList[0].uri);

  const segmentExt = getSegmentExt(result.container);

  /**
   * RFC 8216 §4.3.2.2：`BYTERANGE` 省略 offset 时，区间起始为同一 url 上一个分片结束之后的字节。
   * m3u8-parser 只做字面解析，这里补全隐式 offset，避免共用 url 的分片请求同一区间、缓存文件相互覆盖
   */
  const lastByteEnd = new Map<string, number>();

  for (const [i, item] of tsList.entries()) {
    if (!item.uri.includes('://')) item.uri = new URL(item.uri, url).toString();

    if (item.key) {
      const tsKeyInfo = item.key;
      if (!tsKeyInfo.uri.includes('://')) tsKeyInfo.uri = new URL(tsKeyInfo.uri, url).toString();
      await fetchKeyInfo(tsKeyInfo.method, tsKeyInfo.uri, result.crypto, tsKeyInfo.iv, headers);
    }

    let byterange = item.byterange;
    if (byterange && byterange.offset == null) {
      const prevEnd = lastByteEnd.get(item.uri);
      if (prevEnd != null) byterange = { ...byterange, offset: prevEnd };
    }
    if (byterange) lastByteEnd.set(item.uri, (byterange.offset ?? 0) + byterange.length);

    // 有 byterange 时纳入区间信息作为缓存文件名种子，避免共用 url 的分片相互覆盖
    const nameSeed = byterange ? `${item.uri}@${byterange.offset ?? 0}+${byterange.length}` : item.uri;

    result.data.push({
      index: i,
      duration: item.duration,
      timeline: item.timeline || result.duration,
      uri: item.uri,
      tsOut: resolve(cacheDir, `${md5(nameSeed)}${segmentExt}`),
      byterange,
      keyUri: item.key?.uri || '',
      m3u8: url,
    });
    result.duration += item.duration;
  }
  result.duration = +Number(result.duration).toFixed(2);
  return result;
}

/** 确定分片的容器类型。优先以初始化段的实际文件头为准，其次依据 url 后缀推断 */
function resolveContainer(initSegment: M3u8MapInfo | null, firstSegmentUri: string): M3u8ContainerType {
  if (initSegment?.container && initSegment.container !== 'unknown') return initSegment.container;

  const byUri = detectContainerType(initSegment?.uri || firstSegmentUri);
  if (byUri !== 'unknown') return byUri;

  // 有 EXT-X-MAP 但无法识别时，按 fMP4 处理（EXT-X-MAP 几乎只用于 fMP4/CMAF）
  return initSegment ? 'fmp4' : 'ts';
}

/** 获取并缓存加密 key */
async function fetchKeyInfo(method: string, uri: string, crypto: M3u8Info['crypto'], iv: unknown, headers?: OutgoingHttpHeaders | string) {
  if (!uri || crypto[uri]) return;

  const r = await getRetry(uri, headers);

  if (r.response.statusCode !== 200) {
    logger.error('获取加密 key 失败:', uri, r.response.statusCode, r.data);
    return;
  }

  crypto[uri] = {
    uri,
    method: method?.toUpperCase() || 'AES-128',
    iv: typeof iv === 'string' ? new Uint8Array(Buffer.from(iv)) : (iv as M3u8Crypto['iv']),
    key: r.buffer,
  };
}

/**
 * 下载 `EXT-X-MAP` 声明的初始化段到缓存目录。
 * 初始化段体积通常只有几 KB，在解析阶段直接下载，确保后续合并阶段一定可用
 */
async function fetchInitSegment(
  mapInfo: MapInfoRaw,
  baseUrl: string,
  cacheDir: string,
  crypto: M3u8Info['crypto'],
  headers?: OutgoingHttpHeaders | string
): Promise<M3u8MapInfo | null> {
  const uri = mapInfo.uri.includes('://') ? mapInfo.uri : new URL(mapInfo.uri, baseUrl).toString();
  const result: M3u8MapInfo = { uri, tsOut: '', byterange: mapInfo.byterange, keyUri: '' };

  try {
    if (mapInfo.key?.uri) {
      const keyUri = mapInfo.key.uri.includes('://') ? mapInfo.key.uri : new URL(mapInfo.key.uri, baseUrl).toString();
      await fetchKeyInfo(mapInfo.key.method, keyUri, crypto, mapInfo.key.iv, headers);
      result.keyUri = keyUri;
    }

    // 初始化段本质为 MP4(ftyp+moov)，固定扩展名以保证缓存查找键与落盘文件名一致、缓存可复用
    const tsOut = resolve(cacheDir, `init-${md5(uri)}.mp4`);

    if (existsSync(tsOut) && statSync(tsOut).size > 0) {
      result.tsOut = tsOut;
      result.tsSize = statSync(tsOut).size;
      result.container = detectContainerByFile(tsOut) || detectContainerType(uri);
      return result;
    }

    // EXT-X-MAP 支持 BYTERANGE，此时只请求初始化段所在的字节区间
    const r = await getRetry<Buffer>(uri, withRangeHeader(headers, mapInfo.byterange));

    if (!isOkStatus(r.response.statusCode)) {
      logger.warn('[EXT-X-MAP][failed]', r.response.statusCode, uri, r.data);
      return null;
    }

    if (!r.buffer?.byteLength) {
      logger.warn('[EXT-X-MAP][empty]', uri);
      return null;
    }

    const initBuffer = sliceByterange(r.buffer, mapInfo.byterange);
    const data = decryptSegmentData(initBuffer, result.keyUri ? crypto[result.keyUri] : undefined);
    const container = detectContainerByHeader(data.subarray(0, 256)) || detectContainerType(uri) || 'fmp4';

    mkdirp(dirname(tsOut));
    await promises.writeFile(tsOut, data);

    result.tsOut = tsOut;
    result.tsSize = data.byteLength;
    result.container = container;
    logger.debug('[EXT-X-MAP]', { uri, tsOut, container, size: data.byteLength });

    return result;
  } catch (e) {
    logger.warn('[EXT-X-MAP][error]', uri, (e as Error)?.message || e);
    return null;
  }
}

// parseM3U8('', 't.m3u8').then(d => console.log(d));
