import { createDecipheriv } from 'node:crypto';
import { existsSync, promises } from 'node:fs';
import type { OutgoingHttpHeaders } from 'node:http';
import { dirname } from 'node:path';
import { isMainThread, parentPort } from 'node:worker_threads';
import { mkdirp } from '@lzwme/fe-utils';
import type { M3u8Crypto, TsItemInfo, WorkerTaskInfo } from '../types/m3u8';
import { getRetry, logger } from './utils.js';

export async function tsDownload(info: TsItemInfo, cryptoInfo: M3u8Crypto, headers?: OutgoingHttpHeaders | string) {
  try {
    if (existsSync(info.tsOut)) return true;

    const r = await getRetry(info.uri, headers);

    if (r.response.statusCode === 200) {
      logger.debug('\n', info);
      const data = cryptoInfo?.key ? aesDecrypt(r.buffer, cryptoInfo) : r.buffer;

      mkdirp(dirname(info.tsOut));
      await promises.writeFile(info.tsOut, data);
      info.tsSize = r.buffer.byteLength;

      return true;
    }

    logger.warn('[TS-Download][failed]', r.response.statusCode, info.uri);
  } catch (e) {
    logger.error('[TS-Download][error]', (e as Error)?.message || e || 'unkown');
  }

  return false;
}

function aesDecrypt(data: Buffer, cryptoInfo: M3u8Crypto) {
  try {
    const iv = cryptoInfo.iv || new Uint8Array(16);
    const decipher = createDecipheriv(`${cryptoInfo.method}-cbc`.toLocaleLowerCase(), cryptoInfo.key, iv);
    return Buffer.concat([decipher.update(Buffer.isBuffer(data) ? data : Buffer.from(data)), decipher.final()]);
  } catch (err) {
    console.log('aesDecrypt err:', err);
    throw err;
  }
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
