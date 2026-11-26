import { promises, statSync } from 'node:fs';
import type { OutgoingHttpHeaders } from 'node:http';
import { dirname } from 'node:path';
import { isMainThread, parentPort } from 'node:worker_threads';
import { mkdirp } from '@lzwme/fe-utils';
import type { M3u8Crypto, TsItemInfo, WorkerTaskInfo } from '../types/m3u8.js';
import { decryptSegmentData } from './crypto.js';
import { getRetry, isOkStatus, logger, sliceByterange, withRangeHeader } from './utils.js';

export async function tsDownload(info: TsItemInfo, cryptoInfo: M3u8Crypto, headers?: OutgoingHttpHeaders | string) {
  try {
    // 断点续传：已落盘的分片直接命中，需要回填大小，否则进度/大小统计会漏算这部分数据
    const cached = statSync(info.tsOut, { throwIfNoEntry: false });
    if (cached?.isFile() && cached.size > 0) {
      info.tsSize = cached.size;
      return true;
    }

    // EXT-X-BYTERANGE：多个分片可能共用一个 url，仅通过字节区间区分
    const r = await getRetry(info.uri, withRangeHeader(headers, info.byterange));

    if (isOkStatus(r.response.statusCode)) {
      logger.debug('\n', info);
      const buffer = sliceByterange(r.buffer, info.byterange);
      const data = decryptSegmentData(buffer, cryptoInfo, info.seq);
      if (!data.byteLength) throw new Error('Empty segment');

      mkdirp(dirname(info.tsOut));
      // 先写临时文件再原子重命名：进程中断或 worker 被 terminate 时不会留下被误判为「已下载」的截断分片
      const tmpFile = `${info.tsOut}.part`;
      await promises.writeFile(tmpFile, data);
      await promises.rename(tmpFile, info.tsOut);
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
