import { existsSync, promises } from 'node:fs';
import type { OutgoingHttpHeaders } from 'node:http';
import { dirname } from 'node:path';
import { isMainThread, parentPort } from 'node:worker_threads';
import { mkdirp } from '@lzwme/fe-utils';
import type { M3u8Crypto, TsItemInfo, WorkerTaskInfo } from '../types/m3u8';
import { decryptSegmentData } from './crypto.js';
import { getRetry, isOkStatus, logger, sliceByterange, withRangeHeader } from './utils.js';

export async function tsDownload(info: TsItemInfo, cryptoInfo: M3u8Crypto, headers?: OutgoingHttpHeaders | string) {
  try {
    if (existsSync(info.tsOut)) return true;

    // EXT-X-BYTERANGE：多个分片可能共用一个 url，仅通过字节区间区分
    const r = await getRetry(info.uri, withRangeHeader(headers, info.byterange));

    if (isOkStatus(r.response.statusCode)) {
      logger.debug('\n', info);
      const buffer = sliceByterange(r.buffer, info.byterange);
      const data = decryptSegmentData(buffer, cryptoInfo);

      mkdirp(dirname(info.tsOut));
      await promises.writeFile(info.tsOut, data);
      info.tsSize = data.byteLength;

      return true;
    }

    logger.warn('[TS-Download][failed]', r.response.statusCode, info.uri);
  } catch (e) {
    logger.error('[TS-Download][error]', (e as Error)?.message || e || 'unkown');
  }

  return false;
}

if (!isMainThread && parentPort) {
  parentPort.on('message', (data: WorkerTaskInfo) => {
    const startTime = Date.now();
    if (data.options.debug) logger.updateOptions({ levelType: 'debug' });
    tsDownload(data.info, data.crypto, data.options?.headers).then(success => {
      parentPort.postMessage({ success, info: data.info, timeCost: Date.now() - startTime });
    });
  });
}
